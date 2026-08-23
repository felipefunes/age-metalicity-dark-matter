import numpy as np
import pandas as pd
import pytest

from pipeline.external.moustakas import (
    MIN_HII_REGIONS,
    compute_characteristic_abundances,
    fit_gradient_at_radius,
)


def test_fit_gradient_at_radius_known_line():
    # O/H = 9.0 - 1.0*rho25 exactly, evaluated at rho25=0.4 -> 8.6
    rho25 = np.array([0.0, 0.2, 0.4, 0.6, 0.8, 1.0])
    oh = 9.0 - 1.0 * rho25
    e_oh = np.full_like(oh, 0.05)

    result = fit_gradient_at_radius(rho25, oh, e_oh)
    assert result is not None
    assert result.value == pytest.approx(8.6, abs=1e-6)
    assert result.n_regions == 6
    assert result.error > 0


def test_fit_gradient_at_radius_below_minimum_returns_none():
    rho25 = np.array([0.3])
    oh = np.array([8.5])
    e_oh = np.array([0.05])
    assert fit_gradient_at_radius(rho25, oh, e_oh) is None
    assert MIN_HII_REGIONS == 2


def test_fit_gradient_at_radius_drops_invalid_rows():
    # one row has a zero uncertainty (unusable as a weight), one is NaN --
    # only the 3 clean rows should be used, still >= MIN_HII_REGIONS.
    rho25 = np.array([0.1, 0.2, 0.3, 0.4, np.nan])
    oh = np.array([8.7, 8.6, 8.5, 8.4, 8.3])
    e_oh = np.array([0.05, 0.0, 0.05, 0.05, 0.05])
    result = fit_gradient_at_radius(rho25, oh, e_oh)
    assert result is not None
    assert result.n_regions == 3


def test_compute_characteristic_abundances_per_galaxy():
    df = pd.DataFrame(
        {
            "Name": ["Gal A", "Gal A", "Gal A", "Gal B"],
            "rho25": [0.0, 0.5, 1.0, 0.5],
            "O/H-a": [9.0, 8.5, 8.0, 8.5],
            "e_O/H-a": [0.05, 0.05, 0.05, 0.05],
            "O/H-b": [8.9, 8.5, 8.1, np.nan],
            "e_O/H-b": [0.05, 0.05, 0.05, np.nan],
        }
    )
    result = compute_characteristic_abundances(df)

    gal_a = result[result["name_moustakas"] == "Gal A"].iloc[0]
    assert gal_a["n_hii_regions_moustakas"] == 3
    assert gal_a["metallicity_kk04"] == pytest.approx(8.6, abs=1e-6)
    assert gal_a["metallicity_pt05"] is not None

    # Gal B has only 1 region total -> below MIN_HII_REGIONS for both
    # calibrations -> excluded entirely, not just null-filled.
    assert "Gal B" not in result["name_moustakas"].values
