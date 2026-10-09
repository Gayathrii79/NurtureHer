"""Train the NurtureHer PCOS Random Forest classifier.

Typical usage (after downloading the Kaggle dataset)::

    python -m scripts.fetch_pcos_dataset
    python -m app.ml.train_pcos --input data/pcos/pcos_data_without_infertility.csv

Outputs:
    app/ml/artifacts/pcos_random_forest.pkl    (native sklearn pickle)
    app/ml/artifacts/pcos_random_forest.json   (portable, sklearn-free runtime artifact)
    app/ml/artifacts/pcos_model_meta.json      (metrics + provenance for auditing)
"""

import argparse
import json
import pickle
from datetime import datetime, timezone
from pathlib import Path

from app.ml.features import FEATURE_ORDER
from app.ml.portable_forest import export_sklearn_forest
from app.ml.preprocess_pcos import load_dataset


def train_random_forest(
    input_path: str,
    output_model: str = "app/ml/artifacts/pcos_random_forest.pkl",
    n_estimators: int = 200,
    random_state: int = 42,
    test_size: float = 0.2,
    dataset_format: str = "auto",
) -> dict:
    try:
        import sklearn
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.metrics import (
            accuracy_score,
            classification_report,
            f1_score,
            precision_score,
            recall_score,
            roc_auc_score,
        )
        from sklearn.model_selection import cross_val_score, train_test_split
    except ImportError as exc:
        raise RuntimeError("Install scikit-learn to train the PCOS model") from exc

    features, labels, detected_format = load_dataset(input_path, dataset_format)
    x_train, x_test, y_train, y_test = train_test_split(
        features, labels, test_size=test_size, random_state=random_state, stratify=labels
    )
    model = RandomForestClassifier(n_estimators=n_estimators, random_state=random_state, class_weight="balanced")
    model.fit(x_train, y_train)

    predictions = model.predict(x_test)
    probabilities = [row[1] for row in model.predict_proba(x_test)]
    cv_scores = cross_val_score(
        RandomForestClassifier(n_estimators=n_estimators, random_state=random_state, class_weight="balanced"),
        features,
        labels,
        cv=5,
    )

    metrics = {
        "accuracy": round(float(accuracy_score(y_test, predictions)), 4),
        "precision": round(float(precision_score(y_test, predictions)), 4),
        "recall": round(float(recall_score(y_test, predictions)), 4),
        "f1": round(float(f1_score(y_test, predictions)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, probabilities)), 4),
        "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
    }
    print(classification_report(y_test, predictions))
    print(f"Metrics: {json.dumps(metrics, indent=2)}")

    metadata = {
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "dataset": str(input_path),
        "dataset_format": detected_format,
        "samples": len(labels),
        "positive_samples": int(sum(labels)),
        "sklearn_version": sklearn.__version__,
        "n_estimators": n_estimators,
        "feature_names": list(FEATURE_ORDER),
        "feature_importances": {
            name: round(float(importance), 4)
            for name, importance in zip(FEATURE_ORDER, model.feature_importances_)
        },
        "metrics": metrics,
        "citation": "Kottarathil, P. (2020). Polycystic ovary syndrome (PCOS) [Kaggle dataset].",
    }

    output_path = Path(output_model)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("wb") as model_file:
        pickle.dump(model, model_file)
    print(f"Saved sklearn model to {output_path}")

    portable = export_sklearn_forest(
        model,
        FEATURE_ORDER,
        metadata={"trained_at": metadata["trained_at"], "metrics": metrics},
    )
    json_path = output_path.with_suffix(".json")
    portable.save(json_path)
    print(f"Saved portable (sklearn-free) model to {json_path}")

    meta_path = output_path.parent / "pcos_model_meta.json"
    with meta_path.open("w", encoding="utf-8") as meta_file:
        json.dump(metadata, meta_file, indent=2)
    print(f"Saved training metadata to {meta_path}")
    return metadata


def main() -> None:
    parser = argparse.ArgumentParser(description="Train NurtureHer PCOS RandomForest model")
    parser.add_argument("--input", required=True, help="Training dataset path (.csv or Kaggle .xlsx)")
    parser.add_argument("--output", default="app/ml/artifacts/pcos_random_forest.pkl", help="Output pickle path")
    parser.add_argument("--format", default="auto", choices=["auto", "simple", "kaggle"], dest="dataset_format")
    parser.add_argument("--estimators", type=int, default=200)
    parser.add_argument("--test-size", type=float, default=0.2)
    args = parser.parse_args()
    train_random_forest(
        args.input,
        args.output,
        n_estimators=args.estimators,
        test_size=args.test_size,
        dataset_format=args.dataset_format,
    )


if __name__ == "__main__":
    main()
