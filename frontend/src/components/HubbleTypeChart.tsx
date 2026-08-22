import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Layout, PlotData } from "plotly.js-dist-min";
import type { GalaxySummary } from "../types";
import { HUBBLE_TYPE_LABELS, hubbleTypeLabel } from "../utils/format";

interface HubbleTypeChartProps {
  galaxies: GalaxySummary[];
  onPointClick: (pgcId: number) => void;
  loading: boolean;
}

const TYPE_ORDER = Object.keys(HUBBLE_TYPE_LABELS)
  .map(Number)
  .sort((a, b) => a - b)
  .map((t) => HUBBLE_TYPE_LABELS[t]);

export function HubbleTypeChart({ galaxies, onPointClick, loading }: HubbleTypeChartProps) {
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

  const layout: Partial<Layout> = {
    autosize: true,
    margin: { l: 55, r: 20, t: 30, b: 45 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { color: "#e8e8f0", family: "Inter, system-ui, sans-serif", size: 12 },
    xaxis: {
      title: { text: "Tipo de Hubble (T)" },
      categoryorder: "array",
      categoryarray: TYPE_ORDER,
      gridcolor: "#26262f",
      color: "#9a9aad",
    },
    yaxis: {
      title: { text: "Fracción de materia oscura (f_DM)" },
      range: [0, 1],
      gridcolor: "#26262f",
      color: "#9a9aad",
    },
    showlegend: false,
  };

  return (
    <div className="panel">
      <div className="panel-title-row">
        <h2>f_DM por tipo de Hubble (proxy morfológico de edad)</h2>
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
