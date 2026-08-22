"""Dark-matter fraction per galaxy from SPARC mass-model rotation curves.

At each observed radius, SPARC's MassModels table gives the observed
circular velocity Vobs and the velocity contributions of the three
baryonic components at unit mass-to-light ratio: gas (Vgas, already
includes the 1.33 cosmological-helium correction and needs no scaling),
stellar disk (Vdisk) and bulge (Vbul). Because circular velocity squared
is proportional to enclosed mass for a fixed light distribution, the
actual baryonic contribution scales the tabulated disk/bulge velocities
by their assumed [3.6um] mass-to-light ratios (Upsilon):

    Vbar^2(R) = sign(Vgas)*Vgas^2 + Upsilon_disk*sign(Vdisk)*Vdisk^2
                + Upsilon_bulge*sign(Vbul)*Vbul^2

(SPARC reports Vgas/Vdisk/Vbul as signed velocities -- occasionally
negative where the corresponding surface density dips locally -- so the
sign is preserved through the square, i.e. v*|v|, following the
convention used in the SPARC papers.)

The dark-matter fraction at radius R is then

    f_DM(R) = 1 - Vbar^2(R) / Vobs(R)^2

This module evaluates f_DM at each galaxy's outermost tabulated radius
(the last row per galaxy, sorted by R), which is the point where the
rotation curve best constrains the total dark-matter content.

Uncertainty propagation: MassModels only reports an uncertainty on Vobs
(e_Vobs); Vgas/Vdisk/Vbul carry no tabulated errors, so Vbar is treated as
exact and the propagated 1-sigma uncertainty on f_DM is:

    e_f_DM = |d(f_DM)/dVobs| * e_Vobs = 2 * Vbar^2/Vobs^3 * e_Vobs
           = 2 * (1 - f_DM) * e_Vobs / Vobs
"""
from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import pandas as pd

from pipeline.config import DEFAULT_UPSILON_BULGE, DEFAULT_UPSILON_DISK


@dataclass(frozen=True)
class DarkMatterFractionResult:
    galaxy: str
    r_outer_kpc: float
    vobs: float
    e_vobs: float
    vbar: float
    f_dm: float
    e_f_dm: float
    clipped: bool


def _signed_square(v: pd.Series | np.ndarray) -> np.ndarray:
    v = np.asarray(v, dtype=float)
    return np.sign(v) * v**2


def compute_vbar2(
    row: pd.Series,
    upsilon_disk: float = DEFAULT_UPSILON_DISK,
    upsilon_bulge: float = DEFAULT_UPSILON_BULGE,
) -> float:
    vgas2 = np.sign(row["Vgas"]) * row["Vgas"] ** 2
    vdisk2 = np.sign(row["Vdisk"]) * row["Vdisk"] ** 2
    vbul2 = np.sign(row["Vbul"]) * row["Vbul"] ** 2
    return float(vgas2 + upsilon_disk * vdisk2 + upsilon_bulge * vbul2)


def dm_fraction_at_row(
    vobs: float,
    e_vobs: float,
    vbar2: float,
) -> tuple[float, float, bool]:
    """Return (f_dm, e_f_dm, clipped) for a single (Vobs, e_Vobs, Vbar^2) point."""
    if vobs is None or vobs == 0 or pd.isna(vobs):
        return float("nan"), float("nan"), False

    f_dm_raw = 1.0 - vbar2 / vobs**2
    clipped = f_dm_raw < 0.0 or f_dm_raw > 1.0
    f_dm = min(max(f_dm_raw, 0.0), 1.0)

    e_f_dm = abs(2.0 * (1.0 - f_dm_raw) * e_vobs / vobs) if e_vobs is not None and not pd.isna(e_vobs) else float("nan")

    return f_dm, e_f_dm, clipped


def compute_outer_dm_fraction(
    mass_models: pd.DataFrame,
    upsilon_disk: float = DEFAULT_UPSILON_DISK,
    upsilon_bulge: float = DEFAULT_UPSILON_BULGE,
) -> pd.DataFrame:
    """Compute f_DM at the outermost radius for every galaxy in `mass_models`.

    `mass_models` must have columns: ID, R, Vobs, e_Vobs, Vgas, Vdisk, Vbul
    (as produced by pipeline.parsers.sparc.read_mass_models).

    Returns one row per galaxy (ID) with columns:
    galaxy, r_outer_kpc, vobs, e_vobs, vbar, f_dm, e_f_dm, clipped.
    """
    required = {"ID", "R", "Vobs", "e_Vobs", "Vgas", "Vdisk", "Vbul"}
    missing = required - set(mass_models.columns)
    if missing:
        raise ValueError(f"mass_models is missing required columns: {missing}")

    results: list[DarkMatterFractionResult] = []
    for galaxy, group in mass_models.groupby("ID", sort=False):
        outer = group.sort_values("R").iloc[-1]
        vbar2 = compute_vbar2(outer, upsilon_disk=upsilon_disk, upsilon_bulge=upsilon_bulge)
        f_dm, e_f_dm, clipped = dm_fraction_at_row(outer["Vobs"], outer["e_Vobs"], vbar2)
        results.append(
            DarkMatterFractionResult(
                galaxy=galaxy,
                r_outer_kpc=float(outer["R"]),
                vobs=float(outer["Vobs"]),
                e_vobs=float(outer["e_Vobs"]) if not pd.isna(outer["e_Vobs"]) else float("nan"),
                vbar=float(np.sqrt(abs(vbar2))) * (1 if vbar2 >= 0 else -1),
                f_dm=f_dm,
                e_f_dm=e_f_dm,
                clipped=clipped,
            )
        )

    return pd.DataFrame([r.__dict__ for r in results])
