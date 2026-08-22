# Materia Oscura, Metalicidad y Edad Galáctica

Herramienta exploratoria para investigar si existe correlación entre la fracción de materia
oscura de una galaxia, su metalicidad y su edad (tipo de Hubble como proxy morfológico, y edad
estelar en sentido estricto cuando está disponible), controlando por masa.

Cruza datos públicos de cinemática galáctica ([SPARC](http://astroweb.case.edu/SPARC/)) con
metalicidad y edad estelar de catálogos externos (HyperLeda, NED/Simbad), resolviendo cada
galaxia a un identificador canónico **PGC** (Principal Galaxies Catalogue) — nunca por
coincidencia de texto de nombre.

**No es una fuente con conclusiones validadas por revisión de pares.**

## Estado real de los datos (corrida completa, 175 galaxias SPARC)

- **163/175** galaxias resueltas a PGC (154 por nombre vía Simbad, 9 por coordenadas vía
  NED+Simbad). Las 12 restantes son designaciones de galaxias de brillo superficial extremo
  (serie `F5xx-x` de Schombert/Bothun) sin cross-id LEDA/PGC en ningún catálogo consultado —
  quedan documentadas en `data/processed/unresolved_galaxies.csv`, no en la base de datos (no
  pueden tener una PK nula).
- **Metalicidad y edad estelar (HyperLeda): 0/163 con dato**, verificado contra la página real de
  varias galaxias. HyperLeda no tiene un campo de metalicidad ni de edad estelar para galaxias
  tardías/enanas (la mayoría de SPARC); no se inventó ni se derivó un valor sustituto. El
  pipeline y el frontend funcionan hoy 100% con tipo de Hubble (T) como proxy, y las columnas
  `metallicity`/`age_gyr` quedan listas para poblarse sin romper nada si se conecta otra fuente.
- **f_DM** (fracción de materia oscura en el radio más externo): rango 0–0.94, media ≈0.72,
  consistente con la literatura de SPARC.

Ver `data/processed/coverage_report.json` después de correr el pipeline para el detalle completo.

## Stack

- **Pipeline**: Python (pandas, astropy, scipy, statsmodels, astroquery, requests)
- **API**: FastAPI + SQLite
- **Frontend**: React + TypeScript + Plotly.js (ver justificación abajo)
- **Docker Compose** para reproducibilidad completa (pipeline → API → frontend)

### ¿Por qué Plotly.js y no Recharts?

El frontend necesita barras de error verticales, escala logarítmica obligatoria en el eje de
masa/MHI, una leyenda de gradiente de color en escala log, y una línea de regresión con banda de
confianza superpuesta. Plotly.js soporta todo esto de forma nativa; Recharts hubiera requerido
capas SVG a medida para cada uno de estos requisitos.

## Estructura del repo

```
pipeline/
  fetch/          descarga cacheada de los .mrt de SPARC
  parsers/        parseo de SPARC_Lelli2016c.mrt y MassModels_Lelli2016c.mrt
  external/       resolución de identidad PGC (Simbad/NED) + metalicidad/edad (HyperLeda)
  dm_fraction.py  cálculo de f_DM por galaxia con propagación de e_Vobs
  load_db.py      orquestador: fetch → parse → f_DM → identidad → SQLite
  schema.sql      esquema de la base de datos
api/
  routers/        /galaxies, /galaxies/{pgc_id}, /correlations
  stats.py        Spearman y Spearman parcial (residualización de rangos)
frontend/
  src/            React + TypeScript + Plotly.js
tests/            parsers, fórmula de f_DM, resolución de identidad, stats, endpoints de la API
```

## Esquema de la base de datos (SQLite)

Todas las tablas y consultas de la API hacen `JOIN` por `pgc_id`, nunca por nombre de texto.

- **`galaxy_identity`**`(pgc_id PK, name_sparc, name_external, ra, dec, match_method)` —
  `match_method` es `name_match` (Simbad, por nombre) o `coordinate_match` (NED da la posición,
  Simbad confirma el PGC por cone-search dentro de una tolerancia configurable, default 5″).
- **`sparc_kinematics`**`(pgc_id FK, T, distance_mpc, vflat, e_vflat, r_outer_kpc, vobs_outer,
  e_vobs_outer, vbar_outer, f_dm, e_f_dm, f_dm_clipped, l36, e_l36, mhi, quality_flag)`
- **`metallicity_age`**`(pgc_id FK, metallicity, metallicity_source, metallicity_method, age_gyr,
  age_source, age_method)`

### Cálculo de f_DM

En el radio más externo tabulado por galaxia: `Vbar² = Vgas|Vgas| + ϒ_disk·Vdisk|Vdisk| +
ϒ_bulge·Vbul|Vbul|` (signo preservado, escalando las velocidades tabuladas a M/L=1 por los
mass-to-light ratios en [3.6μm], default `ϒ_disk=0.5`, `ϒ_bulge=0.7`, configurables por env var).
`f_DM = 1 - Vbar²/Vobs²`, clippeado a [0,1] con el clip flageado explícitamente en
`f_dm_clipped`. Solo `e_Vobs` tiene incertidumbre tabulada en SPARC, así que
`e_f_DM = 2·(1-f_DM)·e_Vobs/Vobs`.

## Cómo correr el pipeline de punta a punta

```bash
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

python -m pipeline.load_db -v
# --limit N        procesa solo las primeras N galaxias (útil para desarrollo:
#                   la resolución de identidad y la consulta a HyperLeda son lo lento)
# --force-refresh-fetch / --force-refresh-identity / --force-refresh-metallicity
#                   ignoran la caché local y vuelven a consultar
```

Esto descarga los `.mrt` de SPARC (cacheados en `data/raw/sparc/`), calcula f_DM, resuelve
identidad PGC vía Simbad/NED (cacheado en `data/raw/external/identity_cache.json`), consulta
HyperLeda (cacheado en `data/raw/external/metallicity_age_cache.json`), y escribe
`data/processed/galaxies.sqlite` + `coverage_report.json` + `unresolved_galaxies.csv`.

## Cómo levantar todo con Docker Compose

```bash
docker compose up --build
```

Corre el pipeline una vez (la API espera a que termine con éxito), después levanta la API en
`http://localhost:8000` y el frontend en `http://localhost:8080` (nginx sirve el build estático y
hace proxy de `/api/*` hacia la API, así el navegador nunca hace un request cross-origin). Los
datos generados quedan en `./data/` en el host, compartidos entre los contenedores de pipeline y
API vía bind mount.

> Nota: la especificación `depends_on: condition: service_completed_successfully` requiere Docker
> Compose v2.20+ (el plugin `docker compose`, no el binario legado `docker-compose` v1).

### Desarrollo local sin Docker

```bash
# terminal 1: API
uvicorn api.main:app --reload --port 8000

# terminal 2: frontend (proxy de /api hacia localhost:8000 vía vite.config.ts)
cd frontend
npm install
npm run dev
```

## Tests

```bash
pytest                    # parsers, fórmula de f_DM, resolución de identidad, stats, API
cd frontend && npx tsc -b && npm run build   # type-check + build de producción
```

## Fuentes de datos y crédito

- **SPARC** — Lelli, F., McGaugh, S. S., & Schombert, J. M. 2016, *The Astronomical Journal*,
  152, 157. Cinemática, tipo de Hubble, luminosidad [3.6μm], masa de HI, curvas de rotación
  descompuestas.
- **HyperLeda** — parámetros extragalácticos por objeto.
- **NED / Simbad** — resolución de identidad a PGC.

## Limitaciones conocidas

- Metalicidad y edad estelar en sentido estricto no están disponibles hoy para ninguna galaxia de
  SPARC vía HyperLeda (ver arriba). El proyecto está preparado para sumarlas sin romper nada si
  se conecta otra fuente (ver columnas `*_source`/`*_method`), pero eso queda fuera del alcance
  actual — requiere elegir y justificar un catálogo específico de abundancias/edades y su propio
  cruce de identidad.
- 12/175 galaxias SPARC no tienen cross-id PGC en Simbad ni NED (documentadas, excluidas).
