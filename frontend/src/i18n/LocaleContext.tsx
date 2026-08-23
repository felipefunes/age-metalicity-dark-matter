import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Dictionary } from "./dictionary";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { pt } from "./locales/pt";

export type SupportedLocale = "en" | "es" | "pt";

const DICTIONARIES: Record<SupportedLocale, Dictionary> = { en, es, pt };
const SUPPORTED_LOCALES: SupportedLocale[] = ["en", "es", "pt"];
const STORAGE_KEY = "dm-locale";

function isSupportedLocale(value: string): value is SupportedLocale {
  return (SUPPORTED_LOCALES as string[]).includes(value);
}

/** Matches the primary subtag of each of navigator.languages (e.g. "pt-BR"
 * -> "pt", "es-AR" -> "es") against the supported set, in the browser's own
 * preference order. Falls back to English if nothing matches. */
function detectBrowserLocale(): SupportedLocale {
  const candidates =
    navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language];
  for (const tag of candidates) {
    const primary = tag.split("-")[0]?.toLowerCase();
    if (primary && isSupportedLocale(primary)) return primary;
  }
  return "en";
}

function initialLocale(): SupportedLocale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isSupportedLocale(stored)) return stored;
  } catch {
    /* private browsing / storage disabled: fall through to detection */
  }
  return detectBrowserLocale();
}

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  /** Selector-style access (e.g. t(d => d.common.loading)) instead of
   * string-key lookup -- a typo is a normal TS property-access error, and
   * renames work with standard rename-symbol tooling. */
  t: <T,>(select: (dict: Dictionary) => T) => T;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale);
  const dict = DICTIONARIES[locale];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = dict.common.siteTitle;
  }, [locale, dict]);

  function setLocale(next: SupportedLocale) {
    setLocaleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private browsing / storage disabled: locale still works in-memory */
    }
  }

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: (select) => select(dict) }),
    [locale, dict],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
