import { useEffect, useState } from "react";
import { fetchGalaxies, type GalaxyFilters } from "../api";
import type { GalaxySummary } from "../types";

export interface GalaxiesState {
  galaxies: GalaxySummary[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useGalaxies(filters: GalaxyFilters): GalaxiesState {
  const [state, setState] = useState<GalaxiesState>({
    galaxies: [],
    total: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchGalaxies(filters, controller.signal)
      .then((response) => {
        setState({ galaxies: response.galaxies, total: response.total, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({ ...prev, loading: false, error: (err as Error).message }));
      });

    return () => controller.abort();
  }, [
    filters.massMin,
    filters.massMax,
    filters.excludeLowQuality,
    filters.matchMethods.join(","),
    filters.requireAge,
  ]);

  return state;
}
