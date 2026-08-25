import { legacySurveyCutoutUrl, sdssCutoutUrl } from "./imageCutouts";

export type ImageTier = "sdss" | "legacy" | "wise" | "empty";

/** Headless version of the same SDSS -> Legacy -> WISE -> empty chain
 * GalaxyImage.tsx renders (see that file for why SDSS is checked via
 * fetch() and the other two via image loading) -- used by GalaxiesPage to
 * find out, for all 163 galaxies up front, which tier each one resolves to
 * before rendering the grid, so it can sort "has an image" first without a
 * visible reshuffle as each card would otherwise resolve on its own. */
function loadsAsImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export async function resolveImageTier(
  ra: number,
  dec: number,
  fovArcsec: number,
  pixels: number,
): Promise<ImageTier> {
  let sdssOk: boolean;
  try {
    const res = await fetch(sdssCutoutUrl(ra, dec, fovArcsec, pixels));
    sdssOk = res.ok;
  } catch {
    sdssOk = false;
  }
  if (sdssOk) return "sdss";

  if (await loadsAsImage(legacySurveyCutoutUrl(ra, dec, fovArcsec, pixels, "ls-dr10"))) return "legacy";
  if (await loadsAsImage(legacySurveyCutoutUrl(ra, dec, fovArcsec, pixels, "unwise-neo7"))) return "wise";
  return "empty";
}
