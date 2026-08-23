import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Layout, PlotData } from "plotly.js-dist-min";
import type { GalaxyFilters } from "../api";
import { useLocale } from "../i18n/LocaleContext";
import { useCorrelation } from "../hooks/useCorrelation";
import type { CorrelationResponse, GalaxySummary } from "../types";
import { HUBBLE_TYPE_LABELS, formatPValue, hubbleTypeLabel } from "../utils/format";

interface HubbleTypeChartProps {
  galaxies: GalaxySummary[];
  filters: GalaxyFilters;
  /** This is this project's most solid finding (see README's reliability
   * map), and the point of it is precisely that controlling for mass
   * flips the conclusion -- so the annotation always shows both the raw
   * and mass-controlled Spearman results together, regardless of this
   * toggle's value. It still exists (default true, see useUrlState.ts)
   * for whoever wants to hide/show the checkbox state itself, but it no
   * longer gates which correlation gets fetched or displayed. */
  controlForMass: boolean;
  onControlForMassChange: (value: boolean) => void;
  onPointClick: (pgcId: number) => void;
  loading: boolean;
}

const TYPE_ORDER = Object.keys(HUBBLE_TYPE_LABELS)
  .map(Number)
  .sort((a, b) => a - b)
  .map((t) => HUBBLE_TYPE_LABELS[t]);

export function HubbleTypeChart({
  galaxies,
  filters,
  controlForMass,
  onControlForMassChange,
  onPointClick,
  loading,
}: HubbleTypeChartProps) {
  const { t } = useLocale();
  const d = t((dict) => dict);
  const rawCorrelation = useCorrelation("hubble_type", "dm_fraction", filters, null);
  const massCorrelation = useCorrelation("hubble_type", "dm_fraction", filters, "mass");

  const points = useMemo(
    () => galaxies.filter((g) => g.T !== null && g.f_dm !== null),
    [galaxies],
  );

  const trace: Partial<PlotData> = {
    type: "box",
    x: points.map((g) => hubbleTypeLabel(g.T)),
    y: points.map((g) => g.f_dm as number),
    customdata: points.map((g) => [g.name_sparc, g.pgc_id]),
    boxpoints: "all",
    jitter: 0.5,
    pointpos: 0,
    marker: { color: "#a78bfa", size: 5, opacity: 0.7 },
    line: { color: "#22d3ee" },
    fillcolor: "rgba(34, 211, 238, 0.08)",
    hovertemplate: "<b>%{customdata[0]}</b> (PGC %{customdata[1]})<br>f_DM: %{y}<extra></extra>",
  };

  function formatStat(result: CorrelationResponse | null): string {
    if (!result || result.coefficient === null) return "—";
    const suffix = result.p_value !== null && result.p_value > 0.05 ? " (n.s.)" : "";
    return `ρ = ${result.coefficient.toFixed(3)}, ${formatPValue(result.p_value)}${suffix}`;
  }

  const annotationText =
    rawCorrelation.result && massCorrelation.result
      ? `${d.chart.hubbleRawStatLabel}: ${formatStat(rawCorrelation.result)} · ` +
        `${d.chart.hubbleMassStatLabel}: ${formatStat(massCorrelation.result)}`
      : "";

  const layout: Partial<Layout> = {
    autosize: true,
    margin: { l: 55, r: 20, t: 30, b: 45 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#e8e8f0", family: "Inter, system-ui, sans-serif", size: 12 },
    xaxis: {
      title: { text: d.axis.hubble_type.label },
      categoryorder: "array",
      categoryarray: TYPE_ORDER,
      gridcolor: "#26262f",
      color: "#9a9aad",
    },
    yaxis: {
      title: { text: d.axis.dm_fraction.label },
      range: [0, 1],
      gridcolor: "#26262f",
      color: "#9a9aad",
    },
    showlegend: false,
    annotations: annotationText
      ? [
          {
            text: annotationText,
            xref: "paper",
            yref: "paper",
            x: 0.02,
            y: 0.98,
            xanchor: "left",
            yanchor: "top",
            showarrow: false,
            font: { family: "JetBrains Mono, monospace", size: 12, color: "#e8e8f0" },
            bgcolor: "rgba(18, 18, 24, 0.75)",
            borderpad: 6,
          },
        ]
      : [],
  };

  return (
    <div className="panel">
      <div className="panel-title-row">
        <h2>{d.chart.hubbleTitle}</h2>
        <label className="control-toggle">
          <input
            type="checkbox"
            checked={controlForMass}
            onChange={(e) => onControlForMassChange(e.target.checked)}
          />
          {d.chart.controlForMass}
        </label>
      </div>
      <p className="panel-hint">{d.chart.hubbleHint}</p>
      {loading && <div className="status-text">{d.common.loading}</div>}
      {!loading && points.length === 0 && <div className="status-text">{d.chart.hubbleEmptyState}</div>}
      {!loading && points.length > 0 && (
        <Plot
          data={[trace]}
          layout={layout}
          config={{ displaylogo: false, responsive: true }}
          style={{ width: "100%", height: "380px" }}
          onClick={(evt) => {
            const point = evt.points?.[0];
            const customdata = point?.customdata as unknown as [string, number] | undefined;
            if (customdata) onPointClick(customdata[1]);
          }}
        />
      )}
      <div className="chart-footer">
        <span>
          {d.chart.sourcePrefix} SPARC (Lelli, McGaugh &amp; Schombert 2016) {d.chart.hubbleSourceSuffix}
        </span>
        <span>{d.chart.nPlotted(points.length)}</span>
      </div>
    </div>
  );
}
