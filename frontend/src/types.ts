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
  /** Independent metallicity estimates -- deliberately not merged into one
   * "metallicity" value (different calibrations/catalogs; see docs/findings/). */
  metallicity_kk04: number | null;
  metallicity_pt05: number | null;
  metallicity_pilyugin2014: number | null;
  /** sSFR age PROXY (z0MGS) -- not a stellar-population-synthesis age. */
  age_proxy_ssfr: number | null;
  /** Measured directly from SDSS spectra (Balogh+1999 / Worthey & Ottaviani
   * 1997) -- see docs/findings/2026-08-23_dn4000_hdelta_a.md before
   * correlating either against metallicity (age-metallicity degeneracy). */
  age_proxy_dn4000: number | null;
  age_proxy_hdelta_a: number | null;
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
  e_metallicity_kk04: number | null;
  e_metallicity_pt05: number | null;
  n_hii_regions_moustakas: number | null;
  e_metallicity_pilyugin2014: number | null;
  e_age_proxy_ssfr: number | null;
  age_proxy_source: string | null;
  age_proxy_method: string | null;
  e_age_proxy_dn4000: number | null;
  n_pixels_dn4000: number | null;
  e_age_proxy_hdelta_a: number | null;
  n_pixels_hdelta_a: number | null;
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
export type ApiVariable =
  | "metallicity"
  | "metallicity_kk04"
  | "metallicity_pt05"
  | "metallicity_pilyugin2014"
  | "hubble_type"
  | "age_gyr"
  | "age_proxy_ssfr"
  | "age_proxy_dn4000"
  | "age_proxy_hdelta_a"
  | "dm_fraction"
  | "mass"
  | "mhi";

/** Axis variables offered in the continuous scatter (T is deliberately
 * excluded -- it is discrete/ordinal and gets its own chart). */
export type ScatterAxis =
  | "metallicity"
  | "metallicity_kk04"
  | "metallicity_pt05"
  | "metallicity_pilyugin2014"
  | "age_gyr"
  | "age_proxy_ssfr"
  | "age_proxy_dn4000"
  | "age_proxy_hdelta_a"
  | "dm_fraction"
  | "mass"
  | "mhi";

export type MatchMethod = "name_match" | "coordinate_match";
