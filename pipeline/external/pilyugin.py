"""Pilyugin, Grebel & Kniazev 2014, "Abundances of Nearby Late-type Galaxies.
I. Data", AJ, 147, 131. VizieR: J/AJ/147/131 (table "galaxies").

Independent of Moustakas et al. 2010 (pipeline/external/moustakas.py) --
different sample selection, different HII-region spectra, different
abundance-gradient fits. Unlike Moustakas's table10, this catalog already
ships one row per galaxy with the central abundance and the radial
gradient already fit by the paper's authors: `[O/H]` = O/H at R=0, and
`C[O/H]1` = the gradient normalized to R/R25 (dex per unit R/R25;
verified against real values, e.g. NGC 0300: [O/H]=8.51, C[O/H]1=-0.519 ->
O/H(0.4 R25) = 8.51 + 0.4*(-0.519) = 8.302, a physically sensible drop).
So this module evaluates the paper's own fit at the same R=0.4*R25
convention used for Moustakas, rather than re-fitting from scratch.

`s_[O/H]` ("scatter of oxygen abundances around the general radial
oxygen abundance trend") is used as the uncertainty on the evaluated
value -- it is the RMS scatter around the fitted line for that galaxy,
not a formal standard error on the R=0.4*R25 point specifically, and is
documented as such rather than treated as an exact SE.
"""
from __future__ import annotations

import logging

import pandas as pd

from pipeline.config import EXTERNAL_CACHE_DIR
from pipeline.external.identity import resolve_all

logger = logging.getLogger(__name__)

VIZIER_CATALOG = "J/AJ/147/131/galaxies"
CHARACTERISTIC_RADIUS = 0.4  # R/R25, same convention as moustakas.py

RAW_CACHE_PATH = EXTERNAL_CACHE_DIR / "pilyugin2014_galaxies.csv"
IDENTITY_CACHE_PATH = EXTERNAL_CACHE_DIR / "identity_cache_pilyugin.json"


def characteristic_abundance(oh_center: float, gradient_per_r25: float, radius: float = CHARACTERISTIC_RADIUS) -> float:
    """O/H at R=radius*R25, from the paper's own central abundance + linear
    gradient (verified against real catalog rows, e.g. NGC 0300:
    oh_center=8.51, gradient_per_r25=-0.519 -> 8.302 at R=0.4*R25)."""
    return oh_center + radius * gradient_per_r25


def fetch_galaxies(force_refresh: bool = False) -> pd.DataFrame:
    if RAW_CACHE_PATH.exists() and not force_refresh:
        return pd.read_csv(RAW_CACHE_PATH)

    from astroquery.vizier import Vizier

    vizier = Vizier(row_limit=-1)
    df = vizier.get_catalogs(VIZIER_CATALOG)[0].to_pandas()

    RAW_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(RAW_CACHE_PATH, index=False)
    return df


def compute_pilyugin_metallicity(
    sparc_pgc_ids: set[int],
    force_refresh_fetch: bool = False,
    force_refresh_identity: bool = False,
) -> pd.DataFrame:
    """metallicity_pilyugin2014 (at R=0.4*R25) for SPARC galaxies matching
    a Pilyugin+2014 galaxy. Returns columns: pgc_id,
    metallicity_pilyugin2014, e_metallicity_pilyugin2014.
    """
    df = fetch_galaxies(force_refresh=force_refresh_fetch)
    df = df.dropna(subset=["[O/H]", "C[O/H]1"]).copy()
    df["metallicity_pilyugin2014"] = characteristic_abundance(df["[O/H]"], df["C[O/H]1"])
    df["e_metallicity_pilyugin2014"] = df["s_[O/H]"]

    identity = resolve_all(
        df["Name"].tolist(),
        cache_path=IDENTITY_CACHE_PATH,
        force_refresh=force_refresh_identity,
    )
    merged = df.merge(identity[["name_sparc", "pgc_id"]], left_on="Name", right_on="name_sparc", how="left")
    merged = merged.dropna(subset=["pgc_id"])
    merged["pgc_id"] = merged["pgc_id"].astype(int)

    matched = merged[merged["pgc_id"].isin(sparc_pgc_ids)]
    logger.info("Pilyugin+2014: %d galaxies matched to an existing SPARC PGC id", len(matched))

    return matched[["pgc_id", "metallicity_pilyugin2014", "e_metallicity_pilyugin2014"]].reset_index(drop=True)
