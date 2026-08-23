import { useGalaxyDetail } from "../hooks/useGalaxyDetail";
import { formatNumber, hubbleTypeLabel } from "../utils/format";

interface GalaxyDetailDrawerProps {
  pgcId: number | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td>{label}</td>
      <td>{value}</td>
    </tr>
  );
}

export function GalaxyDetailDrawer({ pgcId, onClose }: GalaxyDetailDrawerProps) {
  const { galaxy, loading, error } = useGalaxyDetail(pgcId);

  if (pgcId === null) return null;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label="Cerrar panel de detalle">
          ✕
        </button>

        {loading && <div className="status-text">Cargando…</div>}
        {error && <div className="status-text error">Error: {error}</div>}

        {galaxy && (
          <>
            <h2>{galaxy.name_sparc}</h2>
            <div className="subtitle">
              PGC {galaxy.pgc_id} · {galaxy.name_external ?? "—"} ·{" "}
              <span className={`badge ${galaxy.match_method}`}>{galaxy.match_method}</span>
            </div>

            <table className="detail-table">
              <tbody>
                <Row label="Ascensión recta (RA)" value={`${formatNumber(galaxy.ra, 5)}°`} />
                <Row label="Declinación (Dec)" value={`${formatNumber(galaxy.dec, 5)}°`} />
                <Row label="Tipo de Hubble (T)" value={`${galaxy.T ?? "—"} (${hubbleTypeLabel(galaxy.T)})`} />
                <Row label="Distancia" value={`${formatNumber(galaxy.distance_mpc)} Mpc`} />
                <Row label="L[3.6]" value={`${formatNumber(galaxy.l36)} ± ${formatNumber(galaxy.e_l36)} ×10⁹ L☉`} />
                <Row label="MHI" value={`${formatNumber(galaxy.mhi)} ×10⁹ M☉`} />
                <Row label="Vflat" value={`${formatNumber(galaxy.vflat)} ± ${formatNumber(galaxy.e_vflat)} km/s`} />
                <Row
                  label="Radio externo modelado"
                  value={`${formatNumber(galaxy.r_outer_kpc)} kpc`}
                />
                <Row
                  label="Vobs (radio externo)"
                  value={`${formatNumber(galaxy.vobs_outer)} ± ${formatNumber(galaxy.e_vobs_outer)} km/s`}
                />
                <Row label="Vbar (radio externo)" value={`${formatNumber(galaxy.vbar_outer)} km/s`} />
                <Row
                  label="f_DM"
                  value={`${formatNumber(galaxy.f_dm)} ± ${formatNumber(galaxy.e_f_dm)}${
                    galaxy.f_dm_clipped ? " (clipped)" : ""
                  }`}
                />
                <Row label="Quality flag (SPARC)" value={String(galaxy.quality_flag ?? "—")} />
                <Row
                  label="Metalicidad"
                  value={
                    galaxy.metallicity !== null
                      ? `${formatNumber(galaxy.metallicity)} (${galaxy.metallicity_source} / ${galaxy.metallicity_method})`
                      : "sin dato"
                  }
                />
                <Row
                  label="Edad estelar"
                  value={
                    galaxy.age_gyr !== null
                      ? `${formatNumber(galaxy.age_gyr)} Gyr (${galaxy.age_source} / ${galaxy.age_method})`
                      : "sin dato"
                  }
                />
                <Row
                  label="Metalicidad KK04 (Moustakas+2010)"
                  value={
                    galaxy.metallicity_kk04 !== null
                      ? `${formatNumber(galaxy.metallicity_kk04)} ± ${formatNumber(galaxy.e_metallicity_kk04)} (${galaxy.n_hii_regions_moustakas ?? "?"} regiones HII)`
                      : "sin dato"
                  }
                />
                <Row
                  label="Metalicidad PT05 (Moustakas+2010)"
                  value={
                    galaxy.metallicity_pt05 !== null
                      ? `${formatNumber(galaxy.metallicity_pt05)} ± ${formatNumber(galaxy.e_metallicity_pt05)} (${galaxy.n_hii_regions_moustakas ?? "?"} regiones HII)`
                      : "sin dato"
                  }
                />
                <Row
                  label="Metalicidad (Pilyugin+2014)"
                  value={
                    galaxy.metallicity_pilyugin2014 !== null
                      ? `${formatNumber(galaxy.metallicity_pilyugin2014)} ± ${formatNumber(galaxy.e_metallicity_pilyugin2014)}`
                      : "sin dato"
                  }
                />
                <Row
                  label="Proxy de edad: sSFR (z0MGS)"
                  value={
                    galaxy.age_proxy_ssfr !== null
                      ? `log₁₀=${formatNumber(galaxy.age_proxy_ssfr)} ± ${formatNumber(galaxy.e_age_proxy_ssfr)} (${galaxy.age_proxy_source} / ${galaxy.age_proxy_method})`
                      : "sin dato"
                  }
                />
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
