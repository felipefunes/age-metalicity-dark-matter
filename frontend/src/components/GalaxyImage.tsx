import { useEffect, useState } from "react";
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
 *
 * SDSS is checked with a real fetch() (it sends
 * Access-Control-Allow-Origin: *, verified), not <img onError>: outside its
 * footprint it returns HTTP 404 with a *valid, decodable* JPEG whose pixels
 * literally read "outside the SDSS footprint" -- confirmed against a real
 * request. <img onError> never fires for that (the browser doesn't care
 * about the HTTP status once the body decodes as a real image), so an
 * onError-only chain would get stuck showing that placeholder as if it
 * were a real photo. fetch() lets us check response.ok directly instead.
 *
 * DESI Legacy Imaging has no CORS headers (verified), so the same
 * fetch()-based check isn't possible there -- its own out-of-footprint
 * response is a blank/solid-color 200 JPEG (documented in
 * imageCutouts.ts), which this component still cannot detect. Real,
 * accepted limitation for tiers 2/3 specifically, not for SDSS. */
type Tier = "checking-sdss" | "sdss" | "legacy" | "wise" | "empty";

export function GalaxyImage({ ra, dec, fovArcsec, pixels, alt, className }: GalaxyImageProps) {
  const { t } = useLocale();
  const d = t((dict) => dict);
  const [tier, setTier] = useState<Tier>("checking-sdss");

  const sdssUrl = sdssCutoutUrl(ra, dec, fovArcsec, pixels);

  useEffect(() => {
    const controller = new AbortController();
    setTier("checking-sdss");

    fetch(sdssUrl, { signal: controller.signal })
      .then((res) => setTier(res.ok ? "sdss" : "legacy"))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setTier("legacy");
      });

    return () => controller.abort();
    // sdssUrl is derived purely from ra/dec/fovArcsec/pixels, so listing
    // those four is equivalent to listing sdssUrl itself.
  }, [ra, dec, fovArcsec, pixels]);

  if (tier === "checking-sdss") {
    return <div className={`galaxy-image galaxy-image--loading ${className ?? ""}`} />;
  }

  if (tier === "empty") {
    return (
      <div className={`galaxy-image galaxy-image--empty ${className ?? ""}`}>
        <span>{d.galaxies.noImage}</span>
      </div>
    );
  }

  const src =
    tier === "sdss"
      ? sdssUrl
      : tier === "legacy"
        ? legacySurveyCutoutUrl(ra, dec, fovArcsec, pixels, "ls-dr10")
        : legacySurveyCutoutUrl(ra, dec, fovArcsec, pixels, "unwise-neo7");

  const attribution =
    tier === "sdss" ? d.galaxies.sourceSdss : tier === "legacy" ? d.galaxies.sourceLegacyOptical : d.galaxies.sourceLegacyWise;

  function advance() {
    setTier((prev) => (prev === "sdss" ? "legacy" : prev === "legacy" ? "wise" : "empty"));
  }

  return (
    <div className={`galaxy-image ${className ?? ""}`}>
      <img src={src} alt={alt} loading="lazy" onError={advance} />
      <span className="galaxy-image__attribution">{attribution}</span>
    </div>
  );
}
