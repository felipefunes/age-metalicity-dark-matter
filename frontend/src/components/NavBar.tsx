import type { MouseEvent } from "react";
import { useLocale, type SupportedLocale } from "../i18n/LocaleContext";

const LOCALE_OPTIONS: { value: SupportedLocale; label: string }[] = [
  { value: "es", label: "ES" },
  { value: "en", label: "EN" },
  { value: "pt", label: "PT" },
];

/** Provisional abstract "orbit" mark -- two crossing elliptical orbits
 * around a bright nucleus, in the app's existing accent colors. Inline
 * (not /logo.svg) so it renders with zero extra network requests; a
 * standalone copy is added to public/ later for the favicon/OG tags. */
function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" width="28" height="28" role="img" aria-hidden="true">
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5.5"
        transform="rotate(-20 16 16)"
        fill="none"
        stroke="#22d3ee"
        strokeWidth="1.6"
      />
      <ellipse
        cx="16"
        cy="16"
        rx="13"
        ry="5.5"
        transform="rotate(45 16 16)"
        fill="none"
        stroke="#a78bfa"
        strokeWidth="1.6"
        opacity={0.85}
      />
      <circle cx="16" cy="16" r="3.2" fill="#e8e8f0" />
      <circle cx="26.5" cy="11.2" r="1.6" fill="#22d3ee" />
    </svg>
  );
}

interface NavBarProps {
  navigateTo: (href: string) => void;
}

export function NavBar({ navigateTo }: NavBarProps) {
  const { t, locale, setLocale } = useLocale();
  const d = t((dict) => dict);

  function link(href: string) {
    return (e: MouseEvent) => {
      e.preventDefault();
      navigateTo(href);
    };
  }

  return (
    <nav className="navbar">
      <button type="button" className="navbar__brand" onClick={link("/")}>
        <LogoMark />
        <span>{d.nav.brand}</span>
      </button>

      <div className="navbar__right">
        <a className="navbar__link" href="/#datos" onClick={link("/#datos")}>
          {d.nav.dataLink}
        </a>
        <a className="navbar__link" href="/galaxies" onClick={link("/galaxies")}>
          {d.nav.galaxiesLink}
        </a>
        <a className="navbar__link" href="/#fuentes" onClick={link("/#fuentes")}>
          {d.nav.sourcesLink}
        </a>
        <div className="navbar__locale" role="group" aria-label={d.nav.languageLabel}>
          {LOCALE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`navbar__locale-btn${locale === opt.value ? " navbar__locale-btn--active" : ""}`}
              aria-pressed={locale === opt.value}
              onClick={() => setLocale(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
