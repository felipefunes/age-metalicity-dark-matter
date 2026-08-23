import type { Dictionary } from "../dictionary";

export const en: Dictionary = {
  common: {
    loading: "Loading…",
    close: "Close",
    error: "Error",
    siteTitle: "Dark Matter, Metallicity, and Galactic Age",
  },
  axis: {
    metallicity_kk04: {
      label: "Metallicity KK04 (Moustakas+2010)",
      source: "Moustakas et al. 2010",
    },
    metallicity_pt05: {
      label: "Metallicity PT05 (Moustakas+2010)",
      source: "Moustakas et al. 2010",
    },
    metallicity_pilyugin2014: {
      label: "Metallicity (Pilyugin+2014)",
      source: "Pilyugin, Grebel & Kniazev 2014",
    },
    age_proxy_ssfr: {
      label: "Age proxy: log₁₀ sSFR (z0MGS)",
      source: "z0MGS (Leroy et al. 2019)",
    },
    age_proxy_dn4000: {
      label: "Dn4000 (age proxy, SDSS spectrum)",
      source: "SDSS spectra (Balogh et al. 1999)",
    },
    age_proxy_hdelta_a: {
      label: "Hδ_A (age proxy, SDSS spectrum)",
      source: "SDSS spectra (Worthey & Ottaviani 1997)",
    },
    dm_fraction: {
      label: "Dark matter fraction (f_DM)",
      source: null,
    },
    mass: {
      label: "Mass L[3.6] (10⁹ L☉)",
      source: null,
    },
    mhi: {
      label: "HI mass (10⁹ M☉)",
      source: null,
    },
    hubble_type: {
      label: "Hubble type (T)",
      source: null,
    },
  },
  matchMethod: {
    name_match: "By name (Simbad)",
    coordinate_match: "By coordinates (NED + Simbad)",
  },
  detail: {
    ra: "Right ascension (RA)",
    dec: "Declination (Dec)",
    distance: "Distance",
    outerRadius: "Modeled outer radius",
    vobsOuter: "Vobs (outer radius)",
    vbarOuter: "Vbar (outer radius)",
    clipped: "(clipped)",
    qualityFlag: "Quality flag (SPARC)",
    noData: "no data",
    lickResolutionNote: "Lick resolution",
    closeAriaLabel: "Close detail panel",
    hiiRegionsSuffix: (n) => `(${n} HII regions)`,
    pxSuffix: (n) => `(${n} px)`,
  },
  filter: {
    axesTitle: "Scatter axes",
    xAxisLabel: "X axis",
    yAxisLabel: "Y axis",
    axesHint: "Choose which variables to compare in the scatter plot above.",
    massTitlePrefix: "Mass",
    massHint: "Restrict the stellar-mass range (L[3.6]) to compare galaxies of similar size.",
    massAriaLabelMin: "Minimum mass",
    massAriaLabelMax: "Maximum mass",
    qualityTitle: "Quality",
    excludeLowQuality: "Exclude low quality_flag (Q=3)",
    qualityHint: "SPARC flags Q=3 rotation curves as the least reliable; you can exclude them.",
    matchMethodTitle: "Identity cross-match method",
    matchMethodHint:
      "How each galaxy was identified in external catalogs: by name, or by coordinates if that fails.",
    ageTitle: "Stellar age",
    requireAge: "Only galaxies with a strict stellar age available",
    ageHint: "Limits to galaxies with a direct stellar-age measurement (not a proxy), when available.",
    resetButton: "Reset filters",
    mobileToggle: "Filters",
  },
  chart: {
    controlForMass: "Control correlation for mass",
    errorPrefix: "Error loading data",
    spearman: "Spearman",
    spearmanPartialMass: "Partial Spearman (control: mass)",
    sourcePrefix: "Source:",
    nPlotted: (n) => `n = ${n} galaxies plotted`,
    scatterEmptyState: (xLabel, yLabel) =>
      `No galaxies have data for both ${xLabel} and ${yLabel} under the current filters.`,
    scatterHint: "Hover a point for details, click it to open the galaxy's full record. Drag to zoom.",
    scatterLogSuffix: " (log scale)",
    hoverCrossLabel: "cross-match:",
    hubbleTitle: "f_DM by Hubble type (morphological age proxy)",
    hubbleEmptyState: "No galaxies have both T and f_DM available under the current filters.",
    hubbleHint:
      "Each box summarizes the dark matter fraction of galaxies of that morphological type; the points are individual, clickable galaxies.",
    hubbleSourceSuffix: "— T is discrete/ordinal, grouped by type",
  },
  nav: {
    brand: "Dark Matter",
    dataLink: "Data",
    sourcesLink: "Sources",
    languageLabel: "Language",
  },
  hero: {
    intro1Before: "This tool cross-matches public galaxy kinematics data (",
    intro1After:
      ") with metallicity and stellar age from external catalogs (HyperLeda, NED), resolved to a canonical PGC identifier per galaxy.",
    intro2Before:
      "The goal is to explore whether a galaxy's dark matter fraction correlates with its metallicity or age, ",
    intro2Bold: "controlling for mass",
    intro2After:
      " — because a raw correlation between metallicity and dark matter can be spurious if both depend on the galaxy's mass.",
    disclaimer: "This is an exploratory tool, not a source of peer-reviewed, validated conclusions.",
  },
  section: {
    datosTitle: "Explore the data",
    fuentesTitle: "Data sources",
  },
  sources: {
    sparc: "kinematics, Hubble type, [3.6μm] luminosity, HI mass.",
    hyperleda: "per-object extragalactic parameters (metallicity/age when available).",
    nedSimbad: "identity resolution to PGC (by name, or by coordinates if that fails).",
    moustakas: "metallicity (two calibrations, KK04 and PT05).",
    pilyugin: "metallicity, independent source.",
    z0mgs: "age proxy via sSFR, not a strict stellar age.",
    dn4000Hdelta:
      "Dn4000 and Hδ_A measured directly from SDSS spectra (not a pre-computed catalog), following Kauffmann et al. (2003, MNRAS, 341, 33 and 54).",
    andConnector: "and",
  },
  footer: {
    openSourceText: "This is an open-source project on",
    licenseNote: "Code licensed under MIT.",
  },
};
