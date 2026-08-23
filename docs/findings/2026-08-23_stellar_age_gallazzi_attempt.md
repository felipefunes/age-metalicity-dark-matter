# Intento de edad estelar real vía Gallazzi et al. 2005 — no integrado

**Estado:** intento documentado, **no integrado al pipeline**. No reemplaza ni afecta ningún
hallazgo anterior — es el registro de por qué esta vía específica no se usó, para que no se
vuelva a intentar sin saber por qué falló la primera vez.

## Qué se intentó

Gallazzi, Charlot, Brinchmann, White & Tremonti 2005, "The ages and metallicities of galaxies in
the local universe", MNRAS, 362, 41 — el catálogo de edades estelares vía síntesis de
poblaciones más establecido para SDSS (175 128 galaxias en su versión original DR2, hasta
567 486 en la versión DR4 usada acá), derivado ajustando la fuerza de 5 índices espectrales de
absorción contra una librería Monte Carlo de 150 000 historias de formación estelar basadas en
modelos de Bruzual & Charlot (2003).

No está en VizieR — se descarga directo del sitio del grupo MPA-Garching
(`wwwmpa.mpa-garching.mpg.de/SDSS/DR4/Data/Gallazzi/`), identificado por `plate`/`MJD`/`fiber` de
SDSS, no por nombre ni coordenadas.

## Metodología del intento

1. **¿Tienen las galaxias SPARC siquiera un espectro de SDSS?** Se consultó por posición
   (`astroquery.sdss`, radio 5″, reusando las coordenadas ya resueltas de cada galaxia SPARC —
   sin re-resolver identidad) para las 163 galaxias. Resultado real: **43/163 tienen un espectro
   SDSS dentro de 5″, 0 errores** en la corrida completa. Mejor cobertura de la esperada — el
   problema, como se ve abajo, no es la falta de espectros.
2. **¿Están esos 43 en el catálogo de Gallazzi (DR4, ~2006)?** Se descargaron y parsearon los
   archivos reales (`all_stat_age.dat.gz`, `all_stat_z_log.dat.gz`, formato Fortran
   `plate/MJD/fiber` + 5 percentiles + media de log(edad/años) o log(Z), `-99` como sentinel de
   "sin dato"). Solo **18/43** aparecen en el archivo. La mayoría de los que faltan tienen MJD
   posterior a 2012 (era SDSS-III/BOSS) — espectros tomados **después** de que ese catálogo
   específico se armara, no galaxias sin observar.
3. **De esos 18, ¿cuántos pasan el corte de calidad del propio catálogo?** 5 tienen `-99`
   (ajuste no confiable). **n final = 13** con edad y metalicidad estelar válidas.

## Resultado: no se integra

n=13 queda muy por debajo del umbral de 30 fijado para este proyecto. A diferencia del caso de
Moustakas/Pilyugin (n=22, sí integrado, ver
[`2026-08-22_metallicity_age_proxy_v1.md`](2026-08-22_metallicity_age_proxy_v1.md)), acá la razón
del n bajo no es una limitación de cobertura del cielo o de selección de muestra — es que el
catálogo específico usado quedó desactualizado respecto a los espectros más recientes de la
misma muestra. Se evaluó brevemente si MPA-Garching publicó una versión más nueva (existe una
página DR7/"MPA-JHU", pero solo republica masa estelar, no queda claro si incluye edades de
Gallazzi con esa base más amplia, y de todos modos DR7 es de ~2009 — tampoco cubriría los
espectros post-2012).

**Decisión:** no integrar esta vía al pipeline. En su lugar, se midió Dn4000 y Hδ_A directamente
sobre los 43 espectros ya identificados — ver
[`2026-08-23_dn4000_hdelta_a.md`](2026-08-23_dn4000_hdelta_a.md), que sí llega a **n=41**
sorteando exactamente este problema (no depende de que un tercero haya procesado el espectro).

## Reproducibilidad

Los archivos de Gallazzi descargados y el cruce de posiciones no quedaron como parte del
pipeline (no hay código de producción para esta vía abandonada). El análisis de este documento
fue ad-hoc, sobre los mismos 43 matches de `pipeline/external/sdss_indices.py`
(`data/raw/external/sdss_spectrum_matches.json`).
