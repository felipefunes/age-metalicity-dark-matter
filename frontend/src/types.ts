export interface GalaxySummary {
  pgc_id: number;
  name_sparc: string;
  name_external: string | null;
  match_method: "name_match" | "coordinate_match";
  ra: number | null;
  dec: number | null;
  T: number | null;
  l36: number | null;
  e_l36: number | null;
  mhi: number | null;
  f_dm: number | null;
  e_f_dm: number | null;
  f_dm_clipped: boolean;
  quality_flag: number | null;
  metallicity: number | null;
  metallicity_source: string | null;
  age_gyr: number | null;
  age_source: string | null;
}

export interface GalaxyDetail extends GalaxySummary {
  distance_mpc: number | null;
  vflat: number | null;
  e_vflat: number | null;
  r_outer_kpc: number | null;
  vobs_outer: number | null;
  e_vobs_outer: number | null;
  vbar_outer: number | null;
  metallicity_method: string | null;
  age_method: string | null;
}

export interface GalaxyListResponse {
  total: number;
  galaxies: GalaxySummary[];
}

export interface CorrelationResponse {
  x: string;
  y: string;
  control_for: string | null;
  n: number;
  method: string;
  coefficient: number | null;
  p_value: number | null;
  note: string | null;
}

/** Public correlation-variable names understood by the API. */
export type ApiVariable = "metallicity" | "hubble_type" | "age_gyr" | "dm_fraction" | "mass" | "mhi";

/** Axis variables offered in the continuous scatter (T is deliberately
 * excluded -- it is discrete/ordinal and gets its own chart). */
export type ScatterAxis = "metallicity" | "age_gyr" | "dm_fraction" | "mass" | "mhi";

export type MatchMethod = "name_match" | "coordinate_match";
