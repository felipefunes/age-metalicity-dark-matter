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
}
