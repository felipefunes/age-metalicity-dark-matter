import { useEffect, useState } from "react";
import { fetchCorrelation, type GalaxyFilters } from "../api";
import type { ApiVariable, CorrelationResponse } from "../types";

export interface CorrelationState {
  result: CorrelationResponse | null;
  loading: boolean;
  error: string | null;
}

export function useCorrelation(
  x: ApiVariable,
  y: ApiVariable,
  filters: GalaxyFilters,
  controlFor: ApiVariable | null,
): CorrelationState {
  const [state, setState] = useState<CorrelationState>({ result: null, loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, loading: true, error: null }));

    fetchCorrelation(x, y, filters, controlFor, controller.signal)
      .then((result) => setState({ result, loading: false, error: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ result: null, loading: false, error: (err as Error).message });
      });

    return () => controller.abort();
  }, [
    x,
    y,
    controlFor,
    filters.massMin,
    filters.massMax,
    filters.excludeLowQuality,
    filters.matchMethods.join(","),
    filters.requireAge,
  ]);

  return state;
}
