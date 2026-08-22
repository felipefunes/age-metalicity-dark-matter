from pathlib import Path

import pytest

from pipeline.parsers.mrt import ColumnSpec, find_data_start, parse_mrt
from pipeline.parsers.sparc import read_mass_models, read_sparc_main

FIXTURES = Path(__file__).parent / "fixtures"


def test_read_sparc_main_sample():
    df = read_sparc_main(FIXTURES / "sparc_main_sample.mrt")

    assert list(df["Galaxy"]) == ["CamB", "NGC2403", "NGC3198"]
    assert df.shape == (3, 19)

    camb = df[df["Galaxy"] == "CamB"].iloc[0]
    assert camb["T"] == 10
    assert camb["D"] == pytest.approx(3.36)
    assert camb["Q"] == 2
    assert camb["Ref"] == "Bm03"

    ngc2403 = df[df["Galaxy"] == "NGC2403"].iloc[0]
    assert ngc2403["T"] == 6
    assert ngc2403["L36"] == pytest.approx(10.041)
    assert ngc2403["Vflat"] == pytest.approx(131.2)


def test_read_mass_models_sample():
    df = read_mass_models(FIXTURES / "mass_models_sample.mrt")

    assert df.shape == (8, 10)
    assert set(df["ID"].unique()) == {"CamB", "NGC2403", "NGC3198"}

    camb_outer = df[df["ID"] == "CamB"].sort_values("R").iloc[-1]
    assert camb_outer["R"] == pytest.approx(1.79)
    assert camb_outer["Vobs"] == pytest.approx(20.10)
    assert camb_outer["Vgas"] == pytest.approx(6.91)


def test_find_data_start_requires_dash_separator():
    with pytest.raises(ValueError):
        find_data_start(["just", "some", "lines", "no separator"])


def test_parse_mrt_raises_on_ragged_row(tmp_path):
    bad_file = tmp_path / "bad.mrt"
    bad_file.write_text("header\n---\nA B\nC D E\n")
    columns = [ColumnSpec("x", str), ColumnSpec("y", str)]
    with pytest.raises(ValueError, match="expected 2 whitespace-separated"):
        parse_mrt(bad_file, columns)


def test_parse_mrt_blank_field_becomes_none(tmp_path):
    sample = tmp_path / "sample.mrt"
    sample.write_text("header\n---\n1.5 2.0\n")
    columns = [ColumnSpec("a", float), ColumnSpec("b", float)]
    df = parse_mrt(sample, columns)
    assert df.iloc[0]["a"] == 1.5
    assert df.iloc[0]["b"] == 2.0
