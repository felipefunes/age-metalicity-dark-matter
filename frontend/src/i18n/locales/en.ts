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
};
