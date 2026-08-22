import { useEffect, useState } from "react";
import { fetchGalaxies } from "../api";

export interface MassDomain {
  min: number;
  max: number;
  loading: boolean;
}

const NO_FILTERS = {
  massMin: null,
  massMax: null,
  excludeLowQuality: false,
  matchMethods: ["name_match", "coordinate_match"] as const,
  requireAge: false,
};

/** L[3.6] range across the whole (unfiltered) dataset, fetched once, to set
 * the bounds of the mass dual-range slider. */
export function useMassDomain(): MassDomain {
  const [domain, setDomain] = useState<MassDomain>({ min: 0, max: 1, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    fetchGalaxies({ ...NO_FILTERS, matchMethods: [...NO_FILTERS.matchMethods] }, controller.signal)
      .then((response) => {
        const masses = response.galaxies
          .map((g) => g.l36)
          .filter((v): v is number => v !== null && v > 0);
        if (masses.length === 0) return;
        setDomain({ min: Math.min(...masses), max: Math.max(...masses), loading: false });
      })
      .catch(() => setDomain((prev) => ({ ...prev, loading: false })));

    return () => controller.abort();
  }, []);

  return domain;
}
