"""Portable Random Forest inference without scikit-learn at runtime.

``train_pcos.py`` exports the fitted sklearn ``RandomForestClassifier`` to a
plain JSON structure (one dict of flat arrays per tree). ``PortableRandomForest``
re-implements ``predict_proba`` over that structure so production deployments
only need the JSON artifact -- no pickle loading and no sklearn version pinning.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_LEAF = -1


class PortableRandomForest:
    def __init__(
        self,
        trees: list[dict[str, list]],
        classes: list[int],
        feature_names: list[str] | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        self.trees = trees
        self.classes = classes
        self.feature_names = feature_names or []
        self.metadata = metadata or {}

    def predict_proba(self, values: list[list[float]]) -> list[list[float]]:
        return [self._predict_single([float(value) for value in sample]) for sample in values]

    def _predict_single(self, sample: list[float]) -> list[float]:
        totals = [0.0] * len(self.classes)
        for tree in self.trees:
            children_left = tree["children_left"]
            children_right = tree["children_right"]
            feature = tree["feature"]
            threshold = tree["threshold"]
            node = 0
            while children_left[node] != _LEAF:
                node = children_left[node] if sample[feature[node]] <= threshold[node] else children_right[node]
            distribution = tree["value"][node]
            weight = sum(distribution) or 1.0
            for index, count in enumerate(distribution):
                totals[index] += count / weight
        tree_count = len(self.trees) or 1
        return [total / tree_count for total in totals]

    def to_dict(self) -> dict[str, Any]:
        return {
            "model_type": "random_forest",
            "classes": self.classes,
            "feature_names": self.feature_names,
            "metadata": self.metadata,
            "trees": self.trees,
        }

    @classmethod
    def from_dict(cls, payload: dict[str, Any]) -> "PortableRandomForest":
        if payload.get("model_type") != "random_forest":
            raise ValueError("Unsupported portable model type")
        return cls(
            trees=payload["trees"],
            classes=payload["classes"],
            feature_names=payload.get("feature_names"),
            metadata=payload.get("metadata"),
        )

    @classmethod
    def load(cls, path: str | Path) -> "PortableRandomForest":
        with Path(path).open("r", encoding="utf-8") as file:
            return cls.from_dict(json.load(file))

    def save(self, path: str | Path) -> None:
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        with target.open("w", encoding="utf-8") as file:
            json.dump(self.to_dict(), file)


def export_sklearn_forest(
    model: Any,
    feature_names: list[str],
    metadata: dict[str, Any] | None = None,
) -> PortableRandomForest:
    """Convert a fitted sklearn ``RandomForestClassifier`` into a portable model."""
    trees: list[dict[str, list]] = []
    for estimator in model.estimators_:
        tree = estimator.tree_
        trees.append(
            {
                "children_left": [int(value) for value in tree.children_left],
                "children_right": [int(value) for value in tree.children_right],
                "feature": [int(value) for value in tree.feature],
                "threshold": [float(value) for value in tree.threshold],
                "value": [[float(count) for count in node[0]] for node in tree.value],
            }
        )
    classes = [int(cls_) for cls_ in model.classes_]
    return PortableRandomForest(trees=trees, classes=classes, feature_names=list(feature_names), metadata=metadata or {})
