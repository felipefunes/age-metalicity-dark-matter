# v2 — Verificación metodológica: escala de la variable de control en la correlación parcial

**Referencia:** este documento revisa el método usado en
[`2026-08-22_hubble_mass_dm_v1.md`](2026-08-22_hubble_mass_dm_v1.md) (hallazgo original:
tipo de Hubble y masa casi totalmente confundidos; T–f_DM se invierte al controlar por masa).
No lo modifica ni lo reemplaza.

## Motivo de la revisión

Se planteó la duda de si `partial_spearman()` (`api/stats.py`) usa `L[3.6]` en escala lineal
como variable de control, lo cual sería problemático porque la masa abarca ~5 órdenes de
magnitud en esta muestra: una regresión lineal sobre valores crudos le daría peso
desproporcionado a los pocos puntos de masa muy alta, controlando mal para el grueso de la
muestra (galaxias de baja masa) y potencialmente inflando o invirtiendo el signo reportado.

## Resultado de la verificación: **el problema no aplica a esta función**

`partial_spearman(x, y, z)` no regresiona sobre `x`, `y`, `z` en su escala original — primero
convierte los tres a **rangos** (`scipy.stats.rankdata`) y recién sobre esos rangos hace la
regresión lineal de residualización. El rango de un valor es invariante ante cualquier
transformación estrictamente monótona creciente aplicada *antes* de rankear: si
`A > B` en la escala cruda, también `log10(A) > log10(B)` (para valores positivos, como es el
caso de `L[3.6]`), así que `rankdata(z) == rankdata(log10(z))` exactamente. El problema descrito
—pocos puntos extremos dominando un ajuste lineal— es real y grave para una correlación parcial
de **Pearson** sobre valores crudos (que este proyecto no usa), pero no puede ocurrir en un
método que ya trabaja sobre rangos.

### Prueba empírica (no solo el argumento teórico)

Corrida sobre las 163 galaxias reales, controlando T–f_DM por masa, comparando masa cruda vs
`log10(masa)` como variable de control:

```
control = L[3.6] crudo    : rho = -0.23972444429427478   p = 0.002122765694913653
control = log10(L[3.6])   : rho = -0.23972444429427478   p = 0.002122765694913653
rankdata(L[3.6]) == rankdata(log10(L[3.6]))  ->  True
diferencia en rho: 0.0        diferencia en p: 0.0
```

Resultado idéntico bit a bit. No hay una tabla de "antes/después" que mostrar porque no hay
"después" distinto de "antes" — por eso este documento reemplaza esa comparación por la prueba
de arriba.

Esta invariancia queda además fijada en código como test de regresión:
[`tests/test_stats.py::test_partial_spearman_invariant_to_monotonic_control_rescaling`](../../tests/test_stats.py),
para que un futuro refactor que reintroduzca una regresión sobre valores crudos (rompiendo la
invariancia) haga fallar la suite automáticamente en vez de degradar el resultado en silencio.

## ¿Se sostiene la conclusión del hallazgo original?

**Sí, sin cambios.** Los números de
[`2026-08-22_hubble_mass_dm_v1.md`](2026-08-22_hubble_mass_dm_v1.md) (T vs f_DM: crudo
ρ=+0.088 p=0.266 → parcial ρ=−0.240 p=0.002; MHI vs f_DM: crudo ρ=−0.088 p=0.264 → parcial
ρ=+0.257 p<0.001) son correctos tal como estaban. Esta revisión es una verificación, no una
corrección.

## Qué queda fuera de este documento

No se implementó una correlación parcial de **Pearson** (sí sensible a la escala de la
variable de control) como método alternativo — se evaluó y se descartó por ahora, porque no
había necesidad de mostrar un efecto que el método actual no tiene. Si en el futuro se quiere
comparar explícitamente contra un método sensible a escala, es un método genuinamente distinto
(no un parámetro de escala sobre el mismo Spearman) y queda como trabajo futuro.
