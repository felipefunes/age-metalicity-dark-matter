# pipeline/external

External-catalog ingestion. Every module here resolves its source data to
the same canonical `pgc_id` used throughout the project (see the repo
root README's identity-resolution section) — with one deliberate
exception, documented below.

## Modules

- `identity.py` — the shared PGC identity resolver (Simbad name_match,
  falling back to NED position + Simbad coordinate cross-match). Every
  other module in this package reuses this; none reimplements name or
  coordinate resolution.
- `metallicity_age.py` — HyperLeda per-object parameter lookup (no data
  for this sample's metallicity/age fields; see
  `docs/findings/2026-08-22_hubble_mass_dm_v1.md`).
- `moustakas.py` — Moustakas et al. 2010 (SINGS oxygen abundances, two
  strong-line calibrations, per-galaxy characteristic value from a
  gradient fit). Resolves identity via `identity.py` (no PGC in the
  source catalog).
- `pilyugin.py` — Pilyugin, Grebel & Kniazev 2014 (independent oxygen
  abundances, already one row per galaxy). Resolves identity via
  `identity.py` (no PGC in the source catalog).
- `age_proxy_z0mgs.py` — z0MGS (Leroy et al. 2019) specific star
  formation rate, used as an age proxy. **Does not** use `identity.py`.

## Why z0MGS skips the identity resolver

Every other external source here is joined to a SPARC galaxy by first
resolving a name (or, failing that, a position) to a PGC id via Simbad/NED
— because those sources don't ship a PGC id of their own, and the whole
point of this project's identity handling is to never join catalogs on
raw text-name equality.

z0MGS's VizieR table (`J/ApJS/244/24/table4`) is different: it already
carries a `PGC` column, curated by the z0MGS authors themselves against
the full ~15,700-galaxy sample (verified: 0 null, 0 duplicate PGC values
across the table). Re-deriving that PGC id by running the galaxy's name
back through Simbad/NED would not add rigor — it would just risk
introducing a *new* mismatch between our resolution and the authors'
already-authoritative one, for no benefit. So `age_proxy_z0mgs.py` joins
directly on `pgc_id`, and that PGC id is treated as ground truth for this
source rather than re-verified.

This is a one-off exception for this specific source's specific data
shape, not a precedent for skipping identity resolution generally —
`moustakas.py` and `pilyugin.py`, whose source tables do *not* ship a PGC
id, still go through the full `identity.py` resolver like every SPARC
galaxy did.
