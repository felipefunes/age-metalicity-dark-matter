from __future__ import annotations

from pydantic import BaseModel


class GalaxySummary(BaseModel):
    pgc_id: int
    name_sparc: str
    name_external: str | None
    match_method: str
    ra: float | None
    dec: float | None
    T: int | None
    l36: float | None
    e_l36: float | None
    mhi: float | None
    f_dm: float | None
    e_f_dm: float | None
    f_dm_clipped: bool
    quality_flag: int | None
    metallicity: float | None
    metallicity_source: str | None
    age_gyr: float | None
    age_source: str | None


class GalaxyDetail(GalaxySummary):
    distance_mpc: float | None
    vflat: float | None
    e_vflat: float | None
    r_outer_kpc: float | None
    vobs_outer: float | None
    e_vobs_outer: float | None
    vbar_outer: float | None
    metallicity_method: str | None
    age_method: str | None


class GalaxyListResponse(BaseModel):
    total: int
    galaxies: list[GalaxySummary]


class CorrelationResponse(BaseModel):
    x: str
    y: str
    control_for: str | None
    n: int
    method: str
    coefficient: float | None
    p_value: float | None
    note: str | None = None
