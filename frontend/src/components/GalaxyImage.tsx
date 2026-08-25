import { useEffect, useState } from "react";
import { useLocale } from "../i18n/LocaleContext";
import { legacySurveyCutoutUrl, sdssCutoutUrl } from "../utils/imageCutouts";
import type { ImageTier } from "../utils/resolveImageTier";

interface GalaxyImageProps {
  ra: number;
  dec: number;
  fovArcsec: number;
  pixels: number;
  alt: string;
  className?: string;
  /** Controlled mode: when the caller already knows which tier this
   * galaxy resolves to (GalaxiesPage pre-resolves all 163 up front to sort
   * the grid, see resolveImageTier.ts), pass it here to render that tier
   * directly instead of re-running the async chain. Omit (or leave
   * undefined) for uncontrolled mode -- GalaxyImageModal, a single galaxy
   * at a time, resolves it lazily on mount itself. */
  tier?: ImageTier;
  /** Set to false to disable this component's own resolution entirely,
   * even when `tier` is still undefined -- used by the grid while its
   * batch pre-resolution is in flight, so 163 cards don't each start an
   * independent, duplicate SDSS/Legacy/WISE check on top of the one
   * GalaxiesPage is already running for sort order. Shows the loading
   * placeholder until `tier` arrives instead. Defaults to true. */
  selfResolve?: boolean;
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
type InternalTier = "checking-sdss" | ImageTier;

export function GalaxyImage({
  ra,
  dec,
  fovArcsec,
  pixels,
  alt,
  className,
  tier: controlledTier,
  selfResolve = true,
}: GalaxyImageProps) {
  const { t } = useLocale();
  const d = t((dict) => dict);
  const [resolvedTier, setResolvedTier] = useState<InternalTier>("checking-sdss");

  const sdssUrl = sdssCutoutUrl(ra, dec, fovArcsec, pixels);

  useEffect(() => {
    if (controlledTier !== undefined || !selfResolve) return;
    const controller = new AbortController();
    setResolvedTier("checking-sdss");

    fetch(sdssUrl, { signal: controller.signal })
      .then((res) => setResolvedTier(res.ok ? "sdss" : "legacy"))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResolvedTier("legacy");
      });

    return () => controller.abort();
    // sdssUrl is derived purely from ra/dec/fovArcsec/pixels, so listing
    // those four is equivalent to listing sdssUrl itself.
  }, [ra, dec, fovArcsec, pixels, controlledTier, selfResolve]);

  const tier = controlledTier ?? resolvedTier;

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
    // Only the uncontrolled, self-resolving (modal) path can still advance
    // on a real <img> load failure -- in controlled mode the tier was
    // already fully resolved up front by resolveImageTier.ts.
    if (controlledTier !== undefined || !selfResolve) return;
    setResolvedTier((prev) => (prev === "sdss" ? "legacy" : prev === "legacy" ? "wise" : "empty"));
  }

  return (
    <div className={`galaxy-image ${className ?? ""}`}>
      <img src={src} alt={alt} loading="lazy" onError={advance} />
      <span className="galaxy-image__attribution">{attribution}</span>
    </div>
  );
}
