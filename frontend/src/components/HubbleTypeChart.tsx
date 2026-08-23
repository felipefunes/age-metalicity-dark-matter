import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Layout, PlotData } from "plotly.js-dist-min";
import type { GalaxyFilters } from "../api";
import { useLocale } from "../i18n/LocaleContext";
import { useCorrelation } from "../hooks/useCorrelation";
import type { GalaxySummary } from "../types";
import { HUBBLE_TYPE_LABELS, formatPValue, hubbleTypeLabel } from "../utils/format";

interface HubbleTypeChartProps {
  galaxies: GalaxySummary[];
  filters: GalaxyFilters;
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
  const correlation = useCorrelation(
    "hubble_type",
    "dm_fraction",
    filters,
    controlForMass ? "mass" : null,
  );

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

  const annotationText = correlation.result
    ? `${controlForMass ? "Spearman parcial (control: masa)" : "Spearman"}: ` +
      `ρ = ${correlation.result.coefficient !== null ? correlation.result.coefficient.toFixed(3) : "—"}, ` +
      `${formatPValue(correlation.result.p_value)}, n = ${correlation.result.n}`
    : "";

  const layout: Partial<Layout> = {
    autosize: true,
    margin: { l: 55, r: 20, t: 30, b: 45 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#e8e8f0", family: "Inter, system-ui, sans-serif", size: 12 },
    xaxis: {
      title: { text: t((d) => d.axis.hubble_type.label) },
      categoryorder: "array",
      categoryarray: TYPE_ORDER,
      gridcolor: "#26262f",
      color: "#9a9aad",
    },
    yaxis: {
      title: { text: t((d) => d.axis.dm_fraction.label) },
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
        <h2>f_DM por tipo de Hubble (proxy morfológico de edad)</h2>
        <label className="control-toggle">
          <input
            type="checkbox"
            checked={controlForMass}
            onChange={(e) => onControlForMassChange(e.target.checked)}
          />
          Controlar correlación por masa
        </label>
      </div>
      {loading && <div className="status-text">Cargando…</div>}
      {!loading && points.length === 0 && (
        <div className="status-text">No hay galaxias con T y f_DM disponibles con los filtros actuales.</div>
      )}
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
        <span>Fuente: SPARC (Lelli, McGaugh &amp; Schombert 2016) — T discreto/ordinal, agrupado por tipo</span>
        <span>n = {points.length} galaxias graficadas</span>
      </div>
    </div>
  );
}
