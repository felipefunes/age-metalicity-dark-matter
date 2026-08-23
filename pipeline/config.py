"""Shared configuration for the pipeline: paths, URLs, and physical defaults.

All paths are derived from this file's location so the pipeline runs the
same way regardless of the OS or the current working directory.
"""
from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

DATA_RAW_DIR = REPO_ROOT / "data" / "raw" / "sparc"
DATA_PROCESSED_DIR = REPO_ROOT / "data" / "processed"
EXTERNAL_CACHE_DIR = REPO_ROOT / "data" / "raw" / "external"

DEFAULT_DB_PATH = DATA_PROCESSED_DIR / "galaxies.sqlite"

SPARC_BASE_URL = "https://astroweb.case.edu/SPARC"
SPARC_FILES = {
    "sparc_main": "SPARC_Lelli2016c.mrt",
    "mass_models": "MassModels_Lelli2016c.mrt",
}

# Mass-to-light ratios at [3.6 um], solMass/solLum, applied to the
# tabulated (M/L=1) disk/bulge velocity contributions from MassModels.
# These are the canonical "maximum disk"-adjacent defaults used across the
# SPARC papers (Lelli, McGaugh & Schombert 2016) for a diet-Salpeter IMF.
DEFAULT_UPSILON_DISK = 0.5
DEFAULT_UPSILON_BULGE = 0.7

# Coordinate cross-match tolerance for the identity-resolution fallback.
DEFAULT_COORD_TOLERANCE_ARCSEC = 5.0

# Env overrides so this can be tuned in CI / docker-compose without code edits.
UPSILON_DISK = float(os.environ.get("UPSILON_DISK", DEFAULT_UPSILON_DISK))
UPSILON_BULGE = float(os.environ.get("UPSILON_BULGE", DEFAULT_UPSILON_BULGE))
COORD_TOLERANCE_ARCSEC = float(
    os.environ.get("COORD_TOLERANCE_ARCSEC", DEFAULT_COORD_TOLERANCE_ARCSEC)
)
DB_PATH = Path(os.environ.get("DB_PATH", str(DEFAULT_DB_PATH)))

for _d in (DATA_RAW_DIR, DATA_PROCESSED_DIR, EXTERNAL_CACHE_DIR):
    _d.mkdir(parents=True, exist_ok=True)
