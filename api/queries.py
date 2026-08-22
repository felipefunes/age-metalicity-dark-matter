"""Shared SQL for both the /galaxies and /correlations endpoints so the
scatter plot and the correlation stats it displays are always computed
over exactly the same filtered set of galaxies.

Every query joins on pgc_id only -- never on a text name.
"""
from __future__ import annotations

import sqlite3

BASE_QUERY = """
SELECT
    gi.pgc_id, gi.name_sparc, gi.name_external, gi.match_method, gi.ra, gi.dec,
    sk.T, sk.l36, sk.e_l36, sk.mhi, sk.f_dm, sk.e_f_dm, sk.f_dm_clipped,
    sk.quality_flag, sk.distance_mpc, sk.vflat, sk.e_vflat, sk.r_outer_kpc,
    sk.vobs_outer, sk.e_vobs_outer, sk.vbar_outer,
    ma.metallicity, ma.metallicity_source, ma.metallicity_method,
    ma.age_gyr, ma.age_source, ma.age_method
FROM galaxy_identity gi
JOIN sparc_kinematics sk ON sk.pgc_id = gi.pgc_id
LEFT JOIN metallicity_age ma ON ma.pgc_id = gi.pgc_id
"""

VALID_MATCH_METHODS = {"name_match", "coordinate_match"}


class InvalidFilterError(ValueError):
    pass


def build_filtered_query(
    mass_min: float | None = None,
    mass_max: float | None = None,
    exclude_low_quality: bool = False,
    match_method: str | None = None,
    require_age: bool = False,
    pgc_id: int | None = None,
) -> tuple[str, list]:
    clauses: list[str] = []
    params: list = []

    if mass_min is not None:
        clauses.append("sk.l36 >= ?")
        params.append(mass_min)
    if mass_max is not None:
        clauses.append("sk.l36 <= ?")
        params.append(mass_max)
    if exclude_low_quality:
        clauses.append("(sk.quality_flag IS NULL OR sk.quality_flag < 3)")
    if match_method is not None:
        methods = {m.strip() for m in match_method.split(",") if m.strip()}
        invalid = methods - VALID_MATCH_METHODS
        if invalid:
            raise InvalidFilterError(f"invalid match_method value(s): {sorted(invalid)}")
        placeholders = ",".join("?" for _ in methods)
        clauses.append(f"gi.match_method IN ({placeholders})")
        params.extend(sorted(methods))
    if require_age:
        clauses.append("ma.age_gyr IS NOT NULL")
    if pgc_id is not None:
        clauses.append("gi.pgc_id = ?")
        params.append(pgc_id)

    query = BASE_QUERY
    if clauses:
        query += " WHERE " + " AND ".join(clauses)
    return query, params


def fetch_filtered_galaxies(
    conn: sqlite3.Connection,
    mass_min: float | None = None,
    mass_max: float | None = None,
    exclude_low_quality: bool = False,
    match_method: str | None = None,
    require_age: bool = False,
) -> list[sqlite3.Row]:
    query, params = build_filtered_query(
        mass_min=mass_min,
        mass_max=mass_max,
        exclude_low_quality=exclude_low_quality,
        match_method=match_method,
        require_age=require_age,
    )
    return conn.execute(query, params).fetchall()
