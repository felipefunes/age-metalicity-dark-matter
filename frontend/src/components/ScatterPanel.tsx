import { useMemo } from "react";
import Plot from "react-plotly.js";
import type { Layout, PlotData } from "plotly.js-dist-min";
import { useLocale } from "../i18n/LocaleContext";
import type { CorrelationResponse, GalaxySummary, ScatterAxis } from "../types";
import { formatPValue } from "../utils/format";
import { axisError, axisValue, isLogAxis } from "../utils/galaxyFields";
import { fitLinearRegression } from "../utils/regression";

interface ScatterPanelProps {
  galaxies: GalaxySummary[];
  xAxis: ScatterAxis;
  yAxis: ScatterAxis;
  correlation: CorrelationResponse | null;
  controlForMass: boolean;
  onControlForMassChange: (value: boolean) => void;
  onPointClick: (pgcId: number) => void;
  loading: boolean;
  error: string | null;
}

const MARKER_SIZE = 8;
const COLORSCALE: [number, string][] = [
  [0, "#a78bfa"],
  [0.5, "#7dd3fc"],
  [1, "#22d3ee"],
];

export function ScatterPanel({
  galaxies,
  xAxis,
  yAxis,
  correlation,
  controlForMass,
  onControlForMassChange,
  onPointClick,
  loading,
  error,
}: ScatterPanelProps) {
  const { t } = useLocale();
  const d = t((dict) => dict);
  const axisLabel = (axis: ScatterAxis) => d.axis[axis].label;
  const axisSource = (axis: ScatterAxis) => d.axis[axis].source;

  const points = useMemo(() => {
    return galaxies
      .map((g) => ({
        galaxy: g,
        x: axisValue(g, xAxis),
        y: axisValue(g, yAxis),
        xErr: axisError(g, xAxis),
        yErr: axisError(g, yAxis),
        mass: g.l36,
      }))
      .filter((p) => p.x !== null && p.y !== null && p.mass !== null && p.mass > 0) as {
      galaxy: GalaxySummary;
      x: number;
      y: number;
      xErr: number | null;
      yErr: number | null;
      mass: number;
    }[];
  }, [galaxies, xAxis, yAxis]);

  const xLog = isLogAxis(xAxis);
  const yLog = isLogAxis(yAxis);

  const regression = useMemo(() => {
    if (points.length < 3) return null;
    const xs = points.map((p) => (xLog ? Math.log10(p.x) : p.x));
    const ys = points.map((p) => p.y);
    return fitLinearRegression(xs, ys);
  }, [points, xLog]);

  const { traces, layout } = useMemo(() => {
    const scatterTrace: Partial<PlotData> = {
      type: "scatter",
      mode: "markers",
      name: "Galaxias",
      x: points.map((p) => p.x),
      y: points.map((p) => p.y),
      customdata: points.map((p) => [
        p.galaxy.name_sparc,
        p.galaxy.pgc_id,
        d.matchMethod[p.galaxy.match_method],
      ]),
      marker: {
        size: MARKER_SIZE,
        color: points.map((p) => Math.log10(p.mass)),
        colorscale: COLORSCALE,
        colorbar: {
          title: { text: "log₁₀ L[3.6]", side: "right", font: { color: "#9a9aad", size: 10 } },
          thickness: 14,
          outlinewidth: 0,
          tickfont: { color: "#9a9aad", size: 10 },
        },
        line: { width: 0 },
      },
      error_y: points.some((p) => p.yErr !== null)
        ? {
            type: "data",
            array: points.map((p) => p.yErr ?? 0),
            visible: true,
            color: "rgba(154, 154, 173, 0.5)",
            thickness: 1,
            width: 0,
          }
        : undefined,
      error_x: points.some((p) => p.xErr !== null)
        ? {
            type: "data",
            array: points.map((p) => p.xErr ?? 0),
            visible: true,
            color: "rgba(154, 154, 173, 0.5)",
            thickness: 1,
            width: 0,
          }
        : undefined,
      hovertemplate:
        "<b>%{customdata[0]}</b> (PGC %{customdata[1]})<br>" +
        `${axisLabel(xAxis)}: %{x}<br>` +
        `${axisLabel(yAxis)}: %{y}<br>` +
        `${d.chart.hoverCrossLabel} %{customdata[2]}<extra></extra>`,
    };

    const allTraces: Partial<PlotData>[] = [];

    if (regression) {
      const xDataMin = Math.min(...points.map((p) => p.x));
      const xDataMax = Math.max(...points.map((p) => p.x));
      const steps = 40;
      const fitXs: number[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = xDataMin + ((xDataMax - xDataMin) * i) / steps;
        fitXs.push(t);
      }
      const regressionInput = fitXs.map((t) => (xLog ? Math.log10(t) : t));
      const fitYs = regressionInput.map((t) => regression.predict(t));
      const bandLower = regressionInput.map((t) => regression.confidenceBand(t)[0]);
      const bandUpper = regressionInput.map((t) => regression.confidenceBand(t)[1]);

      allTraces.push({
        type: "scatter",
        mode: "lines",
        x: fitXs,
        y: bandLower,
        line: { width: 0 },
        showlegend: false,
        hoverinfo: "skip",
        name: "IC 95% (inferior)",
      });
      allTraces.push({
        type: "scatter",
        mode: "lines",
        x: fitXs,
        y: bandUpper,
        fill: "tonexty",
        fillcolor: "rgba(34, 211, 238, 0.12)",
        line: { width: 0 },
        showlegend: false,
        hoverinfo: "skip",
        name: "IC 95%",
      });
      allTraces.push({
        type: "scatter",
        mode: "lines",
        x: fitXs,
        y: fitYs,
        line: { color: "#22d3ee", width: 1.5, dash: "solid" },
        name: "Regresión lineal",
        hoverinfo: "skip",
      });
    }

    allTraces.push(scatterTrace);

    const annotationText = correlation
      ? `${controlForMass ? d.chart.spearmanPartialMass : d.chart.spearman}: ` +
        `ρ = ${correlation.coefficient !== null ? correlation.coefficient.toFixed(3) : "—"}, ` +
        `${formatPValue(correlation.p_value)}, n = ${correlation.n}`
      : "";

    const plotLayout: Partial<Layout> = {
      autosize: true,
      margin: { l: 60, r: 20, t: 30, b: 55 },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { color: "#e8e8f0", family: "Inter, system-ui, sans-serif", size: 12 },
      xaxis: {
        title: { text: `${axisLabel(xAxis)}${xLog ? d.chart.scatterLogSuffix : ""}` },
        type: xLog ? "log" : "linear",
        gridcolor: "#26262f",
        zerolinecolor: "#26262f",
        color: "#9a9aad",
      },
      yaxis: {
        title: { text: axisLabel(yAxis) },
        type: yLog ? "log" : "linear",
        range: yAxis === "dm_fraction" ? [0, 1] : undefined,
        gridcolor: "#26262f",
        zerolinecolor: "#26262f",
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

    return { traces: allTraces, layout: plotLayout };
  }, [points, xAxis, yAxis, xLog, yLog, regression, correlation, controlForMass, d]);

  return (
    <div className="panel">
      <div className="panel-title-row">
        <h2>
          {axisLabel(yAxis)} vs. {axisLabel(xAxis)}
        </h2>
        <label className="control-toggle">
          <input
            type="checkbox"
            checked={controlForMass}
            onChange={(e) => onControlForMassChange(e.target.checked)}
          />
          {d.chart.controlForMass}
        </label>
      </div>
      <p className="panel-hint">{d.chart.scatterHint}</p>

      {error && (
        <div className="status-text error">
          {d.chart.errorPrefix}: {error}
        </div>
      )}
      {!error && loading && <div className="status-text">{d.common.loading}</div>}
      {!error && !loading && points.length === 0 && (
        <div className="status-text">{d.chart.scatterEmptyState(axisLabel(xAxis), axisLabel(yAxis))}</div>
      )}
      {!error && !loading && points.length > 0 && (
        <Plot
          data={traces}
          layout={layout}
          config={{ displaylogo: false, responsive: true }}
          style={{ width: "100%", height: "480px" }}
          onClick={(evt) => {
            const point = evt.points?.[0];
            const customdata = point?.customdata as unknown as [string, number, string] | undefined;
            if (customdata) onPointClick(customdata[1]);
          }}
        />
      )}

      <div className="chart-footer">
        <span>
          {d.chart.sourcePrefix} SPARC (Lelli, McGaugh &amp; Schombert 2016)
          {Array.from(new Set([axisSource(xAxis), axisSource(yAxis)].filter(Boolean))).map(
            (source) => ` · ${source}`,
          )}
        </span>
        <span>{d.chart.nPlotted(points.length)}</span>
      </div>
    </div>
  );
}
