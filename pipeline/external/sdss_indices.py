"""Stellar-age spectral indices measured directly from SDSS spectra, rather
than taken from a pre-computed third-party catalog.

Why direct measurement instead of a catalog: the obvious existing resource,
Gallazzi, Charlot, Brinchmann, White & Tremonti 2005 (MNRAS, 362, 41,
"The ages and metallicities of galaxies in the local universe") -- not on
VizieR, only at the MPA-Garching group's own site, identified by SDSS
plate/MJD/fiber, not by name/coordinates -- was checked and gives only
n=13 usable matches to this project's 163 SPARC galaxies: 43/163 do have
an SDSS spectrum within 5 arcsec (verified by direct positional query,
0 errors), but only 18/43 are even present in that (2006-vintage, SDSS
DR4) catalog at all -- most of the missing ones were observed after 2012
(SDSS-III/BOSS era), simply too late for that catalog to have processed --
and 5 of those 18 fail its own quality cut. See
docs/findings/2026-08-23_stellar_age_gallazzi_attempt.md.

Measuring indices directly from the 43 already-matched spectra sidesteps
the catalog-vintage problem entirely, at the cost of doing the spectral
measurement ourselves:

- Dn4000 (Balogh, Morris, Yee, Carlberg & Ellingson 1999, ApJ, 527, 54):
  the narrow 4000-Angstrom-break definition, ratio of the mean flux
  density per unit FREQUENCY (Fnu, not Flambda -- verified against the
  literature) in 4000-4100 Angstrom (red) over 3850-3950 Angstrom (blue),
  rest frame. A light-weighted age indicator: higher Dn4000 means an
  older/more quiescent stellar population.

- Hdelta_A (Worthey & Ottaviani 1997, ApJS, 111, 377): a Lick absorption
  index, measured together with Dn4000 (Kauffmann et al. 2003, MNRAS,
  341, 33 and 54) to separate a genuinely old, quiescent population from
  one with a recent star-formation burst superimposed on an old
  population -- both can look similar in Dn4000 alone. Lick indices are
  defined at the classical Lick/IDS instrumental resolution, which is
  wavelength-dependent and much coarser than SDSS's native resolution
  (verified: ~10 Angstrom FWHM at Hdelta_A's wavelength via the Worthey &
  Ottaviani 1997 quadratic sigma(lambda) relation, vs ~2.3 Angstrom FWHM
  native SDSS resolution measured directly from each spectrum's `wdisp`
  column) -- so each spectrum is convolved with a wavelength-dependent
  Gaussian kernel (matching the two resolutions in quadrature) before the
  index is measured, or it would not be on the same system as the SSP
  model grids it's meant to be compared against.

IMPORTANT -- these are NOT a resolution of the classical age-metallicity
degeneracy (Worthey 1994, ApJS, 95, 107): a stronger absorption index can
mean an older population or a more metal-rich one, and Dn4000/Hdelta_A
alone cannot tell which. The Dn4000-Hdelta_A diagram only resolves a
narrower, different ambiguity (old-quiescent vs. young-burst-on-old).
See the dedicated methodology-limitations section in
docs/findings/2026-08-23_dn4000_hdelta_a.md before interpreting any
correlation between age_proxy_dn4000/age_proxy_hdelta_a and metallicity.
"""
from __future__ import annotations

import json
import logging
from dataclasses import dataclass

import numpy as np
import pandas as pd

from pipeline.config import EXTERNAL_CACHE_DIR

logger = logging.getLogger(__name__)

# Balogh et al. 1999 narrow Dn4000 bandpasses (rest-frame Angstrom).
DN4000_BLUE = (3850.0, 3950.0)
DN4000_RED = (4000.0, 4100.0)

# Worthey & Ottaviani 1997 HdeltaA Lick bandpasses (rest-frame Angstrom).
HDELTA_A_BLUE_CONT = (4041.60, 4079.75)
HDELTA_A_FEATURE = (4083.50, 4122.25)
HDELTA_A_RED_CONT = (4128.50, 4161.00)

SPEED_OF_LIGHT_AA_PER_S = 2.99792458e18
SDSS_LOGLAM_STEP = 1.0e-4  # standard SDSS coadd pixel scale in log10(Angstrom)
FWHM_OVER_SIGMA = 2.354820045  # 2*sqrt(2*ln2)


@dataclass(frozen=True)
class Spectrum:
    """A fetched SDSS spectrum, already carrying what index measurement needs."""

    wave_obs: np.ndarray
    flux: np.ndarray
    ivar: np.ndarray
    good: np.ndarray  # boolean mask: ivar > 0 and no AND-mask flags set
    wdisp_px: np.ndarray  # native instrumental sigma, in pixels
    z: float


@dataclass(frozen=True)
class IndexResult:
    value: float | None
    error: float | None
    n_good: int


# --------------------------------------------------------------------------
# Dn4000
# --------------------------------------------------------------------------


def to_fnu(wave_obs_aa: np.ndarray, flux_flambda: np.ndarray) -> np.ndarray:
    """Flambda (per unit wavelength) -> Fnu (per unit frequency): Fnu = Flambda * lambda^2 / c.
    Dn4000 is defined on Fnu, not Flambda (verified against the literature) --
    using Flambda directly would bias the ratio."""
    return flux_flambda * wave_obs_aa**2 / SPEED_OF_LIGHT_AA_PER_S


def _weighted_band_mean(
    rest_wave: np.ndarray, values: np.ndarray, ivar_values: np.ndarray, good: np.ndarray, band: tuple[float, float]
) -> tuple[float | None, float | None, int]:
    mask = good & (rest_wave >= band[0]) & (rest_wave < band[1]) & (ivar_values > 0)
    n = int(mask.sum())
    if n == 0:
        return None, None, 0
    weights = ivar_values[mask]
    weight_sum = weights.sum()
    if weight_sum <= 0:
        return None, None, n
    mean = float(np.sum(values[mask] * weights) / weight_sum)
    error = float(np.sqrt(1.0 / weight_sum))
    return mean, error, n


def compute_dn4000(spectrum: Spectrum) -> IndexResult:
    """Dn4000 = mean Fnu(4000-4100 rest) / mean Fnu(3850-3950 rest), inverse-
    variance-weighted within each band, errors propagated as a ratio of two
    independent uncertain quantities (the two bands share no pixels)."""
    rest_wave = spectrum.wave_obs / (1.0 + spectrum.z)
    fnu = to_fnu(spectrum.wave_obs, spectrum.flux)
    # ivar transforms as 1/scale^2 under a linear rescale of the variable.
    scale = spectrum.wave_obs**2 / SPEED_OF_LIGHT_AA_PER_S
    ivar_fnu = np.where(scale > 0, spectrum.ivar / scale**2, 0.0)

    blue_mean, blue_err, n_blue = _weighted_band_mean(rest_wave, fnu, ivar_fnu, spectrum.good, DN4000_BLUE)
    red_mean, red_err, n_red = _weighted_band_mean(rest_wave, fnu, ivar_fnu, spectrum.good, DN4000_RED)

    if blue_mean is None or red_mean is None or blue_mean <= 0:
        return IndexResult(None, None, n_blue + n_red)

    value = red_mean / blue_mean
    rel_err = np.sqrt((red_err / red_mean) ** 2 + (blue_err / blue_mean) ** 2) if red_mean > 0 else None
    error = float(value * rel_err) if rel_err is not None else None
    return IndexResult(value, error, min(n_blue, n_red))


# --------------------------------------------------------------------------
# Lick-resolution degradation (needed for Hdelta_A)
# --------------------------------------------------------------------------


def lick_sigma_kms(wave_aa: np.ndarray) -> np.ndarray:
    """Lick/IDS instrumental sigma in km/s as a function of rest wavelength,
    quadratic fit from Worthey & Ottaviani 1997 (verified against the
    literature: gives FWHM ~10-11.5 Angstrom in the 3850-4160 Angstrom
    range this project uses it in, not the ~8-9 Angstrom that is only
    correct near the system's central wavelength, ~5000 Angstrom)."""
    return 3492.88 - 1.30364 * wave_aa + 0.000128619 * wave_aa**2


def native_sigma_aa(wave_obs_aa: np.ndarray, wdisp_px: np.ndarray) -> np.ndarray:
    """SDSS's own measured native instrumental sigma, in Angstrom, from the
    `wdisp` column (Gaussian sigma in pixels) and the fixed SDSS log-linear
    pixel scale -- using the spectrum's own measured resolution rather than
    assuming a fixed value."""
    return wdisp_px * np.log(10.0) * SDSS_LOGLAM_STEP * wave_obs_aa


def degrade_to_lick_resolution(wave_obs_aa: np.ndarray, flux: np.ndarray, wdisp_px: np.ndarray) -> np.ndarray:
    """Convolve `flux` with a per-pixel Gaussian kernel that brings SDSS's
    native resolution up to the classical Lick/IDS resolution at each
    wavelength (kernel sigma from quadrature subtraction: native and Lick
    resolutions are both close to Gaussian, so their sigmas combine in
    quadrature). Brute-force O(N^2); only ever called on the small
    (~100-200 pixel) window around Hdelta_A, not a full spectrum.
    """
    c_kms = 299792.458
    lick_sigma = lick_sigma_kms(wave_obs_aa) * wave_obs_aa / c_kms
    native_sigma = native_sigma_aa(wave_obs_aa, wdisp_px)
    kernel_sigma = np.sqrt(np.clip(lick_sigma**2 - native_sigma**2, 0.0, None))

    n = len(wave_obs_aa)
    out = np.empty(n)
    for i in range(n):
        sigma = kernel_sigma[i]
        if sigma <= 0:
            out[i] = flux[i]
            continue
        weights = np.exp(-0.5 * ((wave_obs_aa - wave_obs_aa[i]) / sigma) ** 2)
        weight_sum = weights.sum()
        out[i] = float(np.sum(weights * flux) / weight_sum) if weight_sum > 0 else flux[i]
    return out


# --------------------------------------------------------------------------
# HdeltaA (Lick index, EW in Angstrom)
# --------------------------------------------------------------------------


def measure_lick_ew(
    rest_wave: np.ndarray,
    flux: np.ndarray,
    ivar: np.ndarray,
    good: np.ndarray,
    blue_cont: tuple[float, float],
    feature: tuple[float, float],
    red_cont: tuple[float, float],
) -> IndexResult:
    """Standard Lick-index equivalent width: pseudo-continuum linearly
    interpolated between the mean flux in the blue and red continuum
    sidebands (evaluated at their midpoints), EW = integral over the
    feature band of (1 - flux/pseudo_continuum) d(lambda).

    Error propagation here only accounts for the feature-band flux
    uncertainty (via ivar), not the smaller contribution from continuum
    sideband uncertainty -- a documented simplification, not an exact
    Cardiel et al. 1998-style propagation.
    """
    blue_mask = good & (rest_wave >= blue_cont[0]) & (rest_wave < blue_cont[1]) & (ivar > 0)
    red_mask = good & (rest_wave >= red_cont[0]) & (rest_wave < red_cont[1]) & (ivar > 0)
    if blue_mask.sum() == 0 or red_mask.sum() == 0:
        return IndexResult(None, None, 0)

    blue_mid = sum(blue_cont) / 2.0
    red_mid = sum(red_cont) / 2.0
    blue_flux = float(np.average(flux[blue_mask], weights=ivar[blue_mask]))
    red_flux = float(np.average(flux[red_mask], weights=ivar[red_mask]))

    feature_mask = good & (rest_wave >= feature[0]) & (rest_wave < feature[1]) & (ivar > 0)
    n_feature = int(feature_mask.sum())
    if n_feature == 0:
        return IndexResult(None, None, 0)

    fw = rest_wave[feature_mask]
    ff = flux[feature_mask]
    fivar = ivar[feature_mask]
    dlam = np.gradient(fw)

    continuum = blue_flux + (red_flux - blue_flux) * (fw - blue_mid) / (red_mid - blue_mid)
    valid = continuum > 0
    if not np.any(valid):
        return IndexResult(None, None, n_feature)

    ew = float(np.sum((1.0 - ff[valid] / continuum[valid]) * dlam[valid]))
    e_ew = float(np.sqrt(np.sum((dlam[valid] / continuum[valid]) ** 2 / fivar[valid])))
    return IndexResult(ew, e_ew, n_feature)


def compute_hdelta_a(spectrum: Spectrum) -> IndexResult:
    rest_wave = spectrum.wave_obs / (1.0 + spectrum.z)
    degraded_flux = degrade_to_lick_resolution(spectrum.wave_obs, spectrum.flux, spectrum.wdisp_px)
    return measure_lick_ew(
        rest_wave, degraded_flux, spectrum.ivar, spectrum.good,
        HDELTA_A_BLUE_CONT, HDELTA_A_FEATURE, HDELTA_A_RED_CONT,
    )


# --------------------------------------------------------------------------
# Position matching + spectrum fetching (network layer)
# --------------------------------------------------------------------------

MATCH_TOLERANCE_ARCSEC = 5.0  # matches this project's default coordinate-match tolerance
MATCH_CACHE_PATH = EXTERNAL_CACHE_DIR / "sdss_spectrum_matches.json"
SPECTRUM_CACHE_DIR = EXTERNAL_CACHE_DIR / "sdss_spectra"


def match_sdss_spectrum(
    ra: float, dec: float, radius_arcsec: float = MATCH_TOLERANCE_ARCSEC, retries: int = 3
) -> dict | None:
    """Find an SDSS spectrum within `radius_arcsec` of (ra, dec). Returns
    {"plate", "mjd", "fiberID"} for the nearest match, or None.

    SDSS's SkyServer has shown real transient connection timeouts during
    this project's own testing (verified: a 40-galaxy sample had 0 hard
    failures once retried, vs. 2 timeouts on the first attempt), so this
    retries rather than treating a timeout as "no match" -- a fetch failure
    is not the same claim as a genuinely empty cone search.
    """
    import time

    from astropy import coordinates as coords
    from astropy import units as u
    from astroquery.sdss import SDSS

    pos = coords.SkyCoord(ra=ra * u.deg, dec=dec * u.deg)
    for attempt in range(retries):
        try:
            xid = SDSS.query_region(pos, radius=radius_arcsec * u.arcsec, spectro=True, timeout=20)
            break
        except Exception as exc:
            if attempt == retries - 1:
                logger.warning("SDSS query_region failed after %d attempts at (%.5f, %.5f): %s", retries, ra, dec, exc)
                raise
            time.sleep(2)
    if xid is None or len(xid) == 0:
        return None
    row = xid[0]
    return {"plate": int(row["plate"]), "mjd": int(row["mjd"]), "fiberID": int(row["fiberID"])}


def fetch_spectrum(plate: int, mjd: int, fiber_id: int, force_refresh: bool = False) -> Spectrum | None:
    """Fetch (or load from local cache) one SDSS spectrum as a Spectrum."""
    SPECTRUM_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_path = SPECTRUM_CACHE_DIR / f"{plate}-{mjd}-{fiber_id}.npz"

    if cache_path.exists() and not force_refresh:
        cached = np.load(cache_path)
        return Spectrum(
            wave_obs=cached["wave_obs"], flux=cached["flux"], ivar=cached["ivar"],
            good=cached["good"], wdisp_px=cached["wdisp_px"], z=float(cached["z"]),
        )

    import time

    from astroquery.sdss import SDSS

    sp = None
    for attempt in range(3):
        try:
            sp = SDSS.get_spectra(plate=plate, mjd=mjd, fiberID=fiber_id, timeout=25)
            break
        except Exception as exc:
            if attempt == 2:
                logger.warning("spectrum fetch failed for %d-%d-%d after retries: %s", plate, mjd, fiber_id, exc)
                return None
            time.sleep(2)
    if sp is None:
        return None
    hdu = sp[0]
    data = hdu[1].data
    z = float(hdu[2].data["Z"][0])

    wave_obs = 10 ** data["loglam"]
    flux = data["flux"].astype(float)
    ivar = data["ivar"].astype(float)
    good = (ivar > 0) & (data["and_mask"] == 0)
    wdisp_px = data["wdisp"].astype(float)

    np.savez(cache_path, wave_obs=wave_obs, flux=flux, ivar=ivar, good=good, wdisp_px=wdisp_px, z=z)
    return Spectrum(wave_obs=wave_obs, flux=flux, ivar=ivar, good=good, wdisp_px=wdisp_px, z=z)


def compute_sdss_spectral_ages(
    sparc_galaxies: pd.DataFrame, force_refresh_match: bool = False, force_refresh_spectra: bool = False
) -> pd.DataFrame:
    """For each row of `sparc_galaxies` (needs pgc_id, ra, dec), find an SDSS
    spectrum within MATCH_TOLERANCE_ARCSEC (reusing this project's existing
    ra/dec, no re-resolution) and measure Dn4000 + Hdelta_A directly.

    Returns columns: pgc_id, age_proxy_dn4000, e_age_proxy_dn4000,
    n_pixels_dn4000, age_proxy_hdelta_a, e_age_proxy_hdelta_a,
    n_pixels_hdelta_a. Only galaxies with at least a Dn4000 measurement are
    included (a galaxy with a spectrum but 0 usable pixels in either band is
    left out, not null-filled, to keep the table's presence itself an audit
    signal, matching pipeline/external/moustakas.py's convention).
    """
    match_cache: dict[str, dict] = {}
    if MATCH_CACHE_PATH.exists() and not force_refresh_match:
        match_cache = json.loads(MATCH_CACHE_PATH.read_text())

    records = []
    for row in sparc_galaxies.itertuples():
        pgc_key = str(row.pgc_id)
        if pgc_key in match_cache and not force_refresh_match:
            match = match_cache[pgc_key]
        else:
            try:
                match = match_sdss_spectrum(row.ra, row.dec)
            except Exception:
                logger.warning("PGC%d: SDSS match failed after retries, skipping this run", row.pgc_id)
                continue
            match_cache[pgc_key] = match
            MATCH_CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
            MATCH_CACHE_PATH.write_text(json.dumps(match_cache, indent=2))

        if match is None:
            continue

        spectrum = fetch_spectrum(match["plate"], match["mjd"], match["fiberID"], force_refresh=force_refresh_spectra)
        if spectrum is None:
            logger.warning("PGC%d: SDSS match found but spectrum fetch failed", row.pgc_id)
            continue

        dn4000 = compute_dn4000(spectrum)
        hdelta_a = compute_hdelta_a(spectrum)
        if dn4000.value is None:
            continue

        records.append(
            {
                "pgc_id": row.pgc_id,
                "age_proxy_dn4000": dn4000.value,
                "e_age_proxy_dn4000": dn4000.error,
                "n_pixels_dn4000": dn4000.n_good,
                "age_proxy_hdelta_a": hdelta_a.value,
                "e_age_proxy_hdelta_a": hdelta_a.error,
                "n_pixels_hdelta_a": hdelta_a.n_good,
            }
        )
        logger.info(
            "PGC%d: Dn4000=%.3f+/-%.3f HdeltaA=%s",
            row.pgc_id, dn4000.value, dn4000.error or float("nan"),
            f"{hdelta_a.value:.3f}" if hdelta_a.value is not None else "None",
        )

    result = pd.DataFrame.from_records(records)
    logger.info(
        "SDSS direct spectral indices: %d/%d SPARC galaxies have a usable Dn4000 measurement",
        len(result), len(sparc_galaxies),
    )
    return result
