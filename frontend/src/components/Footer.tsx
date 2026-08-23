import { useLocale } from "../i18n/LocaleContext";

const REPO_URL = "https://github.com/felipefunes/age-metalicity-dark-matter";

export function Footer() {
  const { t } = useLocale();
  const d = t((dict) => dict);

  return (
    <footer className="site-footer">
      <span>
        {d.footer.openSourceText}{" "}
        <a href={REPO_URL} target="_blank" rel="noreferrer">
          GitHub
        </a>
        .
      </span>
      <span>{d.footer.licenseNote}</span>
    </footer>
  );
}
