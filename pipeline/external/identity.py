"""Resolve SPARC galaxy names to canonical PGC (Principal Galaxies Catalogue
/ HyperLeda LEDA) identifiers, without ever joining catalogs by raw text
name equality.

Two-tier strategy, verified against the live SPARC name list:

1. name_match: resolve the SPARC name (and a couple of light spelling
   normalizations of it) through Simbad's Sesame name resolver
   (`Simbad.query_object`), then read the object's cross-identifiers
   (`Simbad.query_objectids`) for a "LEDA <n>" entry, which is a PGC
   number. If every variant that resolves agrees on the same PGC number,
   this is unambiguous.

2. coordinate_match: SPARC ships no coordinates, and several SPARC names
   (mostly LSB/dwarf-catalog designations such as "CamB", "D512-2",
   "F565-V2", "KK98-251") are not resolved by Simbad's name resolver at
   all. NED's resolver covers most of these and returns a position. That
   position is then used as the search center for a Simbad cone search
   (`Simbad.query_region`, default 5 arcsec) to obtain the canonical PGC
   number independently of the SPARC spelling -- i.e. identity is
   established by sky position, not by string matching.

Names that resolve through neither path are left unresolved and are
never assigned a PGC id; callers must log them explicitly rather than
dropping them silently.
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable, Protocol

import pandas as pd

from pipeline.config import COORD_TOLERANCE_ARCSEC, EXTERNAL_CACHE_DIR

logger = logging.getLogger(__name__)

LEDA_ID_RE = re.compile(r"LEDA\s+(\d+)", re.IGNORECASE)


class SimbadClient(Protocol):
    def query_object(self, name: str): ...
    def query_objectids(self, name: str): ...
    def query_region(self, coordinates, radius): ...


class NedClient(Protocol):
    def query_object(self, name: str): ...


@dataclass(frozen=True)
class IdentityResult:
    name_sparc: str
    pgc_id: int | None
    name_external: str | None
    ra: float | None
    dec: float | None
    match_method: str  # "name_match" | "coordinate_match" | "unresolved"
    resolver_source: str | None
    note: str = ""

    def as_dict(self) -> dict:
        return asdict(self)


def name_variants(name: str) -> list[str]:
    """A small set of harmless spelling normalizations to try against Sesame,
    in addition to the raw SPARC name. Order matters: raw name first.
    """
    variants = [name]

    spaced = re.sub(r"^([A-Za-z]+)(\d)", r"\1 \2", name)
    if spaced != name:
        variants.append(spaced)

    # Only strip zero-padding immediately after the catalog prefix (e.g.
    # "UGC00128" -> "UGC128"); an unanchored version of this would also
    # mangle genuine internal zeros in a designation (e.g. "NGC2403"
    # contains "...40..." and must NOT be rewritten to "NGC2443").
    stripped_zeros = re.sub(r"^([A-Za-z]+)0+(\d)", r"\1\2", name)
    if stripped_zeros not in variants:
        variants.append(stripped_zeros)

    return variants


def _extract_pgc(simbad: SimbadClient, main_id: str) -> int | None:
    ids_table = simbad.query_objectids(main_id)
    if ids_table is None:
        return None
    for row in ids_table:
        match = LEDA_ID_RE.search(str(row["id"]))
        if match:
            return int(match.group(1))
    return None


def resolve_by_name(name: str, simbad: SimbadClient) -> IdentityResult | None:
    found: dict[int, tuple[str, float, float]] = {}

    for variant in name_variants(name):
        try:
            result = simbad.query_object(variant)
        except Exception as exc:  # network/service errors: skip this variant
            logger.warning("Simbad query_object(%r) failed: %s", variant, exc)
            continue
        if result is None or len(result) == 0:
            continue

        main_id = str(result["main_id"][0]).strip()
        ra = float(result["ra"][0])
        dec = float(result["dec"][0])

        pgc = _extract_pgc(simbad, main_id)
        if pgc is not None:
            found.setdefault(pgc, (main_id, ra, dec))

    if not found:
        return None
    if len(found) > 1:
        logger.info("name resolution for %r is ambiguous across variants: %s", name, found)
        return None

    pgc = next(iter(found))
    main_id, ra, dec = found[pgc]
    return IdentityResult(
        name_sparc=name,
        pgc_id=pgc,
        name_external=main_id,
        ra=ra,
        dec=dec,
        match_method="name_match",
        resolver_source="Simbad",
    )


def resolve_by_coordinates(
    name: str,
    simbad: SimbadClient,
    ned: NedClient,
    tolerance_arcsec: float = COORD_TOLERANCE_ARCSEC,
) -> IdentityResult | None:
    from astropy import units as u
    from astropy.coordinates import SkyCoord

    ned_hit = None
    ned_variant = None
    for variant in name_variants(name):
        try:
            result = ned.query_object(variant)
        except Exception as exc:
            logger.warning("NED query_object(%r) failed: %s", variant, exc)
            continue
        if result is not None and len(result) > 0:
            ned_hit = result
            ned_variant = variant
            break

    if ned_hit is None:
        return None

    ra = float(ned_hit["RA"][0])
    dec = float(ned_hit["DEC"][0])
    ned_name = str(ned_hit["Object Name"][0]).strip()

    coord = SkyCoord(ra=ra, dec=dec, unit="deg")
    try:
        region = simbad.query_region(coord, radius=tolerance_arcsec * u.arcsec)
    except Exception as exc:
        logger.warning("Simbad query_region for %r (via NED %r) failed: %s", name, ned_variant, exc)
        region = None

    if region is None or len(region) == 0:
        return None

    candidates: dict[int, tuple[str, float, float]] = {}
    for row in region:
        main_id = str(row["main_id"]).strip()
        pgc = _extract_pgc(simbad, main_id)
        if pgc is not None:
            candidates.setdefault(pgc, (main_id, float(row["ra"]), float(row["dec"])))

    if len(candidates) != 1:
        if len(candidates) > 1:
            logger.info(
                "coordinate match for %r found multiple PGC candidates within %.1f arcsec: %s",
                name, tolerance_arcsec, candidates,
            )
        return None

    pgc = next(iter(candidates))
    main_id, match_ra, match_dec = candidates[pgc]
    return IdentityResult(
        name_sparc=name,
        pgc_id=pgc,
        name_external=main_id,
        ra=match_ra,
        dec=match_dec,
        match_method="coordinate_match",
        resolver_source="NED+Simbad",
        note=f"NED resolved {ned_variant!r} to RA={ra:.5f} Dec={dec:.5f}; "
        f"Simbad cone search within {tolerance_arcsec:.1f} arcsec matched {main_id}",
    )


def resolve_galaxy(
    name: str,
    simbad: SimbadClient,
    ned: NedClient,
    tolerance_arcsec: float = COORD_TOLERANCE_ARCSEC,
) -> IdentityResult:
    result = resolve_by_name(name, simbad)
    if result is not None:
        return result

    result = resolve_by_coordinates(name, simbad, ned, tolerance_arcsec=tolerance_arcsec)
    if result is not None:
        return result

    return IdentityResult(
        name_sparc=name,
        pgc_id=None,
        name_external=None,
        ra=None,
        dec=None,
        match_method="unresolved",
        resolver_source=None,
        note="no match via Simbad name resolution or NED position + Simbad coordinate cross-match",
    )


def default_clients() -> tuple[SimbadClient, NedClient]:
    from astroquery.ipac.ned import Ned
    from astroquery.simbad import Simbad

    return Simbad, Ned


def resolve_all(
    names: Iterable[str],
    simbad: SimbadClient | None = None,
    ned: NedClient | None = None,
    tolerance_arcsec: float = COORD_TOLERANCE_ARCSEC,
    cache_path: Path = EXTERNAL_CACHE_DIR / "identity_cache.json",
    force_refresh: bool = False,
) -> pd.DataFrame:
    """Resolve every name in `names`, using an on-disk JSON cache keyed by
    SPARC name so repeated pipeline runs don't re-hit Simbad/NED.
    """
    if simbad is None or ned is None:
        default_simbad, default_ned = default_clients()
        simbad = simbad or default_simbad
        ned = ned or default_ned

    cache: dict[str, dict] = {}
    if cache_path.exists() and not force_refresh:
        cache = json.loads(cache_path.read_text())

    results: list[IdentityResult] = []
    for name in names:
        if name in cache:
            results.append(IdentityResult(**cache[name]))
            continue

        result = resolve_galaxy(name, simbad, ned, tolerance_arcsec=tolerance_arcsec)
        results.append(result)
        cache[name] = result.as_dict()
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(json.dumps(cache, indent=2, sort_keys=True))

        logger.info("%s -> pgc_id=%s (%s)", name, result.pgc_id, result.match_method)

    return pd.DataFrame([r.as_dict() for r in results])
