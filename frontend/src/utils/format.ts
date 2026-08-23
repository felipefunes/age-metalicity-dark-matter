// Hubble type codes per the SPARC main table's Note (1):
// 0=S0, 1=Sa, 2=Sab, 3=Sb, 4=Sbc, 5=Sc, 6=Scd, 7=Sd, 8=Sdm, 9=Sm, 10=Im, 11=BCD
export const HUBBLE_TYPE_LABELS: Record<number, string> = {
  0: "S0",
  1: "Sa",
  2: "Sab",
  3: "Sb",
  4: "Sbc",
  5: "Sc",
  6: "Scd",
  7: "Sd",
  8: "Sdm",
  9: "Sm",
  10: "Im",
  11: "BCD",
};

export function hubbleTypeLabel(t: number | null): string {
  if (t === null) return "?";
  return HUBBLE_TYPE_LABELS[t] ?? String(t);
}

export function hubbleEarlyMidLate(t: number | null): "temprano" | "intermedio" | "tardío" | "?" {
  if (t === null) return "?";
  if (t <= 2) return "temprano";
  if (t <= 5) return "intermedio";
  return "tardío";
}

export function formatNumber(value: number | null, digits = 3): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function formatPValue(p: number | null): string {
  if (p === null || Number.isNaN(p)) return "—";
  if (p < 0.001) return "p < 0.001";
  return `p = ${p.toFixed(3)}`;
}

import type { ScatterAxis } from "../types";

/** Single source of truth for which variables the scatter's axis
 * selectors offer -- also used to validate x/y read back from the URL. */
export const SCATTER_AXIS_OPTIONS: ScatterAxis[] = [
  "metallicity",
  "metallicity_kk04",
  "metallicity_pt05",
  "metallicity_pilyugin2014",
  "age_gyr",
  "age_proxy_ssfr",
  "dm_fraction",
  "mass",
  "mhi",
];

export const AXIS_LABELS: Record<string, string> = {
  metallicity: "Metalicidad",
  metallicity_kk04: "Metalicidad KK04 (Moustakas+2010)",
  metallicity_pt05: "Metalicidad PT05 (Moustakas+2010)",
  metallicity_pilyugin2014: "Metalicidad (Pilyugin+2014)",
  age_gyr: "Edad estelar (Gyr)",
  age_proxy_ssfr: "Proxy de edad: log₁₀ sSFR (z0MGS)",
  dm_fraction: "Fracción de materia oscura (f_DM)",
  mass: "Masa L[3.6] (10⁹ L☉)",
  mhi: "Masa de HI (10⁹ M☉)",
  hubble_type: "Tipo de Hubble (T)",
};

/** Which external source (beyond SPARC, always credited) a given axis's
 * data comes from -- used to build an accurate "Fuente:" footer per chart
 * instead of a hardcoded guess. null = SPARC-only (no external source). */
export const AXIS_SOURCE: Record<string, string | null> = {
  metallicity: "HyperLeda",
  metallicity_kk04: "Moustakas et al. 2010",
  metallicity_pt05: "Moustakas et al. 2010",
  metallicity_pilyugin2014: "Pilyugin, Grebel & Kniazev 2014",
  age_gyr: "HyperLeda",
  age_proxy_ssfr: "z0MGS (Leroy et al. 2019)",
  dm_fraction: null,
  mass: null,
  mhi: null,
  hubble_type: null,
};

export const AXIS_UNITS: Record<string, string> = {
  metallicity: "",
  metallicity_kk04: "12+log(O/H)",
  metallicity_pt05: "12+log(O/H)",
  metallicity_pilyugin2014: "12+log(O/H)",
  age_gyr: "Gyr",
  age_proxy_ssfr: "dex, log(yr⁻¹)",
  dm_fraction: "",
  mass: "10⁹ L☉ (log)",
  mhi: "10⁹ M☉ (log)",
  hubble_type: "",
};
