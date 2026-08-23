"""Reader for CDS/ApJ "machine-readable table" (.mrt) files.

An .mrt file embeds a human-readable "Byte-by-byte Description" header,
a line of dashes, then data rows.

NOTE on a real-data quirk: the header's documented byte ranges are
column-aligned as *intended* widths, but were verified (by independent
manual byte-slicing and by `pandas.read_fwf` with those same byte offsets)
to NOT match the actual column boundaries in the live SPARC files served
from https://astroweb.case.edu/SPARC/ -- e.g. in SPARC_Lelli2016c.mrt the
documented "T" column (bytes 12-13) actually straddles the boundary
between the Hubble type and distance fields. Every data row in both SPARC
tables used here is, however, cleanly separated by whitespace runs with a
fixed number of tokens per row, so this reader tokenizes on whitespace
instead of trusting the declared byte offsets. This is verified against
the full files (175 rows / 19 tokens for the main table, 3391 rows / 10
tokens for the mass models table) before being relied on.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Callable

import pandas as pd

DASH_LINE_PREFIX = "---"


@dataclass(frozen=True)
class ColumnSpec:
    name: str
    dtype: Callable[[str], object] = str


def find_data_start(lines: list[str]) -> int:
    """Return the index of the first data line: the line after the last
    line made only of dashes (the header/data separator in CDS files).
    """
    last_dash_idx = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped.startswith(DASH_LINE_PREFIX) and set(stripped) <= {"-"}:
            last_dash_idx = i
    if last_dash_idx is None:
        raise ValueError("could not find a '---' header/data separator in .mrt file")
    return last_dash_idx + 1


def _coerce(raw: str, dtype: Callable[[str], object]):
    if raw == "":
        return None
    try:
        return dtype(raw)
    except ValueError:
        return None


def parse_mrt(path: Path | str, columns: list[ColumnSpec]) -> pd.DataFrame:
    """Parse a whitespace-tokenized .mrt data section into a DataFrame.

    Each data row must split (on runs of whitespace) into exactly
    `len(columns)` tokens; a row that doesn't is a data-format error and
    raises rather than silently misaligning fields.
    """
    path = Path(path)
    lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
    data_start = find_data_start(lines)

    records = []
    for line_no, line in enumerate(lines[data_start:], start=data_start + 1):
        if not line.strip():
            continue
        tokens = line.split()
        if len(tokens) != len(columns):
            raise ValueError(
                f"{path}:{line_no}: expected {len(columns)} whitespace-separated "
                f"fields, got {len(tokens)}: {line!r}"
            )
        row = {col.name: _coerce(tok, col.dtype) for col, tok in zip(columns, tokens)}
        records.append(row)

    return pd.DataFrame.from_records(records, columns=[c.name for c in columns])
