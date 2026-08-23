import { useState } from "react";

const STORAGE_KEY = "dm-header-expanded";

function initialExpanded(): boolean {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function Header() {
  const [expanded, setExpanded] = useState(initialExpanded);

  function toggle() {
    setExpanded((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        /* private browsing / storage disabled: state still works in-memory */
      }
      return next;
    });
  }

  return (
    <header className="site-header">
      <div className="site-header__top">
        <h1>Materia Oscura, Metalicidad y Edad Galáctica</h1>
        <button
          className="site-header__toggle"
          onClick={toggle}
          aria-expanded={expanded}
          aria-controls="site-header-body"
        >
          {expanded ? "Colapsar ▲" : "Expandir ▼"}
        </button>
      </div>

      {expanded && (
        <div id="site-header-body" className="site-header__body">
          <p>
            Esta herramienta cruza datos públicos de cinemática galáctica (
            <a href="http://astroweb.case.edu/SPARC/" target="_blank" rel="noreferrer">
              SPARC
            </a>
            ) con metalicidad y edad estelar de catálogos externos (HyperLeda, NED), resueltos a un
            identificador canónico PGC por galaxia.
          </p>
          <p>
            El objetivo es explorar si existe correlación entre la fracción de materia oscura de una
            galaxia y su metalicidad o edad, <strong>controlando por masa</strong> — porque una
            correlación cruda entre metalicidad y materia oscura puede ser espuria si ambas dependen
            de la masa de la galaxia.
          </p>
          <p className="disclaimer">
            Es una herramienta exploratoria, no una fuente con conclusiones validadas por revisión de
            pares.
          </p>

          <div className="site-header__sources">
            <h2>Fuentes de datos</h2>
            <ul>
              <li>
                <strong>SPARC</strong> — cinemática, tipo de Hubble, luminosidad [3.6μm], masa de HI.
                Lelli, F., McGaugh, S. S., &amp; Schombert, J. M. 2016,{" "}
                <em>The Astronomical Journal</em>, 152, 157.
              </li>
              <li>
                <strong>HyperLeda</strong> — parámetros extragalácticos por objeto (metalicidad/edad
                cuando están disponibles).
              </li>
              <li>
                <strong>NED / Simbad</strong> — resolución de identidad a PGC (por nombre o, si falla,
                por coordenadas).
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
