# Changelog

Registro de cambios metodológicos y de datos. No es un changelog de features de software en
general (para eso está el historial de git) — es específicamente el lugar donde queda auditado
cualquier cambio que pueda afectar la interpretación de un hallazgo ya documentado en
`docs/findings/`.

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
