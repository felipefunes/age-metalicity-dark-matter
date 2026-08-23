import type { ApiVariable, GalaxyDetail, GalaxyListResponse, CorrelationResponse, MatchMethod } from "./types";

// In production the frontend is served behind a reverse proxy that routes
// /api/* to the API container (see frontend/nginx.conf); in dev, Vite's
// proxy (vite.config.ts) does the same against the local API.
const API_BASE = "/api";

export interface GalaxyFilters {
  massMin: number | null;
  massMax: number | null;
  excludeLowQuality: boolean;
  matchMethods: MatchMethod[];
  requireAge: boolean;
}

function filtersToParams(filters: GalaxyFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.massMin !== null) params.set("mass_min", String(filters.massMin));
  if (filters.massMax !== null) params.set("mass_max", String(filters.massMax));
  if (filters.excludeLowQuality) params.set("exclude_low_quality", "true");
  if (filters.matchMethods.length > 0 && filters.matchMethods.length < 2) {
    params.set("match_method", filters.matchMethods.join(","));
  }
  if (filters.requireAge) params.set("require_age", "true");
  return params;
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${body}`);
  }
  return (await response.json()) as T;
}

export function fetchGalaxies(filters: GalaxyFilters, signal?: AbortSignal): Promise<GalaxyListResponse> {
  const params = filtersToParams(filters);
  return getJson<GalaxyListResponse>(`${API_BASE}/galaxies?${params.toString()}`, signal);
}

export function fetchGalaxy(pgcId: number, signal?: AbortSignal): Promise<GalaxyDetail> {
  return getJson<GalaxyDetail>(`${API_BASE}/galaxies/${pgcId}`, signal);
}

export function fetchCorrelation(
  x: ApiVariable,
  y: ApiVariable,
  filters: GalaxyFilters,
  controlFor: ApiVariable | null,
  signal?: AbortSignal,
): Promise<CorrelationResponse> {
  const params = filtersToParams(filters);
  params.set("x", x);
  params.set("y", y);
  if (controlFor) params.set("control_for", controlFor);
  return getJson<CorrelationResponse>(`${API_BASE}/correlations?${params.toString()}`, signal);
}
