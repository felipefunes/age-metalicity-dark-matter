-- SQLite schema for the dark-matter / metallicity / age dataset.
-- Every table keys on pgc_id (Principal Galaxies Catalogue / HyperLeda LEDA
-- id); all joins in the API go through pgc_id, never through a text name.

DROP TABLE IF EXISTS metallicity_age;
DROP TABLE IF EXISTS sparc_kinematics;
DROP TABLE IF EXISTS galaxy_identity;

CREATE TABLE galaxy_identity (
    pgc_id         INTEGER PRIMARY KEY,
    name_sparc     TEXT NOT NULL,
    name_external  TEXT,
    ra             REAL,
    dec            REAL,
    match_method   TEXT NOT NULL CHECK (match_method IN ('name_match', 'coordinate_match'))
);

CREATE TABLE sparc_kinematics (
    pgc_id          INTEGER PRIMARY KEY REFERENCES galaxy_identity(pgc_id),
    T               INTEGER,
    distance_mpc    REAL,
    vflat           REAL,
    e_vflat         REAL,
    r_outer_kpc     REAL,
    vobs_outer      REAL,
    e_vobs_outer    REAL,
    vbar_outer      REAL,
    f_dm            REAL,
    e_f_dm          REAL,
    f_dm_clipped    INTEGER NOT NULL DEFAULT 0,
    l36             REAL,
    e_l36           REAL,
    mhi             REAL,
    quality_flag    INTEGER
);

CREATE TABLE metallicity_age (
    pgc_id               INTEGER PRIMARY KEY REFERENCES galaxy_identity(pgc_id),
    metallicity          REAL,
    metallicity_source   TEXT,
    metallicity_method   TEXT,
    age_gyr              REAL,
    age_source           TEXT,
    age_method           TEXT
);

CREATE INDEX idx_kinematics_T ON sparc_kinematics(T);
CREATE INDEX idx_kinematics_l36 ON sparc_kinematics(l36);
