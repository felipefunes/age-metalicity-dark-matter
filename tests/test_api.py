import sqlite3
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from pipeline.load_db import SCHEMA_PATH

GALAXIES = [
    # pgc_id, name_sparc, match_method, T, l36, f_dm, quality_flag, metallicity, age_gyr
    (1, "GalA", "name_match", 2, 50.0, 0.3, 1, None, None),
    (2, "GalB", "coordinate_match", 5, 5.0, 0.6, 1, 0.02, None),
    (3, "GalC", "name_match", 9, 0.5, 0.85, 3, None, 8.0),
    (4, "GalD", "name_match", 10, 0.1, 0.9, 2, None, None),
]


@pytest.fixture()
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "test.sqlite"
    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA_PATH.read_text())
    for pgc_id, name, method, T, l36, f_dm, q, metallicity, age in GALAXIES:
        conn.execute(
            "INSERT INTO galaxy_identity (pgc_id, name_sparc, name_external, ra, dec, match_method) "
            "VALUES (?, ?, ?, ?, ?, ?)",
            (pgc_id, name, name, 10.0 + pgc_id, 20.0 + pgc_id, method),
        )
        conn.execute(
            "INSERT INTO sparc_kinematics "
            "(pgc_id, T, distance_mpc, vflat, e_vflat, r_outer_kpc, vobs_outer, e_vobs_outer, "
            " vbar_outer, f_dm, e_f_dm, f_dm_clipped, l36, e_l36, mhi, quality_flag) "
            "VALUES (?, ?, 5.0, 100.0, 5.0, 10.0, 100.0, 5.0, 50.0, ?, 0.05, 0, ?, 0.1, 1.0, ?)",
            (pgc_id, T, f_dm, l36, q),
        )
        conn.execute(
            "INSERT INTO metallicity_age (pgc_id, metallicity, metallicity_source, "
            "metallicity_method, age_gyr, age_source, age_method) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                pgc_id,
                metallicity,
                "HyperLeda" if metallicity is not None else None,
                None,
                age,
                "HyperLeda" if age is not None else None,
                None,
            ),
        )
    conn.commit()
    conn.close()

    monkeypatch.setenv("API_DB_PATH", str(db_path))

    from api.main import app

    return TestClient(app)


def test_list_galaxies_returns_all_by_default(client):
    resp = client.get("/galaxies")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 4


def test_list_galaxies_mass_range_filter(client):
    resp = client.get("/galaxies", params={"mass_min": 1.0, "mass_max": 10.0})
    assert resp.status_code == 200
    body = resp.json()
    assert {g["name_sparc"] for g in body["galaxies"]} == {"GalB"}


def test_list_galaxies_exclude_low_quality(client):
    resp = client.get("/galaxies", params={"exclude_low_quality": True})
    body = resp.json()
    assert "GalC" not in {g["name_sparc"] for g in body["galaxies"]}  # quality_flag=3
    assert body["total"] == 3


def test_list_galaxies_match_method_filter(client):
    resp = client.get("/galaxies", params={"match_method": "coordinate_match"})
    body = resp.json()
    assert {g["name_sparc"] for g in body["galaxies"]} == {"GalB"}


def test_list_galaxies_invalid_match_method_is_422(client):
    resp = client.get("/galaxies", params={"match_method": "bogus"})
    assert resp.status_code == 422


def test_list_galaxies_require_age(client):
    resp = client.get("/galaxies", params={"require_age": True})
    body = resp.json()
    assert {g["name_sparc"] for g in body["galaxies"]} == {"GalC"}


def test_get_galaxy_detail(client):
    resp = client.get("/galaxies/1")
    assert resp.status_code == 200
    body = resp.json()
    assert body["name_sparc"] == "GalA"
    assert body["vflat"] == 100.0


def test_get_galaxy_404(client):
    resp = client.get("/galaxies/9999")
    assert resp.status_code == 404


def test_correlations_spearman(client):
    resp = client.get("/correlations", params={"x": "mass", "y": "dm_fraction"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["method"] == "spearman"
    assert body["n"] == 4
    # mass decreases monotonically as f_dm increases across GalA..GalD -> perfect anti-correlation
    assert body["coefficient"] == pytest.approx(-1.0)


def test_correlations_partial_controls_for_mass(client):
    resp = client.get(
        "/correlations", params={"x": "hubble_type", "y": "dm_fraction", "control_for": "mass"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["method"] == "partial_spearman"
    assert body["control_for"] == "mass"


def test_correlations_invalid_variable_is_422(client):
    resp = client.get("/correlations", params={"x": "not_a_variable", "y": "dm_fraction"})
    assert resp.status_code == 422


def test_correlations_all_null_metallicity_returns_n_zero(client):
    resp = client.get("/correlations", params={"x": "metallicity", "y": "dm_fraction"})
    body = resp.json()
    assert body["n"] == 1  # only GalB has metallicity
    assert body["coefficient"] is None  # too few points for a meaningful stat
