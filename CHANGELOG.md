# Changelog

Registro de cambios metodológicos y de datos. No es un changelog de features de software en
general (para eso está el historial de git) — es específicamente el lugar donde queda auditado
cualquier cambio que pueda afectar la interpretación de un hallazgo ya documentado en
`docs/findings/`.

## 2026-08-23 — Refactor de comunicación: README, hero, visualización y default de un toggle

**Refactor de comunicación: sin cambios en pipeline, cálculos, ni hallazgos existentes. Objetivo:
que el proyecto se entienda sin contexto previo.**

Esta entrada es continuación de la misma convención de versionado ya usada en `docs/findings/` —
acá se aplica a la documentación de cara al usuario, no a un hallazgo científico. Ningún archivo
en `docs/findings/`, ningún cálculo del pipeline ni ningún número reportado cambió. Se reorganizó
cómo se comunica lo que ya existía, para que alguien sin contexto previo (ej. un estudiante de
primer año de universidad) entienda de qué trata el proyecto, qué tan confiable es cada parte, y
no se pierda en detalles de infraestructura que no hacen a la pregunta científica.

**Qué cambió:**
- `README.md` se separó en dos documentos: un `README.md` corto (~3 min de lectura) con qué es el
  proyecto, la pregunta que investiga, un "mapa de confiabilidad" por variable y links al resto;
  y [`docs/TECHNICAL.md`](docs/TECHNICAL.md) (nuevo) con todo el contenido de implementación que
  antes vivía en el README (stack, esquema de base de datos, cómo correr el pipeline, Docker,
  despliegue en Render, CI, tests, fuentes y crédito) — movido tal cual, sin reescribir el
  contenido técnico. De paso se corrigió un error de documentación preexistente no relacionado:
  la sección de esquema de base de datos describía la tabla `metallicity_age` con las 7 columnas
  originales de HyperLeda, sin las columnas de Moustakas/Pilyugin/z0MGS/SDSS agregadas en PRs
  posteriores (el `schema.sql` real ya las tenía; solo la prosa del README había quedado vieja).
- El hero del sitio ahora tiene una oración inicial en lenguaje llano antes de los párrafos
  técnicos existentes, en los tres idiomas soportados.
- Los scatter plots del frontend ahora atenúan visualmente (línea y banda gris punteada en vez
  de color de acento) y anteceden el texto de Spearman con "Sin correlación significativa" cuando
  p > 0.05, para cualquier combinación de ejes — evita que una línea de regresión prominente
  sugiera una tendencia que el propio test estadístico no sostiene.
- El gráfico "f_DM por tipo de Hubble" (el hallazgo más sólido del proyecto) ahora muestra el
  Spearman crudo y el controlado por masa simultáneamente en el mismo texto, y el toggle de ese
  gráfico específico arranca activado — el punto central del hallazgo (que controlar por masa
  invierte la conclusión) ya no depende de que el usuario sepa que existe un toggle para verlo.



**Qué se investigó primero (no integrado):** Gallazzi et al. 2005 (MNRAS, 362, 41), el catálogo
de edades estelares vía síntesis de poblaciones más establecido para SDSS. No está en VizieR;
identificado por plate/MJD/fiber, no por nombre/coordenadas. 43/163 galaxias SPARC sí tienen un
espectro SDSS a 5″ (verificado, 0 errores), pero solo 18/43 aparecen en ese catálogo específico
(DR4, ~2006) — la mayoría de los faltantes son espectros post-2012 (SDSS-III/BOSS), demasiado
recientes para ese catálogo. De esos 18, 5 fallan su propio corte de calidad. **n final = 13**,
por debajo del umbral de 30 — no integrado. Ver
[`docs/findings/2026-08-23_stellar_age_gallazzi_attempt.md`](docs/findings/2026-08-23_stellar_age_gallazzi_attempt.md).

**Qué se integró en su lugar:** medición directa de Dn4000 (Balogh et al. 1999, en Fν) y Hδ_A
(Worthey & Ottaviani 1997, Lick, con degradación de resolución dependiente de λ vía la
resolución nativa real de cada espectro) sobre los 43 espectros ya identificados —
`pipeline/external/sdss_indices.py`. Corrección hecha sobre la marcha: la resolución Lick cerca
de Hδ_A (~4100 Å) es ~10 Å FWHM, no los "~8-9 Å" (válido solo cerca del centro del sistema,
~5000 Å) que se asumió inicialmente en el diseño. Validado contra el pipeline oficial
SDSS/MPA-JHU (`galSpecIndx`, 32 galaxias en común): Spearman ρ=0.997 (Dn4000), ρ=0.993 (Hδ_A).

**Cobertura real:** n=41/163 con ambos índices — por encima del umbral de 30.

**Correlaciones con f_DM:** ninguna concluyente (Dn4000 crudo/parcial no significativo; Hδ_A
crudo nominalmente significativo p=0.017 pero no tras controlar por masa, p=0.160; sin corrección
por comparaciones múltiples).

**Findings afectados:**
- [`docs/findings/2026-08-23_stellar_age_gallazzi_attempt.md`](docs/findings/2026-08-23_stellar_age_gallazzi_attempt.md)
  — nuevo, intento no integrado.
- [`docs/findings/2026-08-23_dn4000_hdelta_a.md`](docs/findings/2026-08-23_dn4000_hdelta_a.md) —
  nuevo, incluye sección obligatoria de limitación estructural (degeneración edad-metalicidad,
  Worthey 1994) para referenciar desde cualquier análisis futuro que cruce estas columnas con
  metalicidad.
- No afecta a los findings anteriores (variables y muestras distintas).

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
