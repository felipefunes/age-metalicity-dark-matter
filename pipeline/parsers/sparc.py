"""Typed readers for the two SPARC .mrt tables this project uses.

Column order matches each file's "Byte-by-byte Description" header at
https://astroweb.case.edu/SPARC/ (field names are taken from the `Label`
column there); see pipeline/parsers/mrt.py for why parsing is
whitespace-token based rather than byte-offset based.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

from pipeline.parsers.mrt import ColumnSpec, parse_mrt

# --- SPARC_Lelli2016c.mrt : one row per galaxy -----------------------------
SPARC_MAIN_COLUMNS = [
    ColumnSpec("Galaxy", str),
    ColumnSpec("T", int),
    ColumnSpec("D", float),
    ColumnSpec("e_D", float),
    ColumnSpec("f_D", int),
    ColumnSpec("Inc", float),
    ColumnSpec("e_Inc", float),
    ColumnSpec("L36", float),
    ColumnSpec("e_L36", float),
    ColumnSpec("Reff", float),
    ColumnSpec("SBeff", float),
    ColumnSpec("Rdisk", float),
    ColumnSpec("SBdisk", float),
    ColumnSpec("MHI", float),
    ColumnSpec("RHI", float),
    ColumnSpec("Vflat", float),
    ColumnSpec("e_Vflat", float),
    ColumnSpec("Q", int),
    ColumnSpec("Ref", str),
]

# --- MassModels_Lelli2016c.mrt : one row per (galaxy, radius) -------------
MASS_MODELS_COLUMNS = [
    ColumnSpec("ID", str),
    ColumnSpec("D", float),
    ColumnSpec("R", float),
    ColumnSpec("Vobs", float),
    ColumnSpec("e_Vobs", float),
    ColumnSpec("Vgas", float),
    ColumnSpec("Vdisk", float),
    ColumnSpec("Vbul", float),
    ColumnSpec("SBdisk", float),
    ColumnSpec("SBbul", float),
]


def read_sparc_main(path: Path | str) -> pd.DataFrame:
    df = parse_mrt(path, SPARC_MAIN_COLUMNS)
    df["Galaxy"] = df["Galaxy"].str.strip()
    df["Ref"] = df["Ref"].str.strip()
    return df


def read_mass_models(path: Path | str) -> pd.DataFrame:
    df = parse_mrt(path, MASS_MODELS_COLUMNS)
    df["ID"] = df["ID"].str.strip()
    return df
