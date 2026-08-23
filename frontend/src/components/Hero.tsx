import { useLocale } from "../i18n/LocaleContext";

export function Hero() {
  const { t } = useLocale();
  const d = t((dict) => dict);

  return (
    <header className="hero">
      <div className="hero__inner">
        <h1 className="hero__title">{d.common.siteTitle}</h1>
        <p className="hero__lead">{d.hero.leadQuestion}</p>
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
        <p className="hero__disclaimer">{d.hero.disclaimer}</p>
      </div>
    </header>
  );
}
