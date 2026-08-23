import type { Dictionary } from "../dictionary";

export const pt: Dictionary = {
  common: {
    loading: "Carregando…",
    close: "Fechar",
    error: "Erro",
    siteTitle: "Matéria Escura, Metalicidade e Idade Galáctica",
  },
  axis: {
    metallicity_kk04: {
      label: "Metalicidade KK04 (Moustakas+2010)",
      source: "Moustakas et al. 2010",
    },
    metallicity_pt05: {
      label: "Metalicidade PT05 (Moustakas+2010)",
      source: "Moustakas et al. 2010",
    },
    metallicity_pilyugin2014: {
      label: "Metalicidade (Pilyugin+2014)",
      source: "Pilyugin, Grebel & Kniazev 2014",
    },
    age_proxy_ssfr: {
      label: "Proxy de idade: log₁₀ sSFR (z0MGS)",
      source: "z0MGS (Leroy et al. 2019)",
    },
    age_proxy_dn4000: {
      label: "Dn4000 (proxy de idade, espectro SDSS)",
      source: "espectros SDSS (Balogh et al. 1999)",
    },
    age_proxy_hdelta_a: {
      label: "Hδ_A (proxy de idade, espectro SDSS)",
      source: "espectros SDSS (Worthey & Ottaviani 1997)",
    },
    dm_fraction: {
      label: "Fração de matéria escura (f_DM)",
      source: null,
    },
    mass: {
      label: "Massa L[3.6] (10⁹ L☉)",
      source: null,
    },
    mhi: {
      label: "Massa de HI (10⁹ M☉)",
      source: null,
    },
    hubble_type: {
      label: "Tipo de Hubble (T)",
      source: null,
    },
  },
};
