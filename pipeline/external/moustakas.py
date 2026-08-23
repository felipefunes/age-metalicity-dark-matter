"""Moustakas, Kennicutt, Tremonti, Dale, Smith & Calzetti 2010, "Optical
Spectroscopy and Nebular Oxygen Abundances of the Spitzer/SINGS Galaxies",
ApJS, 190, 233. VizieR: J/ApJS/190/233.

NOTE: this is the SINGS sample (Spitzer Infrared Nearby Galaxies Survey),
not THINGS (The HI Nearby Galaxy Survey) -- the two surveys share many of
the same nearby galaxies (THINGS was designed as an HI-mapping companion
to SINGS), which is an easy mix-up, but Moustakas+2010 is the SINGS
optical-spectroscopy paper specifically.

table10 (VizieR J/ApJS/190/233/table10) reports oxygen abundances
per-HII-region, not per-galaxy -- 561 HII region measurements across only
38 of the 75 SINGS galaxies, at a range of galactocentric radii (`rho25` =
R/R25). Two strong-line calibrations are reported side by side and are
NOT combined here (they are known to differ systematically):
O/H-a = KK04 (Kobulnicky & Kewley 2004), O/H-b = PT05 (Pilyugin & Thuan
2005). Neither is a direct-Te abundance.

To get one metallicity value per galaxy (this project's schema), each
galaxy's HII regions are fit with a weighted linear gradient, O/H = a +
b*(R/R25), and evaluated at R/R25=0.4 -- the standard "characteristic
abundance" convention in this literature (Zaritsky, Kennicutt & Huchra
1994), applied per calibration. A minimum of 2 HII regions is required to
fit a line at all; 31/38 galaxies with any abundance data meet that bar
(30 have >=3). The number of regions used is kept per galaxy
(n_hii_regions_moustakas) as an audit trail -- a 2-point fit and a
20-point fit are not equally trustworthy, even though both produce a
number.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import pandas as pd
import statsmodels.api as sm

from pipeline.config import EXTERNAL_CACHE_DIR
from pipeline.external.identity import resolve_all

logger = logging.getLogger(__name__)

VIZIER_CATALOG = "J/ApJS/190/233/table10"
CHARACTERISTIC_RADIUS = 0.4  # R/R25
MIN_HII_REGIONS = 2

RAW_CACHE_PATH = EXTERNAL_CACHE_DIR / "moustakas2010_table10.csv"
IDENTITY_CACHE_PATH = EXTERNAL_CACHE_DIR / "identity_cache_moustakas.json"


@dataclass(frozen=True)
class GradientFit:
    value: float
    error: float
    n_regions: int


def fetch_hii_regions(force_refresh: bool = False) -> pd.DataFrame:
    """Fetch (or load from local cache) the full HII-region abundance table."""
    if RAW_CACHE_PATH.exists() and not force_refresh:
        return pd.read_csv(RAW_CACHE_PATH)

    from astroquery.vizier import Vizier

    vizier = Vizier(row_limit=-1)
    df = vizier.get_catalogs(VIZIER_CATALOG)[0].to_pandas()

    RAW_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(RAW_CACHE_PATH, index=False)
    return df


def fit_gradient_at_radius(
    rho25: np.ndarray, oh: np.ndarray, e_oh: np.ndarray, radius: float = CHARACTERISTIC_RADIUS
) -> GradientFit | None:
    """Weighted-least-squares fit of O/H vs R/R25, evaluated at `radius`.

    Returns None if fewer than MIN_HII_REGIONS valid (rho25, oh, e_oh)
    points are available -- a line needs at least 2 points, and this
    project does not report a fit built on fewer than that.
    """
    mask = ~(pd.isna(rho25) | pd.isna(oh) | pd.isna(e_oh)) & (e_oh > 0)
    rho25, oh, e_oh = rho25[mask], oh[mask], e_oh[mask]
    n = len(rho25)
    if n < MIN_HII_REGIONS:
        return None

    design = sm.add_constant(rho25)
    model = sm.WLS(oh, design, weights=1.0 / e_oh**2).fit()
    prediction = model.get_prediction([1.0, radius])
    return GradientFit(value=float(prediction.predicted_mean[0]), error=float(prediction.se_mean[0]), n_regions=n)


def compute_characteristic_abundances(hii_regions: pd.DataFrame) -> pd.DataFrame:
    """One row per SINGS galaxy with a usable gradient fit in at least one
    calibration: name_moustakas, metallicity_kk04, e_metallicity_kk04,
    metallicity_pt05, e_metallicity_pt05, n_hii_regions_moustakas.
    """
    records = []
    for name, group in hii_regions.groupby("Name"):
        kk04 = fit_gradient_at_radius(group["rho25"].values, group["O/H-a"].values, group["e_O/H-a"].values)
        pt05 = fit_gradient_at_radius(group["rho25"].values, group["O/H-b"].values, group["e_O/H-b"].values)
        if kk04 is None and pt05 is None:
            continue
        records.append(
            {
                "name_moustakas": name,
                "metallicity_kk04": kk04.value if kk04 else None,
                "e_metallicity_kk04": kk04.error if kk04 else None,
                "metallicity_pt05": pt05.value if pt05 else None,
                "e_metallicity_pt05": pt05.error if pt05 else None,
                "n_hii_regions_moustakas": max(kk04.n_regions if kk04 else 0, pt05.n_regions if pt05 else 0),
            }
        )

    result = pd.DataFrame.from_records(records)
    n_total_with_any_data = hii_regions["Name"].nunique()
    logger.info(
        "Moustakas: %d/%d SINGS galaxies with abundance data have a fittable (>=%d HII region) gradient",
        len(result), n_total_with_any_data, MIN_HII_REGIONS,
    )
    return result


def compute_moustakas_metallicity(
    sparc_pgc_ids: set[int],
    force_refresh_fetch: bool = False,
    force_refresh_identity: bool = False,
) -> pd.DataFrame:
    """Metallicity (KK04 and PT05, at R=0.4*R25) for SPARC galaxies that
    match a SINGS galaxy with a usable Moustakas+2010 gradient fit.

    Returns columns: pgc_id, metallicity_kk04, e_metallicity_kk04,
    metallicity_pt05, e_metallicity_pt05, n_hii_regions_moustakas.
    """
    hii_regions = fetch_hii_regions(force_refresh=force_refresh_fetch)
    fits = compute_characteristic_abundances(hii_regions)

    identity = resolve_all(
        fits["name_moustakas"].tolist(),
        cache_path=IDENTITY_CACHE_PATH,
        force_refresh=force_refresh_identity,
    )
    merged = fits.merge(
        identity[["name_sparc", "pgc_id"]], left_on="name_moustakas", right_on="name_sparc", how="left"
    )
    merged = merged.dropna(subset=["pgc_id"])
    merged["pgc_id"] = merged["pgc_id"].astype(int)

    matched = merged[merged["pgc_id"].isin(sparc_pgc_ids)]
    logger.info("Moustakas: %d galaxies matched to an existing SPARC PGC id", len(matched))

    return matched[
        ["pgc_id", "metallicity_kk04", "e_metallicity_kk04", "metallicity_pt05", "e_metallicity_pt05",
         "n_hii_regions_moustakas"]
    ].reset_index(drop=True)
