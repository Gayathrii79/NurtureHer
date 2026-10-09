"""Canonical PCOS feature order shared by training, preprocessing, and inference.

Kept dependency-free so dataset tooling and tests can run without the API stack.
"""

FEATURE_ORDER = [
    "age",
    "bmi",
    "cycle_irregularity",
    "hair_growth",
    "skin_darkening",
    "weight_gain",
    "follicle_count",
]
