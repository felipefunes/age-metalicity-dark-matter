import { useState } from "react";
import { GalaxyImage } from "../components/GalaxyImage";
import { GalaxyImageModal } from "../components/GalaxyImageModal";
import type { GalaxyFilters } from "../api";
import { useGalaxies } from "../hooks/useGalaxies";
import { useLocale } from "../i18n/LocaleContext";
import { DEFAULT_THUMBNAIL_FOV_ARCSEC } from "../utils/imageCutouts";

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
   * to the image modal's "view full record" link. */
  onPointClick: (pgcId: number) => void;
}

export function GalaxiesPage({ onPointClick }: GalaxiesPageProps) {
  const { t } = useLocale();
  const d = t((dict) => dict);
  const { galaxies, loading, error } = useGalaxies(NO_FILTERS);
  const [modalPgcId, setModalPgcId] = useState<number | null>(null);

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
            {galaxies.map((g) => (
              <button
                key={g.pgc_id}
                type="button"
                className="galaxy-card"
                onClick={() => setModalPgcId(g.pgc_id)}
              >
                {g.ra !== null && g.dec !== null ? (
                  <GalaxyImage
                    ra={g.ra}
                    dec={g.dec}
                    fovArcsec={DEFAULT_THUMBNAIL_FOV_ARCSEC}
                    pixels={THUMBNAIL_PIXELS}
                    alt={g.name_sparc}
                  />
                ) : (
                  <div className="galaxy-image galaxy-image--empty">
                    <span>{d.galaxies.noImage}</span>
                  </div>
                )}
                <span className="galaxy-card__name">{g.name_sparc}</span>
                <span className="galaxy-card__pgc">PGC {g.pgc_id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <GalaxyImageModal
        pgcId={modalPgcId}
        onClose={() => setModalPgcId(null)}
        onViewFullRecord={onPointClick}
      />
    </section>
  );
}
