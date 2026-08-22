from __future__ import annotations

import numpy as np
from fastapi import APIRouter, HTTPException, Query

from api.db import get_connection
from api.queries import InvalidFilterError, fetch_filtered_galaxies
from api.schemas import CorrelationResponse
from api.stats import partial_spearman, spearman

router = APIRouter()

# Public correlation-variable name -> column returned by the shared galaxy query.
VARIABLES = {
    "metallicity": "metallicity",
    "hubble_type": "T",
    "age_gyr": "age_gyr",
    "dm_fraction": "f_dm",
    "mass": "l36",
    "mhi": "mhi",
}


def _column(rows, key: str) -> np.ndarray:
    return np.array([row[key] if row[key] is not None else np.nan for row in rows], dtype=float)


@router.get("/correlations", response_model=CorrelationResponse)
def correlations(
    x: str = Query(..., description=f"one of {sorted(VARIABLES)}"),
    y: str = Query(..., description=f"one of {sorted(VARIABLES)}"),
    control_for: str | None = Query(None, description=f"one of {sorted(VARIABLES)}"),
    mass_min: float | None = None,
    mass_max: float | None = None,
    exclude_low_quality: bool = False,
    match_method: str | None = None,
    require_age: bool = False,
):
    for name, value in (("x", x), ("y", y), ("control_for", control_for)):
        if value is not None and value not in VARIABLES:
            raise HTTPException(
                status_code=422,
                detail=f"invalid {name}={value!r}; must be one of {sorted(VARIABLES)}",
            )

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

    x_vals = _column(rows, VARIABLES[x])
    y_vals = _column(rows, VARIABLES[y])

    if control_for is None:
        result = spearman(x_vals, y_vals)
        note = None
    else:
        z_vals = _column(rows, VARIABLES[control_for])
        result = partial_spearman(x_vals, y_vals, z_vals)
        note = f"partial Spearman correlation controlling for {control_for}"

    return CorrelationResponse(
        x=x,
        y=y,
        control_for=control_for,
        n=result.n,
        method=result.method,
        coefficient=None if np.isnan(result.coefficient) else result.coefficient,
        p_value=None if np.isnan(result.p_value) else result.p_value,
        note=note,
    )
