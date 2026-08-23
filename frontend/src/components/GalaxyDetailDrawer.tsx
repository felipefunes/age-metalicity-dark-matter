import { useGalaxyDetail } from "../hooks/useGalaxyDetail";
import { useLocale } from "../i18n/LocaleContext";
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
  const { t } = useLocale();
  const d = t((dict) => dict);

  if (pgcId === null) return null;

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-drawer" onClick={(e) => e.stopPropagation()}>
        <button className="detail-close" onClick={onClose} aria-label={d.detail.closeAriaLabel}>
          ✕
        </button>

        {loading && <div className="status-text">{d.common.loading}</div>}
        {error && (
          <div className="status-text error">
            {d.common.error}: {error}
          </div>
        )}

        {galaxy && (
          <>
            <h2>{galaxy.name_sparc}</h2>
            <div className="subtitle">
              PGC {galaxy.pgc_id} · {galaxy.name_external ?? "—"} ·{" "}
              <span className={`badge ${galaxy.match_method}`}>{d.matchMethod[galaxy.match_method]}</span>
            </div>

            <table className="detail-table">
              <tbody>
                <Row label={d.detail.ra} value={`${formatNumber(galaxy.ra, 5)}°`} />
                <Row label={d.detail.dec} value={`${formatNumber(galaxy.dec, 5)}°`} />
                <Row label={d.axis.hubble_type.label} value={`${galaxy.T ?? "—"} (${hubbleTypeLabel(galaxy.T)})`} />
                <Row label={d.detail.distance} value={`${formatNumber(galaxy.distance_mpc)} Mpc`} />
                <Row label="L[3.6]" value={`${formatNumber(galaxy.l36)} ± ${formatNumber(galaxy.e_l36)} ×10⁹ L☉`} />
                <Row label="MHI" value={`${formatNumber(galaxy.mhi)} ×10⁹ M☉`} />
                <Row label="Vflat" value={`${formatNumber(galaxy.vflat)} ± ${formatNumber(galaxy.e_vflat)} km/s`} />
                <Row label={d.detail.outerRadius} value={`${formatNumber(galaxy.r_outer_kpc)} kpc`} />
                <Row
                  label={d.detail.vobsOuter}
                  value={`${formatNumber(galaxy.vobs_outer)} ± ${formatNumber(galaxy.e_vobs_outer)} km/s`}
                />
                <Row label={d.detail.vbarOuter} value={`${formatNumber(galaxy.vbar_outer)} km/s`} />
                <Row
                  label="f_DM"
                  value={`${formatNumber(galaxy.f_dm)} ± ${formatNumber(galaxy.e_f_dm)}${
                    galaxy.f_dm_clipped ? ` ${d.detail.clipped}` : ""
                  }`}
                />
                <Row label={d.detail.qualityFlag} value={String(galaxy.quality_flag ?? "—")} />
                <Row
                  label={d.axis.metallicity_kk04.label}
                  value={
                    galaxy.metallicity_kk04 !== null
                      ? `${formatNumber(galaxy.metallicity_kk04)} ± ${formatNumber(galaxy.e_metallicity_kk04)} ${d.detail.hiiRegionsSuffix(String(galaxy.n_hii_regions_moustakas ?? "?"))}`
                      : d.detail.noData
                  }
                />
                <Row
                  label={d.axis.metallicity_pt05.label}
                  value={
                    galaxy.metallicity_pt05 !== null
                      ? `${formatNumber(galaxy.metallicity_pt05)} ± ${formatNumber(galaxy.e_metallicity_pt05)} ${d.detail.hiiRegionsSuffix(String(galaxy.n_hii_regions_moustakas ?? "?"))}`
                      : d.detail.noData
                  }
                />
                <Row
                  label={d.axis.metallicity_pilyugin2014.label}
                  value={
                    galaxy.metallicity_pilyugin2014 !== null
                      ? `${formatNumber(galaxy.metallicity_pilyugin2014)} ± ${formatNumber(galaxy.e_metallicity_pilyugin2014)}`
                      : d.detail.noData
                  }
                />
                <Row
                  label={d.axis.age_proxy_ssfr.label}
                  value={
                    galaxy.age_proxy_ssfr !== null
                      ? `log₁₀=${formatNumber(galaxy.age_proxy_ssfr)} ± ${formatNumber(galaxy.e_age_proxy_ssfr)} (${galaxy.age_proxy_source} / ${galaxy.age_proxy_method})`
                      : d.detail.noData
                  }
                />
                <Row
                  label={d.axis.age_proxy_dn4000.label}
                  value={
                    galaxy.age_proxy_dn4000 !== null
                      ? `${formatNumber(galaxy.age_proxy_dn4000)} ± ${formatNumber(galaxy.e_age_proxy_dn4000)} ${d.detail.pxSuffix(String(galaxy.n_pixels_dn4000 ?? "?"))}`
                      : d.detail.noData
                  }
                />
                <Row
                  label={`${d.axis.age_proxy_hdelta_a.label} (${d.detail.lickResolutionNote})`}
                  value={
                    galaxy.age_proxy_hdelta_a !== null
                      ? `${formatNumber(galaxy.age_proxy_hdelta_a)} ± ${formatNumber(galaxy.e_age_proxy_hdelta_a)} Å ${d.detail.pxSuffix(String(galaxy.n_pixels_hdelta_a ?? "?"))}`
                      : d.detail.noData
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
