"""Test coverage for PCOS Kaggle dataset loading, PPD dual-signal scoring, and artifact loading."""

import pytest
from app.ml.preprocess_pcos import detect_format, load_dataset, KAGGLE_HEADER_MAP
from app.ml.portable_forest import PortableRandomForest
from app.services.scoring_engine import EPDScoringEngine
from app.ml.sentiment import analyze_sentiment_detailed


class TestKaggleDatasetLoading:
    """Test Kaggle PCOS dataset parsing with fuzzy header matching."""

    def test_detect_kaggle_format(self):
        headers_variants = [
            ["PCOS (Y/N)", "Age (yrs)", "Weight (Kg)", "BMI", "Cycle(R/I)"],
            ["pcosyn", "ageyrs", "weightkg", "bmi", "cycleri"],
            ["PCOS.Y.N.", "Age..yrs.", "Weight..Kg."],
        ]
        for headers in headers_variants:
            assert detect_format(headers) == "kaggle"

    def test_detect_simple_format(self):
        headers = ["age", "bmi", "cycle_irregularity", "pcos"]
        assert detect_format(headers) == "simple"

    def test_kaggle_header_normalization(self):
        from app.ml.preprocess_pcos import normalize_header

        assert normalize_header("PCOS (Y/N)") == "pcosyn"
        assert normalize_header("Age (yrs)") == "ageyrs"
        assert normalize_header("Follicle No. (L)") == "folliclenol"

    def test_kaggle_required_columns_present(self):
        from app.ml.preprocess_pcos import KAGGLE_REQUIRED

        # Ensure the mapping covers all required fields
        mapped_fields = set(KAGGLE_HEADER_MAP.values())
        assert KAGGLE_REQUIRED.issubset(mapped_fields)


class TestPortableRandomForest:
    """Test sklearn-free portable Random Forest inference."""

    def test_export_and_load_roundtrip(self):
        try:
            from sklearn.ensemble import RandomForestClassifier
            from app.ml.portable_forest import export_sklearn_forest
        except ImportError:
            pytest.skip("sklearn not installed")

        # Train a tiny forest
        X = [[1, 2], [3, 4], [5, 6], [7, 8]]
        y = [0, 0, 1, 1]
        clf = RandomForestClassifier(n_estimators=3, random_state=42)
        clf.fit(X, y)

        # Export to portable
        portable = export_sklearn_forest(clf, ["feat1", "feat2"], metadata={"test": True})
        assert len(portable.trees) == 3
        assert portable.classes == [0, 1]
        assert portable.feature_names == ["feat1", "feat2"]
        assert portable.metadata["test"] is True

        # Predict via portable
        probs_portable = portable.predict_proba([[1, 2], [7, 8]])
        probs_sklearn = clf.predict_proba([[1, 2], [7, 8]])

        # Should match within float precision
        for i in range(2):
            for j in range(2):
                assert abs(probs_portable[i][j] - probs_sklearn[i][j]) < 1e-6

    def test_portable_forest_save_load(self, tmp_path):
        portable = PortableRandomForest(
            trees=[
                {
                    "children_left": [-1],
                    "children_right": [-1],
                    "feature": [0],
                    "threshold": [0.0],
                    "value": [[5.0, 3.0]],
                }
            ],
            classes=[0, 1],
            feature_names=["age", "bmi"],
            metadata={"version": "1.0"},
        )
        path = tmp_path / "model.json"
        portable.save(path)
        loaded = PortableRandomForest.load(path)
        assert loaded.classes == [0, 1]
        assert loaded.feature_names == ["age", "bmi"]
        assert loaded.metadata["version"] == "1.0"


class TestEPDSReverseScoring:
    """Test clinically correct EPDS reverse-scoring (items 1, 2, 4)."""

    def test_all_zeros(self):
        """Healthiest answer on every item must score 0/30 (published instrument semantics)."""
        engine = EPDScoringEngine()
        assert engine.score([0] * 10) == 0

    def test_all_threes(self):
        """Most distressed answer on every item must score the maximum 30/30."""
        engine = EPDScoringEngine()
        assert engine.score([3] * 10) == 30

    def test_mixed_answers(self):
        engine = EPDScoringEngine()
        answers = [3, 0, 1, 1, 1, 1, 1, 1, 1, 1]
        # Answers arrive as published item scores, so the total is their plain sum: 3 + 0 + 8*1
        assert engine.score(answers) == 11

    def test_score_is_plain_sum_of_item_scores(self):
        """The UI renders the published score next to each option, so no re-inversion happens."""
        engine = EPDScoringEngine()
        answers = [0, 3, 2, 1, 0, 3, 1, 2, 0, 1]
        assert engine.score(answers) == sum(answers)

    def test_item_10_self_harm_flag(self):
        engine = EPDScoringEngine()
        answers = [0] * 9 + [2]  # Item 10 > 0
        risk = engine.classify(engine.score(answers), answers, 0.3)
        from app.models.enums import RiskLevel

        assert risk == RiskLevel.HIGH


class TestDualSignalScoring:
    """Test combined EPDS + sentiment risk scoring."""

    def test_dual_signal_formula(self):
        engine = EPDScoringEngine()
        # EPDS=15 (normalized 0.5), sentiment=0.8 → 0.7*0.5 + 0.3*0.8 = 0.59
        score = engine.dual_signal_score(15, 0.8)
        assert 0.58 <= score <= 0.60

    def test_high_risk_from_epds(self):
        engine = EPDScoringEngine()
        answers = [3] * 10
        score = engine.score(answers)
        combined = engine.dual_signal_score(score, 0.5)
        risk = engine.classify(score, answers, combined)
        from app.models.enums import RiskLevel

        assert risk == RiskLevel.HIGH

    def test_high_risk_from_item_10(self):
        engine = EPDScoringEngine()
        answers = [0] * 9 + [1]
        score = engine.score(answers)
        combined = engine.dual_signal_score(score, 0.2)
        risk = engine.classify(score, answers, combined)
        from app.models.enums import RiskLevel

        assert risk == RiskLevel.HIGH

    def test_moderate_risk_from_combined_score(self):
        engine = EPDScoringEngine()
        answers = [1, 1, 1, 1, 2, 2, 1, 1, 1, 0]  # EPDS 11, below the HIGH cutoff of 13
        score = engine.score(answers)
        assert score == 11
        combined = engine.dual_signal_score(score, 0.7)
        risk = engine.classify(score, answers, combined)
        from app.models.enums import RiskLevel

        assert risk == RiskLevel.MODERATE

    def test_moderate_tier_is_reachable(self):
        """Regression: MODERATE must be achievable (it was mathematically unreachable before)."""
        engine = EPDScoringEngine()
        answers = [1, 1, 1, 1, 2, 2, 1, 1, 1, 0]  # 11
        combined = engine.dual_signal_score(11, 0.7)
        assert combined < 0.60  # old cutoff could never be reached at EPDS < 13
        assert engine.classify(11, answers, combined).value == "moderate"

    def test_low_tier_for_low_scores(self):
        engine = EPDScoringEngine()
        answers = [0, 1, 0, 1, 1, 0, 1, 0, 0, 0]  # EPDS 4
        score = engine.score(answers)
        assert score == 4
        risk = engine.classify(score, answers, engine.dual_signal_score(score, 0.2))
        from app.models.enums import RiskLevel

        assert risk == RiskLevel.LOW

    def test_high_tier_from_epds_13(self):
        engine = EPDScoringEngine()
        answers = [2, 2, 1, 2, 1, 1, 1, 1, 1, 1]  # EPDS 13
        score = engine.score(answers)
        assert score == 13
        risk = engine.classify(score, answers, engine.dual_signal_score(score, 0.5))
        from app.models.enums import RiskLevel

        assert risk == RiskLevel.HIGH


class TestSentimentAnalysis:
    """Test DistilBERT + lexicon fallback sentiment analysis."""

    def test_lexicon_negative(self):
        result = analyze_sentiment_detailed("I feel sad and hopeless today")
        assert result.label == "negative"
        assert result.negative_prob > 0.5
        assert result.source == "lexicon" or result.source == "transformer"

    def test_lexicon_positive(self):
        result = analyze_sentiment_detailed("I am happy and grateful")
        assert result.label == "positive"
        assert result.negative_prob < 0.5

    def test_negation_handling(self):
        result = analyze_sentiment_detailed("I am not happy at all")
        # Negation should flip "happy" → negative
        assert result.negative_prob > 0.5 or result.label == "negative"

    def test_neutral_text(self):
        result = analyze_sentiment_detailed("The weather is fine.")
        assert result.label in {"neutral", "positive"}

    def test_empty_text(self):
        result = analyze_sentiment_detailed("")
        assert result.label == "neutral"
        assert result.negative_prob == 0.5


class TestModelLoader:
    """Test PCOS model loading cascade (pickle → JSON → fallback)."""

    def test_fallback_when_no_artifacts(self, monkeypatch):
        from app.ml.model_loader import load_pcos_model, RuleBasedPCOSFallback

        # Patch settings to point to nonexistent files
        monkeypatch.setattr("app.ml.model_loader.settings.pcos_model_path", "/tmp/nonexistent.pkl")
        monkeypatch.setattr("app.ml.model_loader.settings.pcos_model_json_path", "/tmp/nonexistent.json")
        # The loader is lru_cached: clear it so patched settings actually apply, and clear
        # again afterwards so later tests in this session reload the real artifact.
        load_pcos_model.cache_clear()
        try:
            model = load_pcos_model()
            assert isinstance(model, RuleBasedPCOSFallback)
        finally:
            load_pcos_model.cache_clear()

    def test_rule_fallback_output_shape(self):
        from app.ml.model_loader import RuleBasedPCOSFallback

        fallback = RuleBasedPCOSFallback()
        features = [[25, 28, 1, 1, 1, 1, 15]]  # age, bmi, flags, follicle_count
        probs = fallback.predict_proba(features)
        assert len(probs) == 1
        assert len(probs[0]) == 2
        assert 0 <= probs[0][1] <= 1  # probability in [0, 1]
