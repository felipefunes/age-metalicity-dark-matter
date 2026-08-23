import numpy as np
import pytest

from pipeline.external.sdss_indices import (
    HDELTA_A_BLUE_CONT,
    HDELTA_A_FEATURE,
    HDELTA_A_RED_CONT,
    SPEED_OF_LIGHT_AA_PER_S,
    Spectrum,
    compute_dn4000,
    degrade_to_lick_resolution,
    lick_sigma_kms,
    measure_lick_ew,
    native_sigma_aa,
    to_fnu,
)


def test_to_fnu_scaling():
    wave = np.array([4000.0])
    flux = np.array([2.0])
    fnu = to_fnu(wave, flux)
    assert fnu[0] == pytest.approx(2.0 * 4000.0**2 / SPEED_OF_LIGHT_AA_PER_S)


def test_compute_dn4000_single_pixel_per_band_hand_computed():
    # One pixel in each band, z=0 (rest == observed).
    wave = np.array([3900.0, 4050.0])
    flux = np.array([2.0, 3.0])
    ivar = np.array([1.0, 1.0])
    good = np.array([True, True])
    spectrum = Spectrum(wave_obs=wave, flux=flux, ivar=ivar, good=good, wdisp_px=np.array([1.0, 1.0]), z=0.0)

    result = compute_dn4000(spectrum)

    expected = (3.0 * 4050.0**2) / (2.0 * 3900.0**2)
    assert result.value == pytest.approx(expected)
    assert result.error is not None and result.error > 0
    assert result.n_good == 1


def test_compute_dn4000_excludes_masked_pixels():
    wave = np.array([3900.0, 3900.0, 4050.0])
    flux = np.array([2.0, 999.0, 3.0])  # second point would corrupt the mean if included
    ivar = np.array([1.0, 1.0, 1.0])
    good = np.array([True, False, True])  # explicitly masked out
    spectrum = Spectrum(wave_obs=wave, flux=flux, ivar=ivar, good=good, wdisp_px=np.ones(3), z=0.0)

    result = compute_dn4000(spectrum)
    expected = (3.0 * 4050.0**2) / (2.0 * 3900.0**2)
    assert result.value == pytest.approx(expected)


def test_compute_dn4000_redshift_shifts_bands_correctly():
    z = 0.01
    # place flux at observed wavelengths that land on rest 3900 and 4050
    wave = np.array([3900.0 * (1 + z), 4050.0 * (1 + z)])
    flux = np.array([2.0, 3.0])
    ivar = np.array([1.0, 1.0])
    good = np.array([True, True])
    spectrum = Spectrum(wave_obs=wave, flux=flux, ivar=ivar, good=good, wdisp_px=np.ones(2), z=z)

    result = compute_dn4000(spectrum)
    # Fnu uses observed wavelength, but the *ratio* of Fnu(red_obs)/Fnu(blue_obs)
    # equals the same ratio computed at rest wavelengths since both scale by
    # the same (1+z)^2 factor -- verifies redshift-band-selection is decoupled
    # from the Fnu conversion itself.
    expected = (3.0 * (4050.0 * (1 + z)) ** 2) / (2.0 * (3900.0 * (1 + z)) ** 2)
    assert result.value == pytest.approx(expected)


def test_compute_dn4000_missing_band_returns_none():
    wave = np.array([3900.0])  # no red-band coverage at all
    flux = np.array([2.0])
    ivar = np.array([1.0])
    good = np.array([True])
    spectrum = Spectrum(wave_obs=wave, flux=flux, ivar=ivar, good=good, wdisp_px=np.ones(1), z=0.0)

    result = compute_dn4000(spectrum)
    assert result.value is None
    assert result.error is None


def test_lick_sigma_kms_matches_verified_literature_values():
    # Pinned against the Worthey & Ottaviani 1997 quadratic relation,
    # cross-checked against the literature during design (see module
    # docstring): sigma should be a few hundred km/s in the 3850-4160 AA
    # range, giving FWHM ~10-11.5 AA there (NOT the ~8-9 AA that is only
    # correct near the Lick system's central wavelength, ~5000 AA).
    sigma_4000 = lick_sigma_kms(np.array([4000.0]))[0]
    assert sigma_4000 == pytest.approx(336.2, abs=0.5)

    c_kms = 299792.458
    fwhm_aa = sigma_4000 * 4000.0 / c_kms * 2.354820045
    assert 10.0 < fwhm_aa < 11.0


def test_native_sigma_aa_one_pixel_dispersion():
    wave = np.array([4000.0])
    wdisp_px = np.array([1.0])
    sigma = native_sigma_aa(wave, wdisp_px)
    expected = 1.0 * np.log(10.0) * 1.0e-4 * 4000.0
    assert sigma[0] == pytest.approx(expected)


def test_degrade_to_lick_resolution_smooths_a_narrow_spike():
    # A single-pixel deep, narrow "absorption spike" on a flat continuum,
    # with tiny native resolution (so the Lick kernel dominates) --
    # degrading to Lick resolution must broaden/shallow it substantially.
    wave = np.linspace(4030.0, 4170.0, 281)  # ~0.5 AA/pixel
    flux = np.full_like(wave, 10.0)
    spike_idx = len(wave) // 2
    flux[spike_idx] = 2.0  # deep narrow dip
    wdisp_px = np.full_like(wave, 0.05)  # near-zero native resolution

    degraded = degrade_to_lick_resolution(wave, flux, wdisp_px)

    assert degraded[spike_idx] > flux[spike_idx]  # smoothed: dip is shallower
    assert degraded[spike_idx] < 10.0  # but still detectably present
    # far from the spike, an (almost) flat continuum should stay (almost) flat
    assert degraded[0] == pytest.approx(10.0, abs=0.5)


def test_measure_lick_ew_zero_for_flat_spectrum_no_dip():
    wave = np.linspace(4030.0, 4170.0, 281)
    flux = np.full_like(wave, 10.0)  # perfectly flat: no absorption feature
    ivar = np.full_like(wave, 1.0)
    good = np.full_like(wave, True, dtype=bool)

    result = measure_lick_ew(wave, flux, ivar, good, HDELTA_A_BLUE_CONT, HDELTA_A_FEATURE, HDELTA_A_RED_CONT)
    assert result.value == pytest.approx(0.0, abs=1e-6)


def test_measure_lick_ew_known_constant_fractional_dip():
    # Continuum = 10 everywhere except a constant 10% dip across the whole
    # feature band -> EW = 0.1 * feature_band_width exactly.
    wave = np.linspace(4030.0, 4170.0, 1401)  # fine grid, ~0.1 AA/pixel
    flux = np.full_like(wave, 10.0)
    feature_mask = (wave >= HDELTA_A_FEATURE[0]) & (wave < HDELTA_A_FEATURE[1])
    flux[feature_mask] = 9.0  # 10% dip
    ivar = np.full_like(wave, 1.0)
    good = np.full_like(wave, True, dtype=bool)

    result = measure_lick_ew(wave, flux, ivar, good, HDELTA_A_BLUE_CONT, HDELTA_A_FEATURE, HDELTA_A_RED_CONT)
    expected_ew = 0.1 * (HDELTA_A_FEATURE[1] - HDELTA_A_FEATURE[0])
    assert result.value == pytest.approx(expected_ew, rel=0.01)
