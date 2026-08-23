"""z0MGS (Leroy et al. 2019, "Z0MGS: A Comprehensive, Panchromatic Set of
Physical Star Formation Rate and Stellar Mass Maps for Nearby Galaxies",
ApJS, 244, 24). VizieR: J/ApJS/244/24, table4 ("SFR and M* estimates for
local galaxies") -- the per-galaxy integrated values, not the pixel maps.

Produces a specific star formation rate (sSFR = SFR / M*) as a PROXY for
stellar-population age -- low sSFR suggests an older, less actively
star-forming population -- but it is not itself an age, and is stored as
`age_proxy_ssfr`, never mixed into the `age_gyr` column that is reserved
for an actual stellar-population-synthesis age. Reported as
log10(sSFR / yr^-1), matching the log-space units z0MGS itself reports
(logSFR, logM*) rather than converting to linear space and reintroducing
the same multi-order-of-magnitude dynamic range problem this project has
already had to reason about once for L[3.6] (see
docs/findings/2026-08-22_hubble_mass_dm_v2_log_control_check.md).

Identity: unlike Moustakas/Pilyugin, table4 already ships a `PGC` column
per row (verified: 0/15748 rows null, 0 duplicate PGC values), curated by
the z0MGS authors themselves. This is joined directly on pgc_id instead
of being run back through the Simbad/NED name/coordinate resolver
(pipeline/external/identity.py) -- a direct join against an
already-curated PGC id is more accurate than re-deriving one, and
re-resolving would only add risk of introducing a mismatch. See
pipeline/external/README.md.
"""
from __future__ import annotations

import logging

import numpy as np
import pandas as pd

from pipeline.config import EXTERNAL_CACHE_DIR

logger = logging.getLogger(__name__)

VIZIER_CATALOG = "J/ApJS/244/24/table4"
RAW_CACHE_PATH = EXTERNAL_CACHE_DIR / "z0mgs_table4.csv"


def log_ssfr(log_sfr, log_mstar):
    """log10(sSFR / yr^-1) = log10(SFR) - log10(M*), both already in log
    space as z0MGS reports them."""
    return log_sfr - log_mstar


def propagate_log_ssfr_error(e_log_sfr, e_log_mstar):
    """Independent-uncertainty propagation for a log-space difference.
    Documented simplification: SFR and M* uncertainties from the same SED
    fit may share systematics, so this is an approximation, not an exact
    covariance-aware error."""
    return np.sqrt(np.asarray(e_log_sfr) ** 2 + np.asarray(e_log_mstar) ** 2)


def fetch_table(force_refresh: bool = False) -> pd.DataFrame:
    if RAW_CACHE_PATH.exists() and not force_refresh:
        return pd.read_csv(RAW_CACHE_PATH)

    from astroquery.vizier import Vizier

    vizier = Vizier(row_limit=-1)
    df = vizier.get_catalogs(VIZIER_CATALOG)[0].to_pandas()

    RAW_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(RAW_CACHE_PATH, index=False)
    return df


def compute_ssfr(sparc_pgc_ids: set[int], force_refresh_fetch: bool = False) -> pd.DataFrame:
    """age_proxy_ssfr (log10 sSFR/yr^-1) for SPARC galaxies with a PGC match
    in z0MGS. Returns columns: pgc_id, age_proxy_ssfr, e_age_proxy_ssfr,
    age_proxy_source, age_proxy_method.
    """
    df = fetch_table(force_refresh=force_refresh_fetch)
    df = df.dropna(subset=["PGC", "logM*", "logSFR"]).copy()
    df["pgc_id"] = df["PGC"].astype(int)

    matched = df[df["pgc_id"].isin(sparc_pgc_ids)].copy()
    matched["age_proxy_ssfr"] = log_ssfr(matched["logSFR"], matched["logM*"])
    matched["e_age_proxy_ssfr"] = propagate_log_ssfr_error(matched["e_logSFR"], matched["e_logM*"])
    matched["age_proxy_source"] = "z0mgs"
    matched["age_proxy_method"] = "galex_wise_sed"

    logger.info("z0MGS: %d galaxies matched to an existing SPARC PGC id (direct PGC join)", len(matched))

    return matched[
        ["pgc_id", "age_proxy_ssfr", "e_age_proxy_ssfr", "age_proxy_source", "age_proxy_method"]
    ].reset_index(drop=True)
