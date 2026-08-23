import { useLocale } from "../i18n/LocaleContext";

export function Hero() {
  const { t } = useLocale();
  const d = t((dict) => dict);

  return (
    <header className="hero">
      <div className="hero__inner">
        <h1 className="hero__title">{d.common.siteTitle}</h1>
        <p className="hero__lead">{d.hero.leadQuestion}</p>
        <span className="hero__badge">
          <span aria-hidden="true">ⓘ</span> {d.hero.disclaimer}
        </span>

        <details className="hero__details">
          <summary>{d.hero.howItWorksSummary}</summary>
          <div className="hero__details-content">
            <p className="hero__intro">
              {d.hero.intro1Before}
              <a href="http://astroweb.case.edu/SPARC/" target="_blank" rel="noreferrer">
                SPARC
              </a>
              {d.hero.intro1After}
            </p>
            <p className="hero__intro">
              {d.hero.intro2Before}
              <strong>{d.hero.intro2Bold}</strong>
              {d.hero.intro2After}
            </p>
          </div>
        </details>
      </div>
    </header>
  );
}
