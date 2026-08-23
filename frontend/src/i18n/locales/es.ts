import type { Dictionary } from "../dictionary";

export const es: Dictionary = {
  common: {
    loading: "Cargando…",
    close: "Cerrar",
    error: "Error",
    siteTitle: "Materia Oscura, Metalicidad y Edad Galáctica",
  },
  axis: {
    metallicity_kk04: {
      label: "Metalicidad KK04 (Moustakas+2010)",
      source: "Moustakas et al. 2010",
    },
    metallicity_pt05: {
      label: "Metalicidad PT05 (Moustakas+2010)",
      source: "Moustakas et al. 2010",
    },
    metallicity_pilyugin2014: {
      label: "Metalicidad (Pilyugin+2014)",
      source: "Pilyugin, Grebel & Kniazev 2014",
    },
    age_proxy_ssfr: {
      label: "Proxy de edad: log₁₀ sSFR (z0MGS)",
      source: "z0MGS (Leroy et al. 2019)",
    },
    age_proxy_dn4000: {
      label: "Dn4000 (proxy de edad, espectro SDSS)",
      source: "espectros SDSS (Balogh et al. 1999)",
    },
    age_proxy_hdelta_a: {
      label: "Hδ_A (proxy de edad, espectro SDSS)",
      source: "espectros SDSS (Worthey & Ottaviani 1997)",
    },
    dm_fraction: {
      label: "Fracción de materia oscura (f_DM)",
      source: null,
    },
    mass: {
      label: "Masa L[3.6] (10⁹ L☉)",
      source: null,
    },
    mhi: {
      label: "Masa de HI (10⁹ M☉)",
      source: null,
    },
    hubble_type: {
      label: "Tipo de Hubble (T)",
      source: null,
    },
  },
  matchMethod: {
    name_match: "Por nombre (Simbad)",
    coordinate_match: "Por coordenadas (NED + Simbad)",
  },
  detail: {
    ra: "Ascensión recta (RA)",
    dec: "Declinación (Dec)",
    distance: "Distancia",
    outerRadius: "Radio externo modelado",
    vobsOuter: "Vobs (radio externo)",
    vbarOuter: "Vbar (radio externo)",
    clipped: "(recortado)",
    qualityFlag: "Indicador de calidad (SPARC)",
    noData: "sin dato",
    lickResolutionNote: "resolución Lick",
    closeAriaLabel: "Cerrar panel de detalle",
    hiiRegionsSuffix: (n) => `(${n} regiones HII)`,
    pxSuffix: (n) => `(${n} px)`,
  },
  filter: {
    axesTitle: "Ejes del scatter",
    xAxisLabel: "Eje X",
    yAxisLabel: "Eje Y",
    axesHint: "Elegí qué variables comparar en el gráfico de dispersión de arriba.",
    massTitlePrefix: "Masa",
    massHint: "Restringí el rango de masa estelar (L[3.6]) para comparar galaxias de tamaño similar.",
    massAriaLabelMin: "Masa mínima",
    massAriaLabelMax: "Masa máxima",
    qualityTitle: "Calidad",
    excludeLowQuality: "Excluir quality_flag bajo (Q=3)",
    qualityHint: "SPARC marca con Q=3 las curvas de rotación menos confiables; podés excluirlas.",
    matchMethodTitle: "Método de cruce de identidad",
    matchMethodHint:
      "Cómo se identificó cada galaxia en catálogos externos: por nombre o, si eso falla, por coordenadas.",
    ageTitle: "Edad estelar",
    requireAge: "Solo galaxias con edad estelar estricta disponible",
    ageHint: "Limita a galaxias con una medición de edad estelar directa (no un proxy), cuando esté disponible.",
    resetButton: "Restablecer filtros",
    mobileToggle: "Filtros",
  },
  chart: {
    controlForMass: "Controlar correlación por masa",
    errorPrefix: "Error cargando datos",
    spearman: "Spearman",
    spearmanPartialMass: "Spearman parcial (control: masa)",
    sourcePrefix: "Fuente:",
    nPlotted: (n) => `n = ${n} galaxias graficadas`,
    scatterEmptyState: (xLabel, yLabel) =>
      `No hay galaxias con datos disponibles para ${xLabel} y ${yLabel} con los filtros actuales.`,
    scatterHint:
      "Pasá el mouse sobre un punto para ver detalles, hacé clic para abrir la ficha completa de la galaxia. Arrastrá para hacer zoom.",
    scatterLogSuffix: " (escala log)",
    hoverCrossLabel: "cruce:",
    hubbleTitle: "f_DM por tipo de Hubble (proxy morfológico de edad)",
    hubbleEmptyState: "No hay galaxias con T y f_DM disponibles con los filtros actuales.",
    hubbleHint:
      "Cada caja resume la fracción de materia oscura de las galaxias de ese tipo morfológico; los puntos son galaxias individuales, cliqueables.",
    hubbleSourceSuffix: "— T discreto/ordinal, agrupado por tipo",
  },
  nav: {
    brand: "Materia Oscura",
    dataLink: "Datos",
    sourcesLink: "Fuentes",
    languageLabel: "Idioma",
  },
  hero: {
    intro1Before: "Esta herramienta cruza datos públicos de cinemática galáctica (",
    intro1After:
      ") con metalicidad y edad estelar de catálogos externos (HyperLeda, NED), resueltos a un identificador canónico PGC por galaxia.",
    intro2Before:
      "El objetivo es explorar si existe correlación entre la fracción de materia oscura de una galaxia y su metalicidad o edad, ",
    intro2Bold: "controlando por masa",
    intro2After:
      " — porque una correlación cruda entre metalicidad y materia oscura puede ser espuria si ambas dependen de la masa de la galaxia.",
    disclaimer: "Es una herramienta exploratoria, no una fuente con conclusiones validadas por revisión de pares.",
  },
  section: {
    datosTitle: "Explorá los datos",
    fuentesTitle: "Fuentes de datos",
  },
  sources: {
    sparc: "cinemática, tipo de Hubble, luminosidad [3.6μm], masa de HI.",
    hyperleda: "parámetros extragalácticos por objeto (metalicidad/edad cuando están disponibles).",
    nedSimbad: "resolución de identidad a PGC (por nombre o, si falla, por coordenadas).",
    moustakas: "metalicidad (dos calibraciones, KK04 y PT05).",
    pilyugin: "metalicidad, fuente independiente.",
    z0mgs: "proxy de edad vía sSFR, no una edad estelar en sentido estricto.",
    dn4000Hdelta:
      "Dn4000 y Hδ_A medidos directamente sobre espectros de SDSS (no un catálogo pre-calculado), método de Kauffmann et al. (2003, MNRAS, 341, 33 y 54).",
    andConnector: "y",
  },
  footer: {
    openSourceText: "Este es un proyecto de código abierto en",
    licenseNote: "Código bajo licencia MIT.",
  },
};
