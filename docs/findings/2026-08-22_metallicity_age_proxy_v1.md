# v1 — Metalicidad real (Moustakas+2010, Pilyugin+2014) y proxy de edad por sSFR (z0MGS)

**Estado:** exploratorio, **preliminar/indicativo, no concluyente** para la parte de
metalicidad (muestra chica, ver más abajo). No modifica ni reemplaza
[`2026-08-22_hubble_mass_dm_v1.md`](2026-08-22_hubble_mass_dm_v1.md) (masa/tipo de Hubble/f_DM,
n=163) ni su verificación metodológica
[`v2`](2026-08-22_hubble_mass_dm_v2_log_control_check.md) — es un hallazgo independiente sobre
variables distintas.

## Por qué existe este documento

HyperLeda/NED no exponen metalicidad ni edad estelar para ninguna de las 163 galaxias SPARC
resueltas (ver `2026-08-22_hubble_mass_dm_v1.md`). Este documento integra dos catálogos externos
concretos de metalicidad y uno de tasa de formación estelar específica (sSFR, un *proxy* de
edad poblacional), y reporta qué correlación parcial con f_DM se puede — o no se puede — sostener
con los datos reales.

## Fuentes

- **Moustakas, J., Kennicutt, R. C., Jr., Tremonti, C. A., Dale, D. A., Smith, J.-D. T., &
  Calzetti, D. 2010**, "Optical Spectroscopy and Nebular Oxygen Abundances of the Spitzer/SINGS
  Galaxies", *ApJS*, 190, 233. VizieR `J/ApJS/190/233`. Muestra **SINGS** (no THINGS — corrección
  hecha antes de implementar; THINGS es la contraparte de mapeo HI en VLA para gran parte de la
  misma muestra, fácil de confundir, pero Moustakas+2010 es el paper de espectroscopía óptica de
  SINGS). Abundancias de oxígeno por región HII (tabla `table10`), dos calibraciones de líneas
  fuertes reportadas en paralelo: KK04 (Kobulnicky & Kewley 2004) y PT05 (Pilyugin & Thuan 2005)
  — **no fusionadas**, guardadas como `metallicity_kk04` y `metallicity_pt05` por separado.
- **Pilyugin, L. S., Grebel, E. K., & Kniazev, A. Y. 2014**, "The Abundance Properties of Nearby
  Late-Type Galaxies. I. The Data", *AJ*, 147, 131. VizieR `J/AJ/147/131`. Catálogo independiente
  de Moustakas+2010 (distinta selección de muestra, distintos espectros), ya con un valor de
  abundancia central y gradiente por galaxia. Guardado como `metallicity_pilyugin2014`.
- **Leroy, A. K., et al. 2019**, "A z=0 Multiwavelength Galaxy Synthesis. I. A WISE and GALEX
  Atlas of Local Galaxies", *ApJS*, 244, 24 (proyecto z0MGS). VizieR `J/ApJS/244/24`. sSFR =
  SFR / M* como proxy de edad poblacional (sSFR bajo → población dominada por estrellas viejas).
  Guardado como `age_proxy_ssfr` (log₁₀, yr⁻¹) — **nunca** mezclado con `age_gyr`.

## Metodología: de "muchas regiones HII" a "un valor por galaxia"

`sparc pgc_id → metallicity_age` requiere un valor por galaxia; las fuentes crudas no siempre lo
dan así:

- **Moustakas+2010**: la tabla de abundancias está a nivel de región HII (561 mediciones, 38
  galaxias). Para cada galaxia con ≥2 regiones (mínimo para ajustar una recta; **31/38 lo
  cumplen, 30 con ≥3**), se ajusta un gradiente lineal ponderado O/H = a + b·(R/R25) por
  mínimos cuadrados ponderados (`statsmodels.WLS`, pesos = 1/σ²) y se evalúa en **R=0.4·R25** —
  la convención estándar de "abundancia característica" en esta literatura (Zaritsky, Kennicutt
  & Huchra 1994). Se hace por separado para KK04 y PT05. El número de regiones usadas por galaxia
  queda registrado en `n_hii_regions_moustakas` para auditoría.
- **Pilyugin+2014**: la tabla ya trae, por galaxia, la abundancia central (`[O/H]`, en R=0) y el
  gradiente propio (`C[O/H]1`, dex por R/R25) ajustados por los propios autores — no hace falta
  reajustar nada, solo evaluar `O/H(0.4·R25) = [O/H] + 0.4·C[O/H]1` con su propio ajuste
  (verificado contra un caso real: NGC 0300, `[O/H]=8.51, C[O/H]1=-0.519` → 8.302, un valor
  físicamente razonable). La incertidumbre usada (`e_metallicity_pilyugin2014`) es `s_[O/H]`, la
  dispersión de las regiones alrededor de la tendencia radial de esa galaxia — no es un error
  estándar formal del punto evaluado en 0.4·R25 específicamente, y se documenta como tal.
- **z0MGS**: a diferencia de las otras dos fuentes, su tabla (`J/ApJS/244/24/table4`) ya trae un
  `PGC` propio, curado por los autores (verificado: 0 nulos, 0 duplicados en ~15 700 filas) — se
  cruza directo por `pgc_id`, sin pasar por el resolvedor de identidad Simbad/NED (ver
  `pipeline/external/README.md` para la justificación completa de esta única excepción).

## Cobertura real (163 galaxias SPARC resueltas a PGC)

| Fuente | n | % de 163 |
|---|---|---|
| `metallicity_kk04` (Moustakas, KK04) | 14 | 8.6% |
| `metallicity_pt05` (Moustakas, PT05) | 14 | 8.6% |
| `metallicity_pilyugin2014` (Pilyugin) | 19 | 11.7% |
| **Al menos una fuente de metalicidad** | **22** | **13.5%** |
| En **ambas** fuentes (Moustakas ∩ Pilyugin) | 11 | 6.7% |
| `age_proxy_ssfr` (z0MGS) | 126 | 77.3% |

**n=22 para metalicidad está por debajo del umbral de 30 fijado de antemano como mínimo
razonable para sacar conclusiones.** Se integró igual (según lo decidido explícitamente), pero
los resultados de correlación con metalicidad que siguen son **preliminares/indicativos, no
concluyentes** — no se les da el mismo nivel de confianza que al hallazgo de masa/tipo de Hubble
(n=163). `age_proxy_ssfr` con n=126 tiene una base bastante más sólida, comparable en tamaño a la
muestra principal, aunque sigue siendo menor a los 163.

## Chequeo de consistencia entre fuentes de metalicidad (antes de confiar en ellas)

Para las 11 galaxias con datos de Moustakas *y* Pilyugin, se compara cada calibración de
Moustakas contra Pilyugin — orden relativo entre galaxias vs. diferencia absoluta de escala:

**Pilyugin vs. KK04 (n=11):** correlación muy fuerte en el orden relativo (Spearman ρ=0.991,
p<0.0001; Pearson r=0.982, p<0.0001), pero con un **desplazamiento sistemático grande**: KK04 da,
en promedio, **0.47 dex más alto** que Pilyugin (media de la diferencia = −0.471, desvío = 0.061
— muy consistente, no es ruido). Es un efecto de calibración conocido en la literatura: distintas
calibraciones de líneas fuertes tienen puntos cero (zero-points) sistemáticamente distintos entre
sí.

**Pilyugin vs. PT05 (n=11):** también fuerte pero algo menos extremo (Spearman ρ=0.782, p=0.0045;
Pearson r=0.913, p=0.0001), con un desplazamiento mucho menor (media = +0.123 dex, desvío = 0.109
— más disperso que el caso KK04). PT05 y la calibración propia de Pilyugin comparten más
metodología entre sí que con KK04, consistente con el menor desplazamiento observado.

**Conclusión de este chequeo:** las tres fuentes **ordenan las galaxias de forma consistente**
(alta correlación de rangos) pero **no comparten una escala absoluta común** — confirma que la
decisión de no promediarlas ni elegir "la mejor" fue la correcta. Cualquier análisis debe
declarar explícitamente qué calibración usa.

## Correlaciones con f_DM

Todas vía `/correlations`, Spearman crudo y Spearman parcial controlando por masa (mismo método
validado en `2026-08-22_hubble_mass_dm_v1.md` y verificado invariante a escala en
`v2_log_control_check.md`).

| x | n | Spearman crudo | Spearman parcial (control: masa) |
|---|---|---|---|
| `metallicity_kk04` | 14 | ρ=−0.121, p=0.681 | ρ=+0.019, p=0.950 |
| `metallicity_pt05` | 14 | ρ=+0.024, p=0.935 | ρ=+0.232, p=0.445 |
| `metallicity_pilyugin2014` | 19 | ρ=+0.170, p=0.486 | ρ=+0.031, p=0.902 |
| `age_proxy_ssfr` | 126 | ρ=−0.014, p=0.877 | ρ=−0.169, **p=0.060** |

**Ninguna correlación de metalicidad con f_DM es estadísticamente significativa**, cruda o
parcial, con n=14–19. Con una muestra tan chica esto no es evidencia de ausencia de relación —
es, sencillamente, una muestra insuficiente para detectar nada salvo un efecto muy grande. No se
reporta esto como "no hay correlación entre metalicidad y materia oscura"; se reporta como "esta
muestra de 14-19 galaxias no permite decir nada con confianza al respecto".

`age_proxy_ssfr` (n=126) da un resultado **marginal**: la correlación parcial controlando por
masa (ρ=−0.169) queda en p=0.060 — apenas por encima del umbral convencional de 0.05. Es
sugestivo (a masa fija, galaxias con sSFR más bajo tienden levemente a tener más f_DM, en la
misma dirección que el hallazgo de tipo de Hubble en v1) pero **no cruza el umbral de
significancia** y no se presenta como un hallazgo confirmado.

## Qué NO establece este documento

- No hay evidencia suficiente (ni a favor ni en contra) de una relación entre metalicidad
  gaseosa y f_DM en esta muestra — la n es demasiado chica.
- El resultado marginal de sSFR (p=0.060) es sugestivo, no concluyente; requeriría una muestra
  mayor o un análisis más cuidadoso (ej. controlar también por tipo morfológico) para evaluarse
  con seriedad.
- Nada de esto reemplaza la necesidad de una edad estelar real de síntesis de poblaciones
  (`age_gyr`, todavía sin dato) para responder la pregunta original del proyecto en sentido
  estricto — `age_proxy_ssfr` es explícitamente un proxy, no un sustituto.

## Reproducibilidad

```bash
curl "http://localhost:8000/correlations?x=metallicity_kk04&y=dm_fraction&control_for=mass"
curl "http://localhost:8000/correlations?x=metallicity_pt05&y=dm_fraction&control_for=mass"
curl "http://localhost:8000/correlations?x=metallicity_pilyugin2014&y=dm_fraction&control_for=mass"
curl "http://localhost:8000/correlations?x=age_proxy_ssfr&y=dm_fraction&control_for=mass"
```

El chequeo de consistencia entre fuentes (tabla Pilyugin vs. KK04/PT05) se recalcula consultando
`data/processed/galaxies.sqlite` directamente; no está expuesto como endpoint de la API porque es
un chequeo de calidad de datos, no una variable de análisis.
