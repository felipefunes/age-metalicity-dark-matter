/** 1 kpc at 1 Mpc subtends this many arcsec (small-angle approximation,
 * exact for the sizes involved here: 206265 arcsec/rad * (1 kpc / 1000 kpc)). */
const ARCSEC_PER_KPC_PER_MPC = 206.265;

const MIN_FOV_ARCSEC = 60;
const MAX_FOV_ARCSEC = 1800;

/** Grid thumbnails don't have r_outer_kpc/distance_mpc available (that's
 * GalaxyDetail-only, fetched on demand) -- one fixed, modest field of view
 * for the list view. The modal (which does fetch GalaxyDetail) uses
 * estimateFovArcsec() below for a properly framed image instead. */
export const DEFAULT_THUMBNAIL_FOV_ARCSEC = 400;

/** Empirically tuned (not a physical calculation): SPARC's r_outer_kpc is
 * the outermost *rotation-curve* point, which for HI-rich galaxies often
 * extends well beyond the optical disk (e.g. NGC2403: r_outer=20.87 kpc vs.
 * a D25 optical radius of ~10 kpc) -- using it directly as a diameter would
 * over-frame most galaxies. The 1.5x/60/1800 constants were validated
 * against real cutouts for NGC2403 (large, nearby) and CamB (compact
 * dwarf), both of which framed well with this formula. */
export function estimateFovArcsec(rOuterKpc: number | null, distanceMpc: number | null): number {
  if (rOuterKpc === null || distanceMpc === null || distanceMpc <= 0) {
    return DEFAULT_THUMBNAIL_FOV_ARCSEC;
  }
  const fov = 1.5 * (rOuterKpc / distanceMpc) * ARCSEC_PER_KPC_PER_MPC;
  return Math.min(MAX_FOV_ARCSEC, Math.max(MIN_FOV_ARCSEC, fov));
}

/** SDSS SkyServer image cutout (optical ugriz composite). CORS-enabled
 * (verified: Access-Control-Allow-Origin: *) and returns a real HTTP error
 * (typically 404) outside its imaging footprint -- confirmed against a
 * real coordinate_match dwarf (CamB) with no SDSS coverage. */
export function sdssCutoutUrl(ra: number, dec: number, fovArcsec: number, pixels: number): string {
  const scale = fovArcsec / pixels;
  return `https://skyserver.sdss.org/dr18/SkyServerWS/ImgCutout/getjpeg?ra=${ra}&dec=${dec}&scale=${scale}&width=${pixels}&height=${pixels}`;
}

export type LegacySurveyLayer = "ls-dr10" | "unwise-neo7";

/** DESI Legacy Imaging Survey cutout viewer. "ls-dr10" is optical grz
 * (broader/deeper footprint than SDSS, but overlays colored SGA
 * large-galaxy markers on some well-known targets -- verified on NGC2403,
 * SDSS was clean for the same object, hence SDSS is tried first).
 * "unwise-neo7" is mid-IR (WISE W1/W2, ~3.4/4.6 μm) -- the closest
 * available band to this project's own Spitzer [3.6μm] photometry, and
 * effectively all-sky.
 *
 * KNOWN LIMITATION (verified, not fixed): outside its real coverage this
 * service returns HTTP 200 with a blank/solid-color JPEG instead of an
 * error, so the <img onError> fallback chain in GalaxyImage.tsx cannot
 * detect that case and will display the blank tile as if it were a real,
 * if uninteresting, photo. No CORS headers are sent (verified), so a
 * fetch()-based content check (as done implicitly via SDSS's real 404s)
 * isn't a viable fix here. */
export function legacySurveyCutoutUrl(
  ra: number,
  dec: number,
  fovArcsec: number,
  pixels: number,
  layer: LegacySurveyLayer,
): string {
  const pixscale = fovArcsec / pixels;
  return `https://www.legacysurvey.org/viewer/jpeg-cutout?ra=${ra}&dec=${dec}&size=${pixels}&layer=${layer}&pixscale=${pixscale}`;
}
