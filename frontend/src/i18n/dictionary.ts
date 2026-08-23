import type { ScatterAxis } from "../types";

interface AxisEntry {
  label: string;
  /** Which external source (beyond SPARC, always credited separately) this
   * axis's data comes from. null = SPARC-only. Kept as one fully-translated
   * string rather than splitting a translatable prefix from the citation --
   * citations (author/year) don't change across locales, but surrounding
   * words like "spectra"/"espectros" do, so it's simplest to just write out
   * each locale's full source string once. */
  source: string | null;
}

/** Shape shared by every locale file (en.ts/es.ts/pt.ts). Each locale
 * assigns its full literal object to this interface, so a missing or
 * extra key anywhere in the shape is a compile error at the offending
 * locale file -- there is no runtime fallback/merge logic. Grown
 * incrementally, one namespace per feature, alongside the components
 * that consume it. */
export interface Dictionary {
  common: {
    loading: string;
    close: string;
    error: string;
    /** Used for document.title -- kept short, not the hero's full title. */
    siteTitle: string;
  };
  /** hubble_type is included alongside every ScatterAxis because
   * HubbleTypeChart's y/x titles reuse these same entries rather than
   * duplicating their own translations. */
  axis: Record<ScatterAxis | "hubble_type", AxisEntry>;
  /** Shared between FilterPanel's checkboxes and the detail drawer's badge
   * -- both display the same underlying MatchMethod value. */
  matchMethod: {
    name_match: string;
    coordinate_match: string;
  };
  /** GalaxyDetailDrawer's row labels not already covered by `axis` (RA,
   * Dec, distance, etc. have no axis equivalent). Pure physics symbols
   * (L[3.6], MHI, Vflat, f_DM) are left as literal, language-invariant
   * text directly in the component -- only the surrounding natural-
   * language words are translated here. */
  detail: {
    ra: string;
    dec: string;
    distance: string;
    outerRadius: string;
    vobsOuter: string;
    vbarOuter: string;
    clipped: string;
    qualityFlag: string;
    noData: string;
    /** Appended to the Hδ_A row, which (unlike the other axis-reused rows)
     * carries an extra methodological detail worth surfacing here. */
    lickResolutionNote: string;
    closeAriaLabel: string;
    hiiRegionsSuffix: (n: string) => string;
    pxSuffix: (n: string) => string;
  };
}
