# Hallazgos preliminares — materia oscura, masa y tipo de Hubble

**Estado:** exploratorio, parcial, no revisado por pares. Generado a partir de la corrida
completa del pipeline (2026-08-22) sobre las 163 galaxias SPARC resueltas a PGC. **No incluye
metalicidad ni edad estelar en sentido estricto**, porque HyperLeda no expone esos campos para
ninguna de las 163 galaxias (ver `README.md` § "Estado real de los datos" y
`data/processed/coverage_report.json`). Este documento cubre lo que sí se puede analizar hoy:
masa, tipo de Hubble (T, como proxy morfológico) y fracción de materia oscura (f_DM).

Todos los números son reproducibles vía el endpoint `/correlations` de la API sobre
`data/processed/galaxies.sqlite`, o recalculables con el script en la sección
[Reproducibilidad](#reproducibilidad).

## Resumen en una línea

**La masa de la galaxia es un factor de confusión (*confounder*) casi total del tipo de Hubble
en esta muestra: si no se controla por masa, la relación entre tipo morfológico y fracción de
materia oscura queda oculta o directamente invertida.**

## 1. Por qué "tipo de Hubble y masa están casi totalmente confundidos" — explicado simple

**En criollo:** en esta muestra de SPARC, casi todas las galaxias de tipo morfológico "tardío"
(irregulares, enanas — código T alto) resultan ser también galaxias de **poca masa**. Y casi
todas las de tipo "temprano" (espirales grandes — código T bajo) resultan ser de **mucha masa**.
No es que el tipo morfológico y la masa sean la misma variable, pero en esta muestra particular
van pegadas: conocer una te dice casi todo sobre la otra.

Los números: mediana de masa L[3.6] por bin de tipo morfológico:

| Bin (T) | n | Mediana de masa (10⁹ L☉) |
|---|---|---|
| Temprano (T 0–2: S0, Sa, Sab) | 16 | 107.5 |
| Intermedio (T 3–5: Sb, Sbc, Sc) | 43 | 95.3 |
| Tardío (T 6–11: Scd…BCD) | 104 | **1.35** |

Las galaxias tardías tienen, en mediana, **~70–80 veces menos masa** que las tempranas/intermedias.
Formalmente, la correlación de Spearman entre T y masa es **ρ = −0.87** (sobre una escala de −1 a
+1, donde ±1 es "van pegadas perfectamente"): eso es casi tan fuerte como puede ser una
correlación con datos reales.

**Por qué esto importa — la analogía:** es como preguntarse "¿los chicos que usan mochila sacan
peor nota que los que usan bolso?", sin darse cuenta de que casi todos los que usan mochila son
de primaria y casi todos los que usan bolso son de secundaria. Cualquier diferencia de notas que
midas "en crudo" entre mochila y bolso en realidad está midiendo, casi por completo, la
diferencia entre primaria y secundaria — no el efecto de la mochila en sí. Para saber si la
mochila importa *de verdad*, hay que comparar mochila-vs-bolso **dentro del mismo grado escolar**
(eso es "controlar por edad/grado"). Acá, "controlar por masa" es exactamente esa comparación:
mirar el efecto del tipo morfológico entre galaxias de **masa parecida**, no entre toda la
muestra mezclada.

## 2. El resultado concreto: la correlación cruda esconde (e invierte) el efecto real

| Par de variables | Spearman crudo | Spearman parcial (controlando por masa) |
|---|---|---|
| Tipo de Hubble (T) vs f_DM | ρ = +0.088, p = 0.266 (n.s.) | **ρ = −0.240, p = 0.002** |
| Masa de HI (MHI) vs f_DM | ρ = −0.088, p = 0.264 (n.s.) | **ρ = +0.257, p < 0.001** |
| Masa L[3.6] vs f_DM | **ρ = −0.236, p = 0.002** | — (es la variable de control) |

n = 163 en todos los casos.

**En criollo:**

- **T vs f_DM, crudo:** no hay relación aparente (p=0.27, no significativo). Pero esto es
  engañoso: dentro de esta muestra hay dos efectos tirando en sentidos opuestos que casi se
  cancelan — (a) las galaxias más masivas tienden a tener *menos* f_DM (punto siguiente), y (b)
  las galaxias tempranas tienden a ser más masivas. Como "temprano" y "masivo" van juntos, el
  efecto de masa (negativo) casi anula lo que sería el efecto genuino del tipo morfológico.
- **T vs f_DM, controlando por masa:** al comparar solo galaxias de masa parecida, aparece una
  relación real y estadísticamente significativa (p=0.002), y el signo es **negativo**: a
  igualdad de masa, los tipos morfológicos más tardíos (más irregulares/enanos) tienden a tener
  **menor** fracción de materia oscura que los tempranos — lo opuesto a lo que sugeriría (débilmente)
  el dato crudo.
- **MHI vs f_DM:** mismo patrón. Crudo no dice nada; controlando por masa aparece que, a igual
  masa estelar, **más gas neutro (HI) se asocia con más f_DM** — consistente con que el gas
  remanente es un trazador de qué tan evolucionada/dominada por materia oscura está una galaxia.
- **Masa vs f_DM (la variable de control en sí):** esta es la relación "de fondo" — galaxias más
  masivas tienen sistemáticamente menor fracción de materia oscura en el radio externo medido.
  Esto **coincide con resultados conocidos en la literatura** (la fracción bariónica crece con la
  masa), así que funciona como chequeo de sanidad de que el pipeline no está produciendo un
  artefacto.

## 3. Chequeos de robustez

- **Calidad de los datos (`quality_flag`):** excluir las mediciones de baja calidad (Q=3, n=9
  descartadas) **fortalece** la correlación masa–f_DM (ρ pasa de −0.236 a −0.281, p de 0.0024 a
  0.0004). Si el resultado fuera producto de ruido en mediciones dudosas, excluirlas debería
  debilitarlo o hacerlo desaparecer — pasa lo contrario, lo cual es tranquilizador.
- **Valores de f_DM recortados (`f_dm_clipped`):** solo 2/163 galaxias (`UGC04305`, `UGC06628`)
  tienen un f_DM crudo fuera de [0,1] antes del recorte a ese rango, y ambas tienen incertidumbre
  grande (e_f_DM = 0.19 y 0.45 respectivamente) — son puntos individuales ruidosos, no un sesgo
  sistemático del método.
- **Método de resolución de identidad:** las 9 galaxias resueltas por `coordinate_match` (las más
  difíciles de identificar, típicamente enanas de bajo brillo superficial) tienen mediana de masa
  mucho menor que las resueltas por `name_match` (1.54 vs 4.66 ×10⁹ L☉) y T mediano mayor (10 vs
  7) — consistente con lo esperado físicamente para ese subconjunto, no sugiere que el método de
  cruce introduzca un sesgo artificial en f_DM.

## 4. Lo que este documento *no* responde todavía

La pregunta original del proyecto —¿correlaciona la metalicidad o la edad estelar (en sentido
estricto) con la fracción de materia oscura, controlando por masa?— **sigue sin respuesta**: 0 de
163 galaxias tienen metalicidad o edad estelar desde HyperLeda (ver README). Todo lo de arriba usa
tipo de Hubble como proxy morfológico y masa de HI como variable adicional, no como sustituto de
la pregunta original. Conectar una fuente real de metalicidad/edad (con su propio cruce de
identidad justificado) queda como trabajo futuro explícitamente fuera del alcance actual.

## Reproducibilidad

Con la API corriendo (`uvicorn api.main:app` o `docker compose up`) contra
`data/processed/galaxies.sqlite`:

```bash
curl "http://localhost:8000/correlations?x=hubble_type&y=dm_fraction"
curl "http://localhost:8000/correlations?x=hubble_type&y=dm_fraction&control_for=mass"
curl "http://localhost:8000/correlations?x=mhi&y=dm_fraction&control_for=mass"
curl "http://localhost:8000/correlations?x=mass&y=dm_fraction"
```

Los mismos números también son visibles interactivamente en el frontend: seleccioná los ejes
correspondientes en el scatter, o activá "Controlar correlación por masa" en el gráfico de tipo
de Hubble.
