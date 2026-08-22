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

export const AXIS_LABELS: Record<string, string> = {
  metallicity: "Metalicidad",
  age_gyr: "Edad estelar (Gyr)",
  dm_fraction: "Fracción de materia oscura (f_DM)",
  mass: "Masa L[3.6] (10⁹ L☉)",
  mhi: "Masa de HI (10⁹ M☉)",
  hubble_type: "Tipo de Hubble (T)",
};

export const AXIS_UNITS: Record<string, string> = {
  metallicity: "",
  age_gyr: "Gyr",
  dm_fraction: "",
  mass: "10⁹ L☉ (log)",
  mhi: "10⁹ M☉ (log)",
  hubble_type: "",
};
