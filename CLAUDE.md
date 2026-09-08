# CLAUDE.md

Shared project context for Claude Code when working in this repository.

## Project

Age-Metallicity-Dark Matter: cross-references public galactic kinematics data (SPARC) with metallicity/stellar-age catalogs (HyperLeda, NED, Moustakas+2010, Pilyugin+2014, z0MGS, SDSS spectra), resolved to a canonical PGC identifier, to explore whether older/more evolved galaxies carry more dark matter than younger ones. Not a peer-reviewed source — see README's reliability map for per-variable confidence.

## Structure

- `pipeline/` — data ingestion and cross-matching pipeline
- `api/` — backend API
- `frontend/` — web frontend
- `data/` — data artifacts
- `docs/` — documentation
- `tests/` — test suite

## Conventions

- Public repo: MIT licensed, gitflow (no direct pushes to `main`, PRs required, ≥1 review via branch protection).
- CI runs Python tests on every PR (`.github/workflows/ci.yml`).
- Dependabot manages dependency PRs; `chore/dependabot-auto-merge` auto-merges passing patch/minor, non-sensitive-dependency PRs.
- Commits use Felipe's GitHub identity (felipefunes@gmail.com).
