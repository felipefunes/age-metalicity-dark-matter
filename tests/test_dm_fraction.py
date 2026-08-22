from pathlib import Path

import pandas as pd
import pytest

from pipeline.dm_fraction import (
    compute_outer_dm_fraction,
    compute_vbar2,
    dm_fraction_at_row,
)
from pipeline.parsers.sparc import read_mass_models

FIXTURES = Path(__file__).parent / "fixtures"


def test_known_case_by_hand():
    """Vobs=100, Vgas=20, Vdisk=60, Vbul=0, Upsilon_disk=0.5, Upsilon_bul=0.7.

    Vbar^2 = 20^2 + 0.5*60^2 + 0.7*0^2 = 400 + 1800 = 2200
    f_DM = 1 - 2200/100^2 = 1 - 0.22 = 0.78
    e_f_DM = 2*(1-f_DM)*e_Vobs/Vobs = 2*0.22*5/100 = 0.022
    """
    row = pd.Series({"Vgas": 20.0, "Vdisk": 60.0, "Vbul": 0.0})
    vbar2 = compute_vbar2(row, upsilon_disk=0.5, upsilon_bulge=0.7)
    assert vbar2 == pytest.approx(2200.0)

    f_dm, e_f_dm, clipped = dm_fraction_at_row(vobs=100.0, e_vobs=5.0, vbar2=vbar2)
    assert f_dm == pytest.approx(0.78)
    assert e_f_dm == pytest.approx(0.022)
    assert clipped is False


def test_dm_fraction_clips_out_of_range_values():
    # Vbar^2 > Vobs^2 would give a negative raw f_DM; must clip to 0 and flag it.
    f_dm, e_f_dm, clipped = dm_fraction_at_row(vobs=50.0, e_vobs=2.0, vbar2=5000.0)
    assert f_dm == 0.0
    assert clipped is True


def test_dm_fraction_zero_vobs_is_nan_not_a_crash():
    f_dm, e_f_dm, clipped = dm_fraction_at_row(vobs=0.0, e_vobs=1.0, vbar2=10.0)
    assert pd.isna(f_dm)
    assert clipped is False


def test_compute_outer_dm_fraction_uses_outermost_radius_per_galaxy():
    mass_models = read_mass_models(FIXTURES / "mass_models_sample.mrt")
    result = compute_outer_dm_fraction(mass_models, upsilon_disk=0.5, upsilon_bulge=0.7)

    assert set(result["galaxy"]) == {"CamB", "NGC2403", "NGC3198"}

    camb = result[result["galaxy"] == "CamB"].iloc[0]
    assert camb["r_outer_kpc"] == pytest.approx(1.79)
    assert camb["vobs"] == pytest.approx(20.10)

    expected_vbar2 = 6.91**2 + 0.5 * 14.91**2
    expected_f_dm = 1.0 - expected_vbar2 / 20.10**2
    assert camb["f_dm"] == pytest.approx(expected_f_dm)
    assert 0.0 <= camb["f_dm"] <= 1.0


def test_compute_outer_dm_fraction_requires_expected_columns():
    with pytest.raises(ValueError, match="missing required columns"):
        compute_outer_dm_fraction(pd.DataFrame({"ID": ["X"]}))
