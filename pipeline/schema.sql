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

-- metallicity/metallicity_source/metallicity_method and age_gyr/age_source/
-- age_method are the original generic single-value slots (from HyperLeda),
-- kept as-is even though HyperLeda has no data for this sample (see
-- docs/findings/2026-08-22_hubble_mass_dm_v1.md) -- they stay available for
-- a future canonical single source without needing a schema change.
--
-- metallicity_kk04/metallicity_pt05/metallicity_pilyugin2014 are three
-- independent, non-merged oxygen-abundance estimates from two external
-- catalogs (see docs/findings/ for the dated writeup and full citations):
--   - metallicity_kk04, metallicity_pt05: Moustakas et al. 2010, ApJS, 190,
--     233 (SINGS sample) -- per-galaxy characteristic abundance at
--     R=0.4*R25 from a weighted linear fit of O/H vs R/R25 across that
--     galaxy's HII regions (VizieR J/ApJS/190/233/table10), evaluated
--     separately for each of the two strong-line calibrations the paper
--     reports (KK04 = Kobulnicky & Kewley 2004, PT05 = Pilyugin & Thuan
--     2005) -- deliberately NOT merged into one value; they are known to
--     differ systematically. n_hii_regions_moustakas records how many HII
--     regions supported that galaxy's fit (minimum 2 required to fit a
--     line at all).
--   - metallicity_pilyugin2014: Pilyugin, Grebel & Kniazev 2014, AJ, 147,
--     131 -- independent catalog, already one row per galaxy (VizieR
--     J/AJ/147/131/galaxies: central O/H at R=0 plus a published radial
--     gradient), evaluated at the same R=0.4*R25 convention as above using
--     the paper's own gradient fit (no refitting needed for this source).
--
-- age_proxy_ssfr is a PROXY for age via recent star-formation activity,
-- NOT a stellar-population-synthesis age -- it must never be conflated
-- with age_gyr. Source: z0MGS (Leroy et al. 2019, ApJS, 244, 24),
-- log10(sSFR / yr^-1) = logSFR - logM* from VizieR J/ApJS/244/24/table4,
-- which already ships a PGC id per galaxy -- joined directly on pgc_id,
-- not re-resolved through the Simbad/NED identity pipeline (see
-- pipeline/external/README.md for why).
--
-- age_proxy_dn4000 / age_proxy_hdelta_a: measured DIRECTLY from SDSS
-- spectra (pipeline/external/sdss_indices.py), not taken from a
-- third-party catalog -- Gallazzi et al. 2005 (the obvious pre-computed
-- source) was tried first and gave only n=13 (see
-- docs/findings/2026-08-23_stellar_age_gallazzi_attempt.md), too old a
-- SDSS data release to cover most of this project's post-2012 spectra.
-- Source/method are constant per column, so documented here rather than
-- as redundant per-row text columns (same convention as
-- metallicity_kk04/pt05/pilyugin2014 above):
--   - age_proxy_dn4000: Balogh et al. 1999 narrow 4000-Angstrom break,
--     measured in Fnu (verified against the literature) from each
--     galaxy's own SDSS spectrum (5 arcsec position match, reusing this
--     project's existing ra/dec). n_pixels_dn4000 = the smaller of the
--     two bands' usable-pixel counts, an audit trail. Validated against
--     the official SDSS/MPA-JHU pipeline's own D4000_n for the same 32
--     spectra: Spearman rho=0.997.
--   - age_proxy_hdelta_a: Worthey & Ottaviani 1997 Lick HdeltaA index,
--     measured after degrading each spectrum from its own native
--     resolution (from its `wdisp` column) to the classical, wavelength-
--     dependent Lick/IDS resolution (~10 Angstrom FWHM near this index,
--     not the ~8-9 Angstrom that only applies near the Lick system's
--     central wavelength ~5000 Angstrom) via a per-wavelength Gaussian
--     kernel. Measured alongside Dn4000 (Kauffmann et al. 2003) to
--     separate an old/quiescent population from one with a recent
--     starburst superimposed -- NOT a resolution of the classical
--     age-metallicity degeneracy (Worthey 1994); see the dedicated
--     methodology-limitations section in
--     docs/findings/2026-08-23_dn4000_hdelta_a.md before interpreting
--     any correlation between either of these columns and metallicity.
--     Validated against the same MPA-JHU reference: Spearman rho=0.993.
CREATE TABLE metallicity_age (
    pgc_id                      INTEGER PRIMARY KEY REFERENCES galaxy_identity(pgc_id),
    metallicity                 REAL,
    metallicity_source          TEXT,
    metallicity_method          TEXT,
    age_gyr                     REAL,
    age_source                  TEXT,
    age_method                  TEXT,
    metallicity_kk04            REAL,
    e_metallicity_kk04          REAL,
    metallicity_pt05            REAL,
    e_metallicity_pt05          REAL,
    n_hii_regions_moustakas     INTEGER,
    metallicity_pilyugin2014    REAL,
    e_metallicity_pilyugin2014  REAL,
    age_proxy_ssfr              REAL,
    e_age_proxy_ssfr            REAL,
    age_proxy_source            TEXT,
    age_proxy_method            TEXT,
    age_proxy_dn4000            REAL,
    e_age_proxy_dn4000          REAL,
    n_pixels_dn4000              INTEGER,
    age_proxy_hdelta_a          REAL,
    e_age_proxy_hdelta_a        REAL,
    n_pixels_hdelta_a            INTEGER
);

CREATE INDEX idx_kinematics_T ON sparc_kinematics(T);
CREATE INDEX idx_kinematics_l36 ON sparc_kinematics(l36);
