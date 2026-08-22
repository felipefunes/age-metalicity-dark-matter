"""Download SPARC .mrt tables over HTTP, with a local on-disk cache.

The SPARC catalog (Lelli, McGaugh & Schombert 2016, AJ, 152, 157) publishes
its tables as fixed-width CDS-format files at a small set of stable public
URLs. We never re-download a file that is already cached unless the caller
asks for a refresh.
"""
from __future__ import annotations

import logging
from pathlib import Path

import requests

from pipeline.config import DATA_RAW_DIR, SPARC_BASE_URL, SPARC_FILES

logger = logging.getLogger(__name__)

REQUEST_TIMEOUT_SECONDS = 30


def cached_path(filename: str, cache_dir: Path = DATA_RAW_DIR) -> Path:
    return cache_dir / filename


def fetch_file(
    filename: str,
    cache_dir: Path = DATA_RAW_DIR,
    force_refresh: bool = False,
    base_url: str = SPARC_BASE_URL,
) -> Path:
    """Download `filename` from SPARC into `cache_dir`, using the cache if present.

    Returns the local path to the file.
    """
    cache_dir.mkdir(parents=True, exist_ok=True)
    dest = cached_path(filename, cache_dir)

    if dest.exists() and not force_refresh:
        logger.info("using cached %s (%d bytes)", dest, dest.stat().st_size)
        return dest

    url = f"{base_url}/{filename}"
    logger.info("downloading %s -> %s", url, dest)
    response = requests.get(url, timeout=REQUEST_TIMEOUT_SECONDS)
    response.raise_for_status()

    tmp_dest = dest.with_suffix(dest.suffix + ".part")
    tmp_dest.write_bytes(response.content)
    tmp_dest.replace(dest)
    logger.info("saved %s (%d bytes)", dest, dest.stat().st_size)
    return dest


def fetch_all(cache_dir: Path = DATA_RAW_DIR, force_refresh: bool = False) -> dict[str, Path]:
    """Download every SPARC file the pipeline depends on. Returns name -> path."""
    return {
        key: fetch_file(filename, cache_dir=cache_dir, force_refresh=force_refresh)
        for key, filename in SPARC_FILES.items()
    }


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    paths = fetch_all()
    for key, path in paths.items():
        print(f"{key}: {path}")
