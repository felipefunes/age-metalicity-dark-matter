import { useGalaxyDetail } from "../hooks/useGalaxyDetail";
import { useLocale } from "../i18n/LocaleContext";
import { estimateFovArcsec } from "../utils/imageCutouts";
import { GalaxyImage } from "./GalaxyImage";

interface GalaxyImageModalProps {
  pgcId: number | null;
  onClose: () => void;
  /** Closes this modal and opens the existing GalaxyDetailDrawer for full
   * stats -- a small addition beyond the literal ask, cheap since the
   * drawer and its data-fetching already exist. */
  onViewFullRecord: (pgcId: number) => void;
}

export function GalaxyImageModal({ pgcId, onClose, onViewFullRecord }: GalaxyImageModalProps) {
  const { t } = useLocale();
  const d = t((dict) => dict);
  const { galaxy, loading, error } = useGalaxyDetail(pgcId);

  if (pgcId === null) return null;

  return (
    <div className="image-modal-overlay" onClick={onClose}>
      <div className="image-modal" onClick={(e) => e.stopPropagation()}>
        <button className="image-modal__close" onClick={onClose} aria-label={d.galaxies.modalCloseAriaLabel}>
          ✕
        </button>

        {loading && <div className="status-text">{d.common.loading}</div>}
        {error && (
          <div className="status-text error">
            {d.common.error}: {error}
          </div>
        )}

        {galaxy && galaxy.ra !== null && galaxy.dec !== null && (
          <>
            <GalaxyImage
              ra={galaxy.ra}
              dec={galaxy.dec}
              fovArcsec={estimateFovArcsec(galaxy.r_outer_kpc, galaxy.distance_mpc)}
              pixels={500}
              alt={galaxy.name_sparc}
              className="image-modal__image"
            />
            <h2>{galaxy.name_sparc}</h2>
            <div className="image-modal__subtitle">PGC {galaxy.pgc_id}</div>
            <button
              className="reset-filters"
              onClick={() => {
                onClose();
                onViewFullRecord(galaxy.pgc_id);
              }}
            >
              {d.galaxies.viewFullRecord}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
