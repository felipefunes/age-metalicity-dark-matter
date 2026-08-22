from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from api.db import get_connection
from api.queries import InvalidFilterError, build_filtered_query, fetch_filtered_galaxies
from api.schemas import GalaxyDetail, GalaxyListResponse, GalaxySummary

router = APIRouter()


def _row_to_summary(row) -> GalaxySummary:
    data = dict(row)
    data["f_dm_clipped"] = bool(data["f_dm_clipped"])
    return GalaxySummary(**data)


@router.get("/galaxies", response_model=GalaxyListResponse)
def list_galaxies(
    mass_min: float | None = Query(None, description="Minimum L[3.6] in 1e9 solLum"),
    mass_max: float | None = Query(None, description="Maximum L[3.6] in 1e9 solLum"),
    exclude_low_quality: bool = Query(False, description="Drop SPARC quality_flag == 3 (low)"),
    match_method: str | None = Query(
        None, description="Comma-separated: name_match, coordinate_match"
    ),
    require_age: bool = Query(False, description="Only galaxies with a strict stellar age_gyr"),
):
    try:
        with get_connection() as conn:
            rows = fetch_filtered_galaxies(
                conn,
                mass_min=mass_min,
                mass_max=mass_max,
                exclude_low_quality=exclude_low_quality,
                match_method=match_method,
                require_age=require_age,
            )
    except InvalidFilterError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    galaxies = [_row_to_summary(row) for row in rows]
    return GalaxyListResponse(total=len(galaxies), galaxies=galaxies)


@router.get("/galaxies/{pgc_id}", response_model=GalaxyDetail)
def get_galaxy(pgc_id: int):
    query, params = build_filtered_query(pgc_id=pgc_id)
    try:
        with get_connection() as conn:
            row = conn.execute(query, params).fetchone()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    if row is None:
        raise HTTPException(status_code=404, detail=f"no galaxy with pgc_id={pgc_id}")

    data = dict(row)
    data["f_dm_clipped"] = bool(data["f_dm_clipped"])
    return GalaxyDetail(**data)
