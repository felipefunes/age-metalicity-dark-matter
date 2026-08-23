from pathlib import Path

from astropy.table import Table

from pipeline.external.identity import (
    name_variants,
    resolve_all,
    resolve_by_coordinates,
    resolve_by_name,
    resolve_galaxy,
)


class FakeSimbad:
    """Stands in for astroquery.simbad.Simbad: no network access.

    `by_name` maps a name understood by the resolver to (main_id, ra, dec).
    `leda_by_main_id` maps a main_id to its "LEDA <n>" identifier string.
    `region_hits` maps a (ra, dec) tuple (rounded) to a list of main_ids
    that a cone search around that position would return.
    """

    def __init__(self, by_name=None, leda_by_main_id=None, region_hits=None):
        self.by_name = by_name or {}
        self.leda_by_main_id = leda_by_main_id or {}
        self.region_hits = region_hits or {}

    def query_object(self, name):
        if name not in self.by_name:
            return None
        main_id, ra, dec = self.by_name[name]
        return Table({"main_id": [main_id], "ra": [ra], "dec": [dec]})

    def query_objectids(self, main_id):
        leda = self.leda_by_main_id.get(main_id)
        if leda is None:
            return Table({"id": []})
        return Table({"id": [f"2MASX J000000", leda]})

    def query_region(self, coordinates, radius):
        key = (round(coordinates.ra.deg, 3), round(coordinates.dec.deg, 3))
        main_ids = self.region_hits.get(key, [])
        if not main_ids:
            return None
        rows = [self.by_name[mid_key] for mid_key in main_ids]
        return Table(
            {
                "main_id": [r[0] for r in rows],
                "ra": [r[1] for r in rows],
                "dec": [r[2] for r in rows],
            }
        )


class FakeNed:
    def __init__(self, by_name=None):
        self.by_name = by_name or {}

    def query_object(self, name):
        if name not in self.by_name:
            return None
        obj_name, ra, dec = self.by_name[name]
        return Table({"Object Name": [obj_name], "RA": [ra], "DEC": [dec]})


def test_name_variants_strips_leading_zero_padding_only():
    assert "UGC128" in name_variants("UGC00128")


def test_name_variants_does_not_mangle_internal_zeros():
    # NGC2403 contains "40"; an unanchored zero-stripper would wrongly
    # rewrite it to NGC2443. It must not appear among the variants.
    variants = name_variants("NGC2403")
    assert "NGC2443" not in variants
    assert "NGC2403" in variants


def test_resolve_by_name_direct_match():
    simbad = FakeSimbad(
        by_name={"NGC3198": ("NGC  3198", 154.98, 45.55)},
        leda_by_main_id={"NGC  3198": "LEDA   30197"},
    )
    result = resolve_by_name("NGC3198", simbad)
    assert result is not None
    assert result.pgc_id == 30197
    assert result.match_method == "name_match"
    assert result.resolver_source == "Simbad"


def test_resolve_by_name_returns_none_when_no_match():
    simbad = FakeSimbad()
    assert resolve_by_name("Unknown123", simbad) is None


def test_resolve_by_name_ambiguous_variants_falls_through():
    # raw name and its spaced variant resolve to two *different* PGC ids ->
    # must not pick one silently.
    simbad = FakeSimbad(
        by_name={
            "AB1": ("Object One", 10.0, 20.0),
            "AB 1": ("Object Two", 30.0, 40.0),
        },
        leda_by_main_id={
            "Object One": "LEDA   111",
            "Object Two": "LEDA   222",
        },
    )
    assert resolve_by_name("AB1", simbad) is None


def test_resolve_by_coordinates_falls_back_via_ned_and_cone_search():
    # Simulates a name Simbad's Sesame resolver doesn't recognize at all
    # (like the real SPARC dwarf "CamB"), resolved instead through NED's
    # position + a Simbad coordinate cross-match.
    ned = FakeNed(by_name={"CamB": ("Camelopardalis B", 73.28081, 67.09837)})
    simbad = FakeSimbad(
        by_name={"NAME Cam B": ("NAME Cam B", 73.2795, 67.0994)},
        leda_by_main_id={"NAME Cam B": "LEDA  166084"},
        region_hits={(73.281, 67.098): ["NAME Cam B"]},
    )

    result = resolve_by_coordinates("CamB", simbad, ned, tolerance_arcsec=5.0)
    assert result is not None
    assert result.pgc_id == 166084
    assert result.match_method == "coordinate_match"
    assert result.resolver_source == "NED+Simbad"


def test_resolve_by_coordinates_returns_none_when_ned_has_nothing():
    ned = FakeNed()
    simbad = FakeSimbad()
    assert resolve_by_coordinates("TotallyUnknown", simbad, ned) is None


def test_resolve_galaxy_prefers_name_match_over_coordinate_match():
    simbad = FakeSimbad(
        by_name={"NGC3198": ("NGC  3198", 154.98, 45.55)},
        leda_by_main_id={"NGC  3198": "LEDA   30197"},
    )
    ned = FakeNed()  # would fail if ever consulted
    result = resolve_galaxy("NGC3198", simbad, ned)
    assert result.match_method == "name_match"


def test_resolve_galaxy_is_unresolved_when_both_paths_fail():
    result = resolve_galaxy("NoSuchGalaxy", FakeSimbad(), FakeNed())
    assert result.match_method == "unresolved"
    assert result.pgc_id is None


def test_resolve_all_writes_and_reuses_cache(tmp_path: Path):
    simbad = FakeSimbad(
        by_name={"NGC3198": ("NGC  3198", 154.98, 45.55)},
        leda_by_main_id={"NGC  3198": "LEDA   30197"},
    )
    ned = FakeNed()
    cache_path = tmp_path / "identity_cache.json"

    df1 = resolve_all(["NGC3198"], simbad=simbad, ned=ned, cache_path=cache_path)
    assert df1.iloc[0]["pgc_id"] == 30197
    assert cache_path.exists()

    # second call must not need the clients at all -- pass ones that would
    # raise if actually queried, to prove the cache is what's used.
    class ExplodingClient:
        def __getattr__(self, item):
            raise AssertionError("should not be called: cache should have been used")

    df2 = resolve_all(
        ["NGC3198"], simbad=ExplodingClient(), ned=ExplodingClient(), cache_path=cache_path
    )
    assert df2.iloc[0]["pgc_id"] == 30197
