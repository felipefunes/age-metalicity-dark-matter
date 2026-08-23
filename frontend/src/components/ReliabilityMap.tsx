import { useLocale } from "../i18n/LocaleContext";

/** Always-visible summary of how much to trust each variable -- sits
 * between the Hero and the interactive #datos section, deliberately
 * outside the collapsed-by-default "how does this work" details, since
 * it's the fastest way to communicate confidence and shouldn't require a
 * click to see. No statistical jargon (Spearman/p-value stay in the
 * findings docs) -- see README.md's own copy of this same table. */
export function ReliabilityMap() {
  const { t } = useLocale();
  const d = t((dict) => dict);

  return (
    <section className="reliability">
      <div className="reliability__inner">
        <h2 className="reliability__heading">{d.reliability.heading}</h2>
        <div className="reliability__table-wrap">
          <table className="reliability__table">
            <thead>
              <tr>
                <th>{d.reliability.columnVariable}</th>
                <th>{d.reliability.columnMeasures}</th>
                <th>{d.reliability.columnCoverage}</th>
                <th>{d.reliability.columnConfidence}</th>
              </tr>
            </thead>
            <tbody>
              {d.reliability.rows.map((row) => (
                <tr key={row.variable}>
                  <td>{row.variable}</td>
                  <td>{row.measures}</td>
                  <td>{row.coverage}</td>
                  <td>{row.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="reliability__note">{d.reliability.fourVariablesNote}</p>
      </div>
    </section>
  );
}
