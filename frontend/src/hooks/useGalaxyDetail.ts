import { useEffect, useState } from "react";
import { fetchGalaxy } from "../api";
import type { GalaxyDetail } from "../types";

export interface GalaxyDetailState {
  galaxy: GalaxyDetail | null;
  loading: boolean;
  error: string | null;
}

export function useGalaxyDetail(pgcId: number | null): GalaxyDetailState {
  const [state, setState] = useState<GalaxyDetailState>({ galaxy: null, loading: false, error: null });

  useEffect(() => {
    if (pgcId === null) {
      setState({ galaxy: null, loading: false, error: null });
      return;
    }
    const controller = new AbortController();
    setState({ galaxy: null, loading: true, error: null });

    fetchGalaxy(pgcId, controller.signal)
      .then((galaxy) => setState({ galaxy, loading: false, error: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState({ galaxy: null, loading: false, error: (err as Error).message });
      });

    return () => controller.abort();
  }, [pgcId]);

  return state;
}
