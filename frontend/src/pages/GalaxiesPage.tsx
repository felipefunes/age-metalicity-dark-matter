import { useEffect, useState } from "react";
import { GalaxyImage } from "../components/GalaxyImage";
import { GalaxyImageModal } from "../components/GalaxyImageModal";
import type { GalaxyFilters } from "../api";
import { useGalaxies } from "../hooks/useGalaxies";
import { useLocale } from "../i18n/LocaleContext";
import type { GalaxySummary } from "../types";
import { DEFAULT_THUMBNAIL_FOV_ARCSEC } from "../utils/imageCutouts";
import { resolveImageTier, type ImageTier } from "../utils/resolveImageTier";

const NO_FILTERS: GalaxyFilters = {
  massMin: null,
  massMax: null,
  excludeLowQuality: false,
  matchMethods: ["name_match", "coordinate_match"],
  requireAge: false,
};

const THUMBNAIL_PIXELS = 160;

interface GalaxiesPageProps {
  /** Opens the existing GalaxyDetailDrawer for full stats -- passed through
   * to the image modal's "view full record" link, and used directly (no
   * image modal) for galaxies that resolve to no image at all. */
  onPointClick: (pgcId: number) => void;
}

export function GalaxiesPage({ onPointClick }: GalaxiesPageProps) {
  const { t } = useLocale();
  const d = t((dict) => dict);
  const { galaxies, loading, error } = useGalaxies(NO_FILTERS);
  const [modalPgcId, setModalPgcId] = useState<number | null>(null);
  const [tierByPgc, setTierByPgc] = useState<Map<number, ImageTier> | null>(null);

  // Pre-resolve every galaxy's image tier up front (rather than letting
  // each card resolve lazily and independently, as before) so the grid can
  // be sorted "has an image" first. The grid itself renders immediately
  // (see below) with a loading placeholder in place of each image -- a
  // single SDSS request took ~1.6s in testing, and 163 of them (even
  // batched, not fully serial) can plausibly take 10-40s, so blocking the
  // whole page behind this would be a bad trade. Because every card looks
  // identical (a plain loading box) until this resolves, photos and the
  // final sort order arrive together in one repaint -- there's no visible
  // "reorder after the fact" to avoid.
  useEffect(() => {
    if (galaxies.length === 0) return;
    let cancelled = false;
    setTierByPgc(null);

    Promise.all(
      galaxies.map(async (g): Promise<[number, ImageTier]> => {
        if (g.ra === null || g.dec === null) return [g.pgc_id, "empty"];
        const tier = await resolveImageTier(g.ra, g.dec, DEFAULT_THUMBNAIL_FOV_ARCSEC, THUMBNAIL_PIXELS);
        return [g.pgc_id, tier];
      }),
    ).then((entries) => {
      if (!cancelled) setTierByPgc(new Map(entries));
    });

    return () => {
      cancelled = true;
    };
  }, [galaxies]);

  const sortedGalaxies = tierByPgc
    ? [...galaxies].sort((a, b) => {
        const aEmpty = tierByPgc.get(a.pgc_id) === "empty" ? 1 : 0;
        const bEmpty = tierByPgc.get(b.pgc_id) === "empty" ? 1 : 0;
        return aEmpty - bEmpty;
      })
    : galaxies;

  function handleCardClick(g: GalaxySummary) {
    // No image anywhere -> skip the pointless empty modal and go straight
    // to the full record (the data is still just as reachable).
    if (tierByPgc?.get(g.pgc_id) === "empty") {
      onPointClick(g.pgc_id);
    } else {
      setModalPgcId(g.pgc_id);
    }
  }

  return (
    <section className="galaxies-page">
      <div className="galaxies-page__inner">
        <h1 className="galaxies-page__title">{d.galaxies.pageTitle}</h1>
        <p className="galaxies-page__hint">{d.galaxies.pageHint}</p>

        {loading && <div className="status-text">{d.common.loading}</div>}
        {error && (
          <div className="status-text error">
            {d.common.error}: {error}
          </div>
        )}

        {!loading && !error && (
          <div className="galaxies-grid">
            {sortedGalaxies.map((g) => {
              const tier = tierByPgc?.get(g.pgc_id);
              return (
                <button key={g.pgc_id} type="button" className="galaxy-card" onClick={() => handleCardClick(g)}>
                  {g.ra !== null && g.dec !== null ? (
                    <GalaxyImage
                      ra={g.ra}
                      dec={g.dec}
                      fovArcsec={DEFAULT_THUMBNAIL_FOV_ARCSEC}
                      pixels={THUMBNAIL_PIXELS}
                      alt={g.name_sparc}
                      tier={tier}
                      selfResolve={false}
                    />
                  ) : (
                    <div className="galaxy-image galaxy-image--empty">
                      <span>{d.galaxies.noImage}</span>
                    </div>
                  )}
                  <span className="galaxy-card__name">{g.name_sparc}</span>
                  <span className="galaxy-card__pgc">PGC {g.pgc_id}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <GalaxyImageModal pgcId={modalPgcId} onClose={() => setModalPgcId(null)} onViewFullRecord={onPointClick} />
    </section>
  );
}
