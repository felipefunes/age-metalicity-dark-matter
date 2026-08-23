import type { GalaxySummary, ScatterAxis } from "../types";

export function axisValue(galaxy: GalaxySummary, axis: ScatterAxis): number | null {
  switch (axis) {
    case "metallicity":
      return galaxy.metallicity;
    case "metallicity_kk04":
      return galaxy.metallicity_kk04;
    case "metallicity_pt05":
      return galaxy.metallicity_pt05;
    case "metallicity_pilyugin2014":
      return galaxy.metallicity_pilyugin2014;
    case "age_gyr":
      return galaxy.age_gyr;
    case "age_proxy_ssfr":
      return galaxy.age_proxy_ssfr;
    case "age_proxy_dn4000":
      return galaxy.age_proxy_dn4000;
    case "age_proxy_hdelta_a":
      return galaxy.age_proxy_hdelta_a;
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
