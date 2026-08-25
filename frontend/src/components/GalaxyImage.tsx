import { useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import { legacySurveyCutoutUrl, sdssCutoutUrl } from "../utils/imageCutouts";

interface GalaxyImageProps {
  ra: number;
  dec: number;
  fovArcsec: number;
  pixels: number;
  alt: string;
  className?: string;
}

/** SDSS -> DESI Legacy (optical) -> DESI Legacy (WISE mid-IR) -> "no image".
 * Each tier is a real, independently-verified source (see imageCutouts.ts).
 * Advances on <img onError> -- catches real HTTP failures (SDSS 404s
 * outside its footprint, confirmed) but not DESI Legacy's blank-placeholder
 * response outside its own footprint (a documented, unfixed limitation --
 * see imageCutouts.ts). */
type Tier = 0 | 1 | 2 | 3;

export function GalaxyImage({ ra, dec, fovArcsec, pixels, alt, className }: GalaxyImageProps) {
  const { t } = useLocale();
  const d = t((dict) => dict);
  const [tier, setTier] = useState<Tier>(0);

  const src =
    tier === 0
      ? sdssCutoutUrl(ra, dec, fovArcsec, pixels)
      : tier === 1
        ? legacySurveyCutoutUrl(ra, dec, fovArcsec, pixels, "ls-dr10")
        : tier === 2
          ? legacySurveyCutoutUrl(ra, dec, fovArcsec, pixels, "unwise-neo7")
          : null;

  const attribution =
    tier === 0
      ? d.galaxies.sourceSdss
      : tier === 1
        ? d.galaxies.sourceLegacyOptical
        : d.galaxies.sourceLegacyWise;

  if (src === null) {
    return (
      <div className={`galaxy-image galaxy-image--empty ${className ?? ""}`}>
        <span>{d.galaxies.noImage}</span>
      </div>
    );
  }

  return (
    <div className={`galaxy-image ${className ?? ""}`}>
      <img src={src} alt={alt} loading="lazy" onError={() => setTier((prev) => (prev + 1) as Tier)} />
      <span className="galaxy-image__attribution">{attribution}</span>
    </div>
  );
}
