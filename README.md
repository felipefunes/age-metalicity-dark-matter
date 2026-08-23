# Materia Oscura, Metalicidad y Edad Galáctica

¿Las galaxias más viejas o evolucionadas tienen más materia oscura que las jóvenes? Este
proyecto busca responder esa pregunta con datos públicos reales — y muestra tanto lo que
encontramos como los límites de lo que estos datos pueden realmente decirnos.

Para eso cruza datos públicos de cinemática galáctica ([SPARC](http://astroweb.case.edu/SPARC/))
con metalicidad y edad estelar de catálogos externos (HyperLeda, NED, Moustakas+2010,
Pilyugin+2014, z0MGS, espectros de SDSS), resolviendo cada galaxia a un identificador canónico
**PGC** — nunca por coincidencia de nombre.

**No es una fuente con conclusiones validadas por revisión de pares.**

## Mapa de confiabilidad

No todas las variables tienen el mismo respaldo. Esta tabla resume qué tan confiable es cada
pieza antes de mirar cualquier gráfico:

| Variable | Qué mide | Cobertura | Qué tan confiable |
|---|---|---|---|
| Tipo de Hubble (morfología) | proxy grosero de "estadio evolutivo" | 163/163 galaxias | Alta — muestra completa |
| sSFR (z0MGS) | proxy de formación estelar reciente | 126/163 | Alta cobertura, resultado: sin correlación detectada |
| Dn4000 / Hδ_A | edad estelar medida directo del espectro | 41/163 | Media — muestra chica, validado contra catálogos oficiales |
| Metalicidad (Moustakas/Pilyugin) | composición química medida | 22/163 | Baja — muestra chica, resultados preliminares |

¿Por qué cuatro variables distintas de edad/composición en vez de una sola? Cada una viene de una
fuente y un método distintos, con su propia cobertura — ninguna cubre toda la muestra. Se
documentan todas por transparencia, no para confundir: cada hallazgo declara explícitamente qué
variable usa y por qué.

## Qué encontramos

- **El hallazgo más sólido**: en esta muestra, la masa de una galaxia "esconde" la relación entre
  su tipo morfológico y cuánta materia oscura tiene. Al controlar por masa aparece una
  correlación real y significativa — el resultado se invierte respecto a lo que sugiere el dato
  crudo (ver fila "Tipo de Hubble" arriba).
- Con metalicidad y con los proxies de edad medidos hasta ahora, no encontramos una correlación
  clara con materia oscura. Puede ser que no exista, o que la muestra sea chica para detectarla —
  ambos resultados quedan documentados igual, sin forzar una conclusión.

## Más

- **Probalo en vivo**: https://age-metalicity-dark-matter-frontend.onrender.com
- **Hallazgos completos**, con metodología, validación y las limitaciones de cada uno:
  [`docs/findings/`](docs/findings/) (índice y resumen en [`docs/TECHNICAL.md`](docs/TECHNICAL.md))
- **Documentación técnica** (stack, esquema de base de datos, cómo correr el pipeline, Docker,
  despliegue, CI, tests, fuentes y crédito completo): [`docs/TECHNICAL.md`](docs/TECHNICAL.md)
