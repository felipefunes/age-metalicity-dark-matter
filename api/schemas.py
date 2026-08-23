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
    # Independent metallicity estimates, deliberately not merged into one
    # "metallicity" value -- see docs/findings/ for why (different
    # calibrations/catalogs, known systematic offsets between them).
    metallicity_kk04: float | None
    metallicity_pt05: float | None
    metallicity_pilyugin2014: float | None
    # sSFR age PROXY (z0MGS) -- not a stellar-population-synthesis age,
    # never conflated with age_gyr.
    age_proxy_ssfr: float | None


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
    e_metallicity_kk04: float | None
    e_metallicity_pt05: float | None
    n_hii_regions_moustakas: int | None
    e_metallicity_pilyugin2014: float | None
    e_age_proxy_ssfr: float | None
    age_proxy_source: str | None
    age_proxy_method: str | None


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
