"""Enhanced sentiment analysis with DistilBERT transformer and lexicon fallback.

Provides two APIs:

1. **String output (legacy)** — :func:`analyze_sentiment` returns ``"positive"``,
   ``"negative"``, or ``"neutral"`` for backward compatibility with existing code.

2. **Detailed output** — :func:`analyze_sentiment_detailed` returns a
   :class:`SentimentResult` with label, negative probability, and source
   (``transformer`` or ``lexicon``).

Configuration:
    - ``settings.sentiment_use_transformer``: enable/disable the DistilBERT engine
    - ``settings.sentiment_model``: HuggingFace model name (default:
      ``distilbert-base-uncased-finetuned-sst-2-english``)

The lexicon fallback now includes negation handling ("not happy" → negative) and
returns a probability score for dual-signal PPD scoring.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from functools import lru_cache

from app.core.config import settings

logger = logging.getLogger(__name__)

NEGATIVE_WORDS = {
    "sad",
    "hopeless",
    "anxious",
    "worthless",
    "cry",
    "crying",
    "tired",
    "alone",
    "angry",
    "panic",
    "depressed",
    "scared",
    "afraid",
    "miserable",
    "overwhelmed",
    "numb",
    "empty",
    "helpless",
    "guilty",
}
POSITIVE_WORDS = {
    "happy",
    "calm",
    "supported",
    "hopeful",
    "good",
    "better",
    "loved",
    "safe",
    "joy",
    "grateful",
    "peaceful",
    "content",
}
NEGATION_WORDS = {"not", "no", "never", "don't", "dont", "can't", "cant", "won't", "wont", "couldn't", "couldnt"}

_transformer_model = None
_tokenizer = None


@dataclass
class SentimentResult:
    label: str  # "positive", "negative", or "neutral"
    negative_prob: float  # 0.0 to 1.0
    source: str  # "transformer" or "lexicon"


@lru_cache
def _load_transformer():
    """Lazy singleton loader for the DistilBERT sentiment classifier."""
    global _transformer_model, _tokenizer  # noqa: PLW0603 - singleton pattern
    if _transformer_model is not None:
        return _transformer_model, _tokenizer
    try:
        import torch
        from transformers import AutoModelForSequenceClassification, AutoTokenizer

        model_name = settings.sentiment_model
        logger.info("Loading sentiment transformer: %s", model_name)
        _tokenizer = AutoTokenizer.from_pretrained(model_name)
        _transformer_model = AutoModelForSequenceClassification.from_pretrained(model_name)
        _transformer_model.eval()
        if torch.cuda.is_available():  # pragma: no cover - GPU availability varies
            _transformer_model = _transformer_model.to("cuda")
            logger.info("Sentiment transformer loaded on GPU")
        else:
            logger.info("Sentiment transformer loaded on CPU")
        return _transformer_model, _tokenizer
    except Exception as exc:  # noqa: BLE001 - import/download can fail many ways
        logger.warning("Failed to load sentiment transformer (%s); falling back to lexicon", exc)
        return None, None


def _analyze_with_transformer(text: str) -> SentimentResult | None:
    """Run DistilBERT sentiment classification, returning None on failure."""
    if not settings.sentiment_use_transformer:
        return None
    model, tokenizer = _load_transformer()
    if model is None or tokenizer is None:
        return None
    try:
        import torch

        inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
        if torch.cuda.is_available() and next(model.parameters()).is_cuda:  # pragma: no cover
            inputs = {key: value.to("cuda") for key, value in inputs.items()}
        with torch.no_grad():
            outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0]
        # DistilBERT SST-2 has label 0 = negative, 1 = positive
        negative_prob = float(probs[0])
        label = "negative" if negative_prob > 0.5 else "positive"
        return SentimentResult(label=label, negative_prob=negative_prob, source="transformer")
    except Exception as exc:  # noqa: BLE001 - inference can fail in many ways
        logger.warning("Transformer sentiment inference failed (%s); falling back to lexicon", exc)
        return None


def _analyze_with_lexicon(text: str) -> SentimentResult:
    """Enhanced lexicon sentiment with negation handling and probability scoring."""
    if not text:
        return SentimentResult(label="neutral", negative_prob=0.5, source="lexicon")

    normalized = text.lower()
    words = [re.sub(r"[^a-z]+", "", word) for word in normalized.split()]

    # Negation flips the next 1–3 words (simple window heuristic).
    negated_indices = set()
    for index, word in enumerate(words):
        if word in NEGATION_WORDS:
            negated_indices.update(range(index + 1, min(index + 4, len(words))))

    negative_count = 0
    positive_count = 0
    for index, word in enumerate(words):
        if word in NEGATIVE_WORDS:
            negative_count += 1 if index not in negated_indices else -1
        elif word in POSITIVE_WORDS:
            positive_count += 1 if index not in negated_indices else -1

    # Rescale to [0, 1] with a sigmoid-like curve
    total_signal = abs(negative_count) + abs(positive_count)
    if total_signal == 0:
        negative_prob = 0.5
        label = "neutral"
    else:
        raw_signal = (negative_count - positive_count) / total_signal
        negative_prob = round(0.5 + 0.4 * raw_signal, 3)  # maps [-1, 1] → [0.1, 0.9]
        if negative_count > positive_count:
            label = "negative"
        elif positive_count > negative_count:
            label = "positive"
        else:
            label = "neutral"
    return SentimentResult(label=label, negative_prob=negative_prob, source="lexicon")


def analyze_sentiment_detailed(text: str | None) -> SentimentResult:
    """Return a detailed :class:`SentimentResult` with label, negative_prob, and source."""
    if not text:
        return SentimentResult(label="neutral", negative_prob=0.5, source="lexicon")
    result = _analyze_with_transformer(text)
    if result is not None:
        return result
    return _analyze_with_lexicon(text)


def analyze_sentiment(text: str | None) -> str:
    """Legacy string-output API for backward compatibility."""
    return analyze_sentiment_detailed(text).label
