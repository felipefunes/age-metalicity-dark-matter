import { useLocale } from "../i18n/LocaleContext";

/** Citations are hardcoded JSX -- identical across every locale (author/
 * year/journal aren't translated). Only each item's one-line "what this
 * gives us" description is looked up from the dictionary, since the two
 * structural patterns below (name+description+citation vs. name/citation
 * +description) don't unify into one generic template cleanly. */
export function SourcesSection() {
  const { t } = useLocale();
  const d = t((dict) => dict);

  return (
    <section id="fuentes" className="sources-section">
      <h2 className="section-title">{d.section.fuentesTitle}</h2>
      <ul className="sources-list">
        <li>
          <strong>SPARC</strong> — {d.sources.sparc} Lelli, F., McGaugh, S. S., &amp; Schombert, J. M.
          2016, <em>The Astronomical Journal</em>, 152, 157.
        </li>
        <li>
          <strong>HyperLeda</strong> — {d.sources.hyperleda}
        </li>
        <li>
          <strong>NED / Simbad</strong> — {d.sources.nedSimbad}
        </li>
        <li>
          <strong>
            Moustakas, J., Kennicutt, R. C., Jr., Tremonti, C. A., Dale, D. A., Smith, J.-D. T., &amp;
            Calzetti, D. 2010
          </strong>
          , "Optical Spectroscopy and Nebular Oxygen Abundances of the Spitzer/SINGS Galaxies",{" "}
          <em>ApJS</em>, 190, 233 — {d.sources.moustakas}
        </li>
        <li>
          <strong>Pilyugin, L. S., Grebel, E. K., &amp; Kniazev, A. Y. 2014</strong>, "The Abundance
          Properties of Nearby Late-Type Galaxies. I. The Data", <em>AJ</em>, 147, 131 —{" "}
          {d.sources.pilyugin}
        </li>
        <li>
          <strong>Leroy, A. K., et al. 2019</strong>, "A z=0 Multiwavelength Galaxy Synthesis. I. A WISE
          and GALEX Atlas of Local Galaxies", <em>ApJS</em>, 244, 24 (z0MGS) — {d.sources.z0mgs}
        </li>
        <li>
          <strong>
            Balogh, M. L., Morris, S. L., Yee, H. K. C., Carlberg, R. G., &amp; Ellingson, E. 1999
          </strong>
          , <em>ApJ</em>, 527, 54; {d.sources.andConnector}{" "}
          <strong>Worthey, G., &amp; Ottaviani, D. L. 1997</strong>, <em>ApJS</em>, 111, 377 —{" "}
          {d.sources.dn4000Hdelta}
        </li>
      </ul>
    </section>
  );
}
