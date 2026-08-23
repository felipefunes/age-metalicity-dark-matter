# Changelog

Registro de cambios metodológicos y de datos. No es un changelog de features de software en
general (para eso está el historial de git) — es específicamente el lugar donde queda auditado
cualquier cambio que pueda afectar la interpretación de un hallazgo ya documentado en
`docs/findings/`.

## 2026-08-22 — Metalicidad real (Moustakas+2010, Pilyugin+2014) y proxy de edad (sSFR, z0MGS)

**Qué se agregó:** HyperLeda/NED no exponían metalicidad ni edad estelar para ninguna galaxia
SPARC (ver hallazgo inicial más abajo). Se integraron tres catálogos externos concretos vía
`astroquery.vizier`, reutilizando el resolvedor de identidad ya existente
(`pipeline/external/identity.py`) para Moustakas y Pilyugin, y un join directo por `pgc_id` para
z0MGS (su tabla ya trae PGC propio y curado — única excepción documentada, ver
`pipeline/external/README.md`).

**Por qué en tres columnas separadas y no una:** Moustakas+2010 reporta dos calibraciones de
abundancia (KK04, PT05) conocidas por diferir sistemáticamente entre sí; Pilyugin+2014 es un
catálogo independiente. Se decidió explícitamente no fusionarlas ni promediarlas — quedan como
`metallicity_kk04`, `metallicity_pt05`, `metallicity_pilyugin2014`. Un chequeo de consistencia
cruzada (11 galaxias en ambas fuentes) confirmó la decisión: alta correlación de *orden* entre
fuentes (Spearman ρ=0.78–0.99) pero desplazamientos sistemáticos de hasta 0.47 dex en la escala
absoluta.

**Cobertura real (de 163 galaxias SPARC):** 14 con metalicidad Moustakas (KK04/PT05), 19 con
Pilyugin, 22 con al menos una fuente de metalicidad (11 en ambas), 126 con `age_proxy_ssfr`
(z0MGS). El n de metalicidad (22) quedó por debajo del umbral de 30 fijado de antemano como
mínimo razonable — se integró y documentó igual, marcado explícitamente como
preliminar/indicativo, no concluyente.

**`age_proxy_ssfr` no es una edad:** es log₁₀(sSFR), un proxy de actividad de formación estelar
reciente. Se guarda en columnas separadas (`age_proxy_ssfr`, `age_proxy_source`,
`age_proxy_method`) y nunca se escribe en `age_gyr`, que sigue reservada para una futura edad de
síntesis de poblaciones real.

**Findings afectados:**
- [`docs/findings/2026-08-22_metallicity_age_proxy_v1.md`](docs/findings/2026-08-22_metallicity_age_proxy_v1.md)
  — nuevo. Cobertura real, chequeo de consistencia entre fuentes, y correlaciones parciales con
  f_DM (ninguna significativa para metalicidad con n=14–19; sSFR marginal, p=0.060 con n=126).
- No afecta a `2026-08-22_hubble_mass_dm_v1.md` ni a su verificación `v2` — son hallazgos sobre
  variables distintas.

## 2026-08-22 — Verificación: escala de la variable de control en correlación parcial

**Qué se investigó:** se planteó la duda de si `partial_spearman()` (`api/stats.py`), usada por
`/correlations?control_for=...`, controla por `L[3.6]` en escala lineal — problemático en
principio porque la masa abarca ~5 órdenes de magnitud en la muestra SPARC (0.01 a 490 ×10⁹ L☉),
y una regresión lineal sobre valores crudos le daría peso desproporcionado a los pocos puntos de
masa muy alta.

**Qué se encontró:** el problema no aplica. `partial_spearman` residualiza sobre **rangos**
(`scipy.stats.rankdata`), no sobre valores crudos, y el rango de una variable es invariante ante
cualquier transformación monótona creciente aplicada antes de rankear — así que controlar por
`L[3.6]` crudo o por `log10(L[3.6])` da resultados idénticos bit a bit. Verificado empíricamente
sobre las 163 galaxias reales (ρ y p idénticos a >15 decimales) y fijado como test de regresión
(`tests/test_stats.py::test_partial_spearman_invariant_to_monotonic_control_rescaling`).

**Código:** sin cambios en `api/stats.py` (no había nada que corregir). Se agregó el test de
regresión mencionado arriba.

**Findings afectados:**
- [`docs/findings/2026-08-22_hubble_mass_dm_v1.md`](docs/findings/2026-08-22_hubble_mass_dm_v1.md)
  — hallazgo original (T y masa confundidos; T–f_DM se invierte al controlar por masa). **Sigue
  vigente sin cambios** — esta revisión confirma sus números, no los corrige.
- [`docs/findings/2026-08-22_hubble_mass_dm_v2_log_control_check.md`](docs/findings/2026-08-22_hubble_mass_dm_v2_log_control_check.md)
  — nuevo, documenta la verificación de arriba con la prueba empírica.

## 2026-08-22 — Hallazgo inicial: masa como confounder de tipo de Hubble

Primer análisis de correlaciones sobre las 163 galaxias SPARC resueltas a PGC (metalicidad/edad
estelar aún sin cobertura vía HyperLeda). Ver
[`docs/findings/2026-08-22_hubble_mass_dm_v1.md`](docs/findings/2026-08-22_hubble_mass_dm_v1.md).
