"""Best-effort metallicity and stellar-age lookup per PGC id, from
HyperLeda's per-object "meandata" page.

HyperLeda does not have a dedicated astroquery module, so this queries
its public HTTP endpoint directly (the same one the HyperLeda website
itself uses for a single-object lookup) and parses every parameter it
returns generically, rather than hardcoding a fixed column list.

IMPORTANT, verified against real HyperLeda pages for several SPARC
galaxies (e.g. NGC2403, NGC3198): HyperLeda's per-object parameters cover
morphology, photometry, kinematics and distance -- there is no field that
is a gas-phase or stellar metallicity, and no field that is a stellar
population age, for the disk/dwarf-dominated galaxy types that make up
most of SPARC. The closest related quantity, `mg2` (the central Lick Mg2
spectral index), is a spectral index, not a metallicity, and is not
converted into one here because that conversion requires a stellar
population model choice this project does not make; using it as if it
were "metallicity" would misrepresent the data. Consequently most/all
galaxies are expected to come back with metallicity=None and age_gyr=None
-- that is a correct, honest result, not a bug, and is why every SPARC
galaxy can still be analyzed with Hubble type T as a morphological proxy
even when no strict stellar age is available (see the age_method column).

NED was evaluated the same way (via `astroquery.ipac.ned.Ned.query_object`)
and its basic-data table likewise carries no per-object metallicity or age
field, so it is not queried again here; NED is used only for identity
resolution (pipeline/external/identity.py).
"""
from __future__ import annotations

import json
import logging
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable

import requests

from pipeline.config import EXTERNAL_CACHE_DIR

logger = logging.getLogger(__name__)

HYPERLEDA_URL = "http://atlas.obs-hp.fr/hyperleda/ledacat.cgi"
REQUEST_TIMEOUT_SECONDS = 30

PARAM_ROW_RE = re.compile(
    r'<a href="leda/param/([a-z0-9_]+)\.html"[^>]*>[a-z0-9_]+</a></td><td>([^<]*)</td>',
    re.IGNORECASE,
)

# HyperLeda parameter codes that would plausibly represent a metallicity or
# a stellar-population age if present on a given object's page. None of
# the SPARC galaxies checked while building this module exposed any of
# these, but the match is kept general (rather than hardcoded to "always
# return None") in case HyperLeda's coverage grows for some objects.
METALLICITY_PARAM_RE = re.compile(r"^(feh|oh|abun|metal)", re.IGNORECASE)
AGE_PARAM_RE = re.compile(r"^age", re.IGNORECASE)


@dataclass(frozen=True)
class MetallicityAgeResult:
    pgc_id: int
    metallicity: float | None
    metallicity_source: str | None
    metallicity_method: str | None
    age_gyr: float | None
    age_source: str | None
    age_method: str | None
    note: str = ""

    def as_dict(self) -> dict:
        return asdict(self)


def _parse_value(raw: str) -> float | None:
    """HyperLeda values look like '5.2 &#177;  0.6' or a bare number; take
    the leading numeric token."""
    token = raw.replace("&#177;", "+/-").strip().split()
    if not token:
        return None
    try:
        return float(token[0])
    except ValueError:
        return None


def fetch_hyperleda_params(pgc_id: int, session: requests.Session | None = None) -> dict[str, float]:
    session = session or requests
    response = session.get(
        HYPERLEDA_URL, params={"o": f"PGC{pgc_id}"}, timeout=REQUEST_TIMEOUT_SECONDS
    )
    response.raise_for_status()
    params = {}
    for key, raw_value in PARAM_ROW_RE.findall(response.text):
        value = _parse_value(raw_value)
        if value is not None:
            params[key.lower()] = value
    return params


def lookup_metallicity_age(
    pgc_id: int, session: requests.Session | None = None
) -> MetallicityAgeResult:
    try:
        params = fetch_hyperleda_params(pgc_id, session=session)
    except requests.RequestException as exc:
        logger.warning("HyperLeda lookup failed for PGC%d: %s", pgc_id, exc)
        return MetallicityAgeResult(
            pgc_id=pgc_id,
            metallicity=None,
            metallicity_source=None,
            metallicity_method=None,
            age_gyr=None,
            age_source=None,
            age_method=None,
            note=f"HyperLeda request failed: {exc}",
        )

    metallicity_key = next((k for k in params if METALLICITY_PARAM_RE.match(k)), None)
    age_key = next((k for k in params if AGE_PARAM_RE.match(k)), None)

    return MetallicityAgeResult(
        pgc_id=pgc_id,
        metallicity=params.get(metallicity_key) if metallicity_key else None,
        metallicity_source="HyperLeda" if metallicity_key else None,
        metallicity_method=metallicity_key,
        age_gyr=params.get(age_key) if age_key else None,
        age_source="HyperLeda" if age_key else None,
        age_method=age_key,
        note="" if (metallicity_key or age_key) else "no metallicity/age parameter on HyperLeda page",
    )


def lookup_all(
    pgc_ids: Iterable[int],
    cache_path: Path = EXTERNAL_CACHE_DIR / "metallicity_age_cache.json",
    force_refresh: bool = False,
) -> list[MetallicityAgeResult]:
    cache: dict[str, dict] = {}
    if cache_path.exists() and not force_refresh:
        cache = json.loads(cache_path.read_text())

    session = requests.Session()
    results: list[MetallicityAgeResult] = []
    for pgc_id in pgc_ids:
        key = str(pgc_id)
        if key in cache:
            results.append(MetallicityAgeResult(**cache[key]))
            continue

        result = lookup_metallicity_age(pgc_id, session=session)
        results.append(result)
        cache[key] = result.as_dict()
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(json.dumps(cache, indent=2, sort_keys=True))

        logger.info(
            "PGC%d -> metallicity=%s (%s), age_gyr=%s (%s)",
            pgc_id, result.metallicity, result.metallicity_method,
            result.age_gyr, result.age_method,
        )

    return results
