import type { GalaxySummary, ScatterAxis } from "../types";

export function axisValue(galaxy: GalaxySummary, axis: ScatterAxis): number | null {
  switch (axis) {
    case "metallicity":
      return galaxy.metallicity;
    case "age_gyr":
      return galaxy.age_gyr;
    case "dm_fraction":
      return galaxy.f_dm;
    case "mass":
      return galaxy.l36;
    case "mhi":
      return galaxy.mhi;
  }
}

export function axisError(galaxy: GalaxySummary, axis: ScatterAxis): number | null {
  // Only f_DM carries a propagated uncertainty in this dataset (from e_Vobs).
  return axis === "dm_fraction" ? galaxy.e_f_dm : null;
}

export function isLogAxis(axis: ScatterAxis): boolean {
  return axis === "mass" || axis === "mhi";
}
