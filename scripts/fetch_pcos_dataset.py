"""Download the Kaggle PCOS dataset CSV mirror for training.

The canonical dataset is on Kaggle:
  https://www.kaggle.com/datasets/prasoonkottarathil/polycystic-ovary-syndrome-pcos

Sources:
- Kottarathil, P. (2020). Polycystic ovary syndrome (PCOS). Kaggle.
- letisalba/DATA_608 (GitHub) — 541-row CSV conversion of the original xlsx

This script downloads a public CSV mirror via a fallback chain (primary: letisalba/DATA_608,
which properly cites the Kaggle source). If all mirrors fail, it prints manual instructions.

Usage::

    python -m scripts.fetch_pcos_dataset
"""

import sys
from pathlib import Path

try:
    import pandas as pd
except ImportError:
    sys.exit(
        "This script requires pandas and openpyxl.\n"
        "Install them: pip install pandas openpyxl --break-system-packages"
    )

PROJECT_ROOT = Path(__file__).parent.parent
DATA_DIR = PROJECT_ROOT / "data" / "pcos"
TARGET = DATA_DIR / "pcos_data_without_infertility.csv"

MIRRORS = [
    (
        "letisalba/DATA_608",
        "https://raw.githubusercontent.com/letisalba/DATA_608/master/Final%20Project/csv/PCOSData_without_infertility.csv",
    ),
]

KAGGLE_INSTRUCTIONS = """
Dataset download failed. Manual Kaggle download:

1. Visit: https://www.kaggle.com/datasets/prasoonkottarathil/polycystic-ovary-syndrome-pcos
2. Download PCOS_data_without_infertility.xlsx (or a CSV conversion)
3. Place it at: {target}
4. Run: python -m app.ml.train_pcos --input {target}

The training script auto-detects both .xlsx and .csv formats.

Alternate download via kaggle CLI (if you have an API token):
  kaggle datasets download prasoonkottarathil/polycystic-ovary-syndrome-pcos -p {data_dir}
  unzip {data_dir}/polycystic-ovary-syndrome-pcos.zip -d {data_dir}
  mv {data_dir}/PCOS_data_without_infertility.xlsx {data_dir}/
"""


def fetch() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if TARGET.exists():
        print(f"Dataset already exists at {TARGET}")
        return

    for label, url in MIRRORS:
        print(f"Attempting download from {label}...")
        try:
            df = pd.read_csv(url, encoding="utf-8-sig")
            if df.empty or len(df) < 100:
                print(f"  Warning: {label} returned only {len(df)} rows, trying next mirror")
                continue
            df.to_csv(TARGET, index=False, encoding="utf-8")
            print(f"Downloaded {len(df)} rows to {TARGET}")
            print(f"Citation: Kottarathil, P. (2020). PCOS [Kaggle]. Mirror: {label}")
            return
        except Exception as exc:  # noqa: BLE001 - network fetch can fail many ways
            print(f"  Failed ({type(exc).__name__}: {exc})")

    print("\n" + KAGGLE_INSTRUCTIONS.format(target=TARGET, data_dir=DATA_DIR))
    sys.exit(1)


if __name__ == "__main__":
    fetch()
