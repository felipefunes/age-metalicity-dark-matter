import type { ScatterAxis } from "../types";

interface ReliabilityRow {
  variable: string;
  measures: string;
  coverage: string;
  confidence: string;
}

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
  /** FilterPanel + DualRangeSlider. Each *Hint is an always-visible small
   * line under its group's heading (not a hover tooltip -- no tooltip
   * infra exists, and hover-only fails touch users anyway). */
  filter: {
    axesTitle: string;
    xAxisLabel: string;
    yAxisLabel: string;
    axesHint: string;
    massTitlePrefix: string;
    massHint: string;
    massAriaLabelMin: string;
    massAriaLabelMax: string;
    qualityTitle: string;
    excludeLowQuality: string;
    qualityHint: string;
    matchMethodTitle: string;
    matchMethodHint: string;
    ageTitle: string;
    requireAge: string;
    ageHint: string;
    resetButton: string;
    /** Floating mobile-only button that opens the filter drawer. */
    mobileToggle: string;
  };
  /** ScatterPanel + HubbleTypeChart. */
  chart: {
    controlForMass: string;
    errorPrefix: string;
    spearman: string;
    spearmanPartialMass: string;
    /** "Source:" -- the citation itself (author/year) stays literal, only
     * this leading word and any surrounding description are translated. */
    sourcePrefix: string;
    nPlotted: (n: number) => string;
    scatterEmptyState: (xLabel: string, yLabel: string) => string;
    scatterHint: string;
    scatterLogSuffix: string;
    /** Label for the match-method word in the scatter's hover tooltip
     * (the value itself is looked up via dict.matchMethod). */
    hoverCrossLabel: string;
    /** Prefixed to the Spearman annotation when p > 0.05, so a visually
     * prominent regression line never implies a trend the statistic
     * itself doesn't support. The line/band are also drawn muted+dashed
     * in that case instead of in the theme's accent color. */
    notSignificantPrefix: string;
    hubbleTitle: string;
    hubbleEmptyState: string;
    hubbleHint: string;
    hubbleSourceSuffix: string;
    /** HubbleTypeChart always shows both the raw and mass-controlled
     * Spearman results together -- there's no toggle for this chart
     * anymore (removed: it stopped affecting anything visible once both
     * were always shown, see CHANGELOG.md). */
    hubbleRawStatLabel: string;
    hubbleMassStatLabel: string;
  };
  nav: {
    /** Short 1-2 word wordmark next to the logo -- the full descriptive
     * title lives in the Hero, this is just the compact nav brand. */
    brand: string;
    dataLink: string;
    sourcesLink: string;
    galaxiesLink: string;
    languageLabel: string;
  };
  /** Hero masthead. The big title itself reuses common.siteTitle rather
   * than duplicating it. Paragraphs are split around the one inline link
   * (SPARC) and the one bold emphasis ("controlling for mass") since
   * dictionary values are plain strings, not JSX -- the wrapper elements
   * stay fixed in Hero.tsx, only the surrounding text is translated. */
  hero: {
    /** Plain-language hook shown before the two technical intro paragraphs
     * -- answers "what is this asking" before "how does it ask it". */
    leadQuestion: string;
    /** <summary> label for the collapsed-by-default "how does this work"
     * <details>, which holds intro1/intro2 below -- the hero itself is
     * just title + leadQuestion + the disclaimer badge now. */
    howItWorksSummary: string;
    intro1Before: string;
    intro1After: string;
    intro2Before: string;
    intro2Bold: string;
    intro2After: string;
    disclaimer: string;
  };
  /** Always-visible reliability map, rendered as its own section between
   * the Hero and #datos -- deliberately never inside the collapsible
   * "how does this work" details, since it's the fastest way to communicate
   * "how seriously to take each number" and shouldn't require a click. */
  reliability: {
    heading: string;
    columnVariable: string;
    columnMeasures: string;
    columnCoverage: string;
    columnConfidence: string;
    rows: [ReliabilityRow, ReliabilityRow, ReliabilityRow, ReliabilityRow];
    fourVariablesNote: string;
  };
  /** Section headings outside the hero (magazine-style but smaller). #datos
   * has no heading of its own -- a background-color band is enough to read
   * as a distinct section, so only "fuentes" needs a translated title. */
  section: {
    fuentesTitle: string;
  };
  /** SourcesSection. Author/year/journal citations are hardcoded, literal
   * ReactNode fragments directly in the component (identical across every
   * locale -- citations aren't translated) -- only each source's one-line
   * "what this gives us" description is looked up here. */
  sources: {
    sparc: string;
    hyperleda: string;
    nedSimbad: string;
    moustakas: string;
    pilyugin: string;
    z0mgs: string;
    dn4000Hdelta: string;
    /** Connector between the two citations in the Dn4000/Hδ_A entry
     * ("...54; {and} Worthey, G., ..."). */
    andConnector: string;
  };
  footer: {
    openSourceText: string;
    licenseNote: string;
  };
  /** GalaxiesPage, GalaxyImage, GalaxyImageModal. */
  galaxies: {
    pageTitle: string;
    pageHint: string;
    /** Shown under a successfully-loaded image, naming whichever source in
     * the fallback chain actually loaded (see imageCutouts.ts). */
    sourceSdss: string;
    sourceLegacyOptical: string;
    sourceLegacyWise: string;
    noImage: string;
    viewFullRecord: string;
    modalCloseAriaLabel: string;
  };
}
