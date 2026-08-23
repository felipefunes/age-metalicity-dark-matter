import { useMemo } from "react";
import { DualRangeSlider } from "./DualRangeSlider";
import { useLocale } from "../i18n/LocaleContext";
import { useMassDomain } from "../hooks/useMassDomain";
import type { AppState } from "../hooks/useUrlState";
import type { GalaxySummary, MatchMethod, ScatterAxis } from "../types";
import { SCATTER_AXIS_OPTIONS } from "../utils/format";
import { axisValue } from "../utils/galaxyFields";

interface FilterPanelProps {
  state: AppState;
  update: (partial: Partial<AppState>) => void;
  onClose: () => void;
  /** Currently-loaded (filtered) galaxies -- used to show a live "(n=X)"
   * coverage count per axis option, so picking an axis combination that
   * will render an empty chart is an informed choice, not a surprise. */
  galaxies: GalaxySummary[];
}

const MATCH_METHOD_OPTIONS: { value: MatchMethod; label: string }[] = [
  { value: "name_match", label: "Por nombre (Simbad)" },
  { value: "coordinate_match", label: "Por coordenadas (NED + Simbad)" },
];

function formatMass(value: number): string {
  return value.toFixed(2);
}

export function FilterPanel({ state, update, onClose, galaxies }: FilterPanelProps) {
  const massDomain = useMassDomain();
  const { t } = useLocale();

  const axisCounts = useMemo(() => {
    const counts = {} as Record<ScatterAxis, number>;
    for (const axis of SCATTER_AXIS_OPTIONS) {
      counts[axis] = galaxies.reduce((n, g) => (axisValue(g, axis) !== null ? n + 1 : n), 0);
    }
    return counts;
  }, [galaxies]);

  function toggleMatchMethod(method: MatchMethod) {
    const current = new Set(state.matchMethods);
    if (current.has(method)) {
      if (current.size === 1) return; // keep at least one selected
      current.delete(method);
    } else {
      current.add(method);
    }
    update({ matchMethods: Array.from(current) });
  }

  function resetFilters() {
    update({
      massMin: null,
      massMax: null,
      excludeLowQuality: false,
      matchMethods: ["name_match", "coordinate_match"],
      requireAge: false,
    });
  }

  return (
    <div>
      <div className="filter-row filter-panel-close" style={{ justifyContent: "flex-end" }}>
        <button className="reset-filters" style={{ width: "auto" }} onClick={onClose}>
          Cerrar ✕
        </button>
      </div>

      <div className="filter-group">
        <h3>Ejes del scatter</h3>
        <div className="filter-row">
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Eje X</div>
            <select value={state.xAxis} onChange={(e) => update({ xAxis: e.target.value as ScatterAxis })}>
              {SCATTER_AXIS_OPTIONS.map((axis) => (
                <option key={axis} value={axis}>
                  {t((d) => d.axis[axis].label)} (n={axisCounts[axis]})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-row">
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>Eje Y</div>
            <select value={state.yAxis} onChange={(e) => update({ yAxis: e.target.value as ScatterAxis })}>
              {SCATTER_AXIS_OPTIONS.map((axis) => (
                <option key={axis} value={axis}>
                  {t((d) => d.axis[axis].label)} (n={axisCounts[axis]})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="filter-group">
        <h3>Masa — L[3.6] (10⁹ L☉)</h3>
        {!massDomain.loading && (
          <DualRangeSlider
            domainMin={massDomain.min}
            domainMax={massDomain.max}
            valueMin={state.massMin ?? massDomain.min}
            valueMax={state.massMax ?? massDomain.max}
            step={(massDomain.max - massDomain.min) / 200 || 0.01}
            formatValue={formatMass}
            onChange={(min, max) => update({ massMin: min, massMax: max })}
          />
        )}
      </div>

      <div className="filter-group">
        <h3>Calidad</h3>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={state.excludeLowQuality}
            onChange={(e) => update({ excludeLowQuality: e.target.checked })}
          />
          Excluir quality_flag bajo (Q=3)
        </label>
      </div>

      <div className="filter-group">
        <h3>Método de cruce de identidad</h3>
        <div className="match-method-group">
          {MATCH_METHOD_OPTIONS.map((opt) => (
            <label className="filter-checkbox" key={opt.value}>
              <input
                type="checkbox"
                checked={state.matchMethods.includes(opt.value)}
                onChange={() => toggleMatchMethod(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h3>Edad estelar</h3>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={state.requireAge}
            onChange={(e) => update({ requireAge: e.target.checked })}
          />
          Solo galaxias con edad estelar estricta disponible
        </label>
      </div>

      <button className="reset-filters" onClick={resetFilters}>
        Restablecer filtros
      </button>
    </div>
  );
}
