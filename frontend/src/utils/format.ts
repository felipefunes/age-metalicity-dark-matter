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
 * selectors offer -- also used to validate x/y read back from the URL.
 * Deliberately excludes the generic HyperLeda "metallicity"/"age_gyr"
 * columns, which the pipeline has never populated (see ScatterAxis). */
export const SCATTER_AXIS_OPTIONS: ScatterAxis[] = [
  "metallicity_kk04",
  "metallicity_pt05",
  "metallicity_pilyugin2014",
  "age_proxy_ssfr",
  "age_proxy_dn4000",
  "age_proxy_hdelta_a",
  "dm_fraction",
  "mass",
  "mhi",
];
