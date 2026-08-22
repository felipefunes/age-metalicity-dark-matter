"""Read-only SQLite access for the API.

The database path defaults to the same path the pipeline writes to
(pipeline.config.DB_PATH), overridable with the API_DB_PATH env var so the
API container can point at a mounted volume in docker-compose.
"""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

from pipeline.config import DB_PATH as PIPELINE_DB_PATH


def get_db_path() -> Path:
    """Read API_DB_PATH lazily (not at import time) so tests can override it
    per-test via monkeypatch without needing to reload this module."""
    return Path(os.environ.get("API_DB_PATH", str(PIPELINE_DB_PATH)))


@contextmanager
def get_connection():
    db_path = get_db_path()
    if not db_path.exists():
        raise FileNotFoundError(
            f"database not found at {db_path}. Run the pipeline first: "
            "python -m pipeline.load_db"
        )
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
