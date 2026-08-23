"""End-to-end pipeline: fetch SPARC -> parse -> dark-matter fraction ->
PGC identity resolution -> HyperLeda metallicity/age -> SQLite.

Run with `python -m pipeline.load_db`. See `--help` for options; the most
useful one during development is `--limit N`, which restricts the run to
the first N SPARC galaxies so identity/metallicity network calls (the slow
part) don't have to touch all 175 galaxies every time.
"""
from __future__ import annotations

import argparse
import json
import logging
import sqlite3
from pathlib import Path

import pandas as pd

from pipeline.config import (
    DATA_PROCESSED_DIR,
    DB_PATH,
    UPSILON_BULGE,
    UPSILON_DISK,
)
from pipeline.dm_fraction import compute_outer_dm_fraction
from pipeline.external.age_proxy_z0mgs import compute_ssfr
from pipeline.external.identity import resolve_all
from pipeline.external.metallicity_age import lookup_all
from pipeline.external.moustakas import compute_moustakas_metallicity
from pipeline.external.pilyugin import compute_pilyugin_metallicity
from pipeline.external.sdss_indices import compute_sdss_spectral_ages
from pipeline.fetch.sparc_fetch import fetch_all
from pipeline.parsers.sparc import read_mass_models, read_sparc_main

logger = logging.getLogger(__name__)

SCHEMA_PATH = Path(__file__).resolve().parent / "schema.sql"


def build_kinematics_table(sparc_main: pd.DataFrame, mass_models: pd.DataFrame) -> pd.DataFrame:
    dm = compute_outer_dm_fraction(mass_models, upsilon_disk=UPSILON_DISK, upsilon_bulge=UPSILON_BULGE)
    merged = sparc_main.merge(dm, left_on="Galaxy", right_on="galaxy", how="left")
    return pd.DataFrame(
        {
            "name_sparc": merged["Galaxy"],
            "T": merged["T"],
            "distance_mpc": merged["D"],
            "vflat": merged["Vflat"],
            "e_vflat": merged["e_Vflat"],
            "r_outer_kpc": merged["r_outer_kpc"],
            "vobs_outer": merged["vobs"],
            "e_vobs_outer": merged["e_vobs"],
            "vbar_outer": merged["vbar"],
            "f_dm": merged["f_dm"],
            "e_f_dm": merged["e_f_dm"],
            "f_dm_clipped": merged["clipped"].fillna(False).astype(int),
            "l36": merged["L36"],
            "e_l36": merged["e_L36"],
            "mhi": merged["MHI"],
            "quality_flag": merged["Q"],
        }
    )


def write_database(
    identity: pd.DataFrame,
    kinematics: pd.DataFrame,
    metallicity_age: pd.DataFrame,
    db_path: Path,
) -> None:
    resolved = identity[identity["match_method"] != "unresolved"].copy()
    resolved["pgc_id"] = resolved["pgc_id"].astype(int)

    kinematics_resolved = resolved[["pgc_id", "name_sparc"]].merge(
        kinematics, on="name_sparc", how="inner"
    ).drop(columns=["name_sparc"])

    metallicity_resolved = metallicity_age[
        metallicity_age["pgc_id"].isin(resolved["pgc_id"])
    ]

    db_path.parent.mkdir(parents=True, exist_ok=True)
    if db_path.exists():
        db_path.unlink()

    conn = sqlite3.connect(db_path)
    try:
        conn.executescript(SCHEMA_PATH.read_text())
        resolved[["pgc_id", "name_sparc", "name_external", "ra", "dec", "match_method"]].to_sql(
            "galaxy_identity", conn, if_exists="append", index=False
        )
        kinematics_resolved.to_sql("sparc_kinematics", conn, if_exists="append", index=False)
        metallicity_resolved.to_sql("metallicity_age", conn, if_exists="append", index=False)
        conn.commit()
    finally:
        conn.close()


def write_coverage_report(
    identity: pd.DataFrame,
    metallicity_age: pd.DataFrame,
    out_dir: Path = DATA_PROCESSED_DIR,
) -> dict:
    n_total = len(identity)
    by_method = identity["match_method"].value_counts().to_dict()
    unresolved = identity[identity["match_method"] == "unresolved"]["name_sparc"].tolist()

    n_resolved = n_total - len(unresolved)
    n_metallicity = int(metallicity_age["metallicity"].notna().sum())
    n_age = int(metallicity_age["age_gyr"].notna().sum())

    n_kk04 = int(metallicity_age["metallicity_kk04"].notna().sum())
    n_pt05 = int(metallicity_age["metallicity_pt05"].notna().sum())
    n_pilyugin2014 = int(metallicity_age["metallicity_pilyugin2014"].notna().sum())
    n_any_metallicity_source = int(
        metallicity_age[["metallicity_kk04", "metallicity_pt05", "metallicity_pilyugin2014"]].notna().any(axis=1).sum()
    )
    n_moustakas_and_pilyugin_both = int(
        (
            (metallicity_age["metallicity_kk04"].notna() | metallicity_age["metallicity_pt05"].notna())
            & metallicity_age["metallicity_pilyugin2014"].notna()
        ).sum()
    )
    n_age_proxy_ssfr = int(metallicity_age["age_proxy_ssfr"].notna().sum())
    n_age_proxy_dn4000 = int(metallicity_age["age_proxy_dn4000"].notna().sum())
    n_age_proxy_hdelta_a = int(metallicity_age["age_proxy_hdelta_a"].notna().sum())

    report = {
        "n_total_sparc_galaxies": n_total,
        "n_resolved_to_pgc": n_resolved,
        "match_method_counts": by_method,
        "n_unresolved": len(unresolved),
        "unresolved_names": unresolved,
        "n_with_metallicity": n_metallicity,
        "n_with_age_gyr": n_age,
        "n_with_metallicity_kk04_moustakas2010": n_kk04,
        "n_with_metallicity_pt05_moustakas2010": n_pt05,
        "n_with_metallicity_pilyugin2014": n_pilyugin2014,
        "n_with_any_external_metallicity_source": n_any_metallicity_source,
        "n_with_moustakas_and_pilyugin_both": n_moustakas_and_pilyugin_both,
        "n_with_age_proxy_ssfr_z0mgs": n_age_proxy_ssfr,
        "n_with_age_proxy_dn4000": n_age_proxy_dn4000,
        "n_with_age_proxy_hdelta_a": n_age_proxy_hdelta_a,
        "upsilon_disk": UPSILON_DISK,
        "upsilon_bulge": UPSILON_BULGE,
    }

    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "coverage_report.json").write_text(json.dumps(report, indent=2))

    unresolved_df = identity[identity["match_method"] == "unresolved"][["name_sparc", "note"]]
    unresolved_df.to_csv(out_dir / "unresolved_galaxies.csv", index=False)

    return report


def run_pipeline(
    limit: int | None = None,
    db_path: Path = DB_PATH,
    force_refresh_fetch: bool = False,
    force_refresh_identity: bool = False,
    force_refresh_metallicity: bool = False,
    force_refresh_sdss_indices: bool = False,
) -> dict:
    logger.info("fetching SPARC tables")
    paths = fetch_all(force_refresh=force_refresh_fetch)

    logger.info("parsing SPARC tables")
    sparc_main = read_sparc_main(paths["sparc_main"])
    mass_models = read_mass_models(paths["mass_models"])

    if limit is not None:
        sparc_main = sparc_main.head(limit)
        mass_models = mass_models[mass_models["ID"].isin(sparc_main["Galaxy"])]

    logger.info("computing dark-matter fraction for %d galaxies", len(sparc_main))
    kinematics = build_kinematics_table(sparc_main, mass_models)

    logger.info("resolving PGC identity for %d galaxies", len(sparc_main))
    identity = resolve_all(sparc_main["Galaxy"].tolist(), force_refresh=force_refresh_identity)

    resolved_pgc_ids = identity.loc[identity["match_method"] != "unresolved", "pgc_id"].astype(int).tolist()
    resolved_pgc_id_set = set(resolved_pgc_ids)

    logger.info("looking up metallicity/age for %d resolved galaxies", len(resolved_pgc_ids))
    metallicity_results = lookup_all(resolved_pgc_ids, force_refresh=force_refresh_metallicity)
    metallicity_age = pd.DataFrame([r.as_dict() for r in metallicity_results]).drop(columns=["note"])

    logger.info("cross-matching Moustakas+2010, Pilyugin+2014, and z0MGS")
    moustakas_df = compute_moustakas_metallicity(
        resolved_pgc_id_set, force_refresh_fetch=force_refresh_fetch, force_refresh_identity=force_refresh_identity
    )
    pilyugin_df = compute_pilyugin_metallicity(
        resolved_pgc_id_set, force_refresh_fetch=force_refresh_fetch, force_refresh_identity=force_refresh_identity
    )
    ssfr_df = compute_ssfr(resolved_pgc_id_set, force_refresh_fetch=force_refresh_fetch)

    logger.info("measuring Dn4000/HdeltaA directly from SDSS spectra for %d resolved galaxies", len(resolved_pgc_ids))
    resolved_positions = identity.loc[
        identity["match_method"] != "unresolved", ["pgc_id", "ra", "dec"]
    ].astype({"pgc_id": int})
    sdss_indices_df = compute_sdss_spectral_ages(
        resolved_positions,
        force_refresh_match=force_refresh_sdss_indices,
        force_refresh_spectra=force_refresh_sdss_indices,
    )

    metallicity_age = (
        metallicity_age.merge(moustakas_df, on="pgc_id", how="left")
        .merge(pilyugin_df, on="pgc_id", how="left")
        .merge(ssfr_df, on="pgc_id", how="left")
        .merge(sdss_indices_df, on="pgc_id", how="left")
    )

    logger.info("writing SQLite database at %s", db_path)
    write_database(identity, kinematics, metallicity_age, db_path)

    report = write_coverage_report(identity, metallicity_age)
    logger.info("coverage report: %s", json.dumps(report, indent=2))
    return report


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=None, help="only process the first N SPARC galaxies")
    parser.add_argument("--db-path", type=Path, default=DB_PATH)
    parser.add_argument("--force-refresh-fetch", action="store_true")
    parser.add_argument("--force-refresh-identity", action="store_true")
    parser.add_argument("--force-refresh-metallicity", action="store_true")
    parser.add_argument("--force-refresh-sdss-indices", action="store_true")
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO if args.verbose else logging.WARNING,
        format="%(levelname)s %(name)s: %(message)s",
    )

    run_pipeline(
        limit=args.limit,
        db_path=args.db_path,
        force_refresh_fetch=args.force_refresh_fetch,
        force_refresh_identity=args.force_refresh_identity,
        force_refresh_metallicity=args.force_refresh_metallicity,
        force_refresh_sdss_indices=args.force_refresh_sdss_indices,
    )


if __name__ == "__main__":
    main()
