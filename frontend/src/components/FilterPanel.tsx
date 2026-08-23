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

const MATCH_METHODS: MatchMethod[] = ["name_match", "coordinate_match"];

function formatMass(value: number): string {
  return value.toFixed(2);
}

export function FilterPanel({ state, update, onClose, galaxies }: FilterPanelProps) {
  const massDomain = useMassDomain();
  const { t } = useLocale();
  const d = t((dict) => dict);

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
          {d.common.close} ✕
        </button>
      </div>

      <div className="filter-group">
        <h3>{d.filter.axesTitle}</h3>
        <p className="filter-hint">{d.filter.axesHint}</p>
        <div className="filter-row">
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              {d.filter.xAxisLabel}
            </div>
            <select value={state.xAxis} onChange={(e) => update({ xAxis: e.target.value as ScatterAxis })}>
              {SCATTER_AXIS_OPTIONS.map((axis) => (
                <option key={axis} value={axis}>
                  {d.axis[axis].label} (n={axisCounts[axis]})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="filter-row">
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
              {d.filter.yAxisLabel}
            </div>
            <select value={state.yAxis} onChange={(e) => update({ yAxis: e.target.value as ScatterAxis })}>
              {SCATTER_AXIS_OPTIONS.map((axis) => (
                <option key={axis} value={axis}>
                  {d.axis[axis].label} (n={axisCounts[axis]})
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="filter-group">
        <h3>
          {d.filter.massTitlePrefix} — L[3.6] (10⁹ L☉)
        </h3>
        <p className="filter-hint">{d.filter.massHint}</p>
        {!massDomain.loading && (
          <DualRangeSlider
            domainMin={massDomain.min}
            domainMax={massDomain.max}
            valueMin={state.massMin ?? massDomain.min}
            valueMax={state.massMax ?? massDomain.max}
            step={(massDomain.max - massDomain.min) / 200 || 0.01}
            formatValue={formatMass}
            onChange={(min, max) => update({ massMin: min, massMax: max })}
            ariaLabelMin={d.filter.massAriaLabelMin}
            ariaLabelMax={d.filter.massAriaLabelMax}
          />
        )}
      </div>

      <div className="filter-group">
        <h3>{d.filter.qualityTitle}</h3>
        <p className="filter-hint">{d.filter.qualityHint}</p>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={state.excludeLowQuality}
            onChange={(e) => update({ excludeLowQuality: e.target.checked })}
          />
          {d.filter.excludeLowQuality}
        </label>
      </div>

      <div className="filter-group">
        <h3>{d.filter.matchMethodTitle}</h3>
        <p className="filter-hint">{d.filter.matchMethodHint}</p>
        <div className="match-method-group">
          {MATCH_METHODS.map((method) => (
            <label className="filter-checkbox" key={method}>
              <input
                type="checkbox"
                checked={state.matchMethods.includes(method)}
                onChange={() => toggleMatchMethod(method)}
              />
              {d.matchMethod[method]}
            </label>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <h3>{d.filter.ageTitle}</h3>
        <p className="filter-hint">{d.filter.ageHint}</p>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={state.requireAge}
            onChange={(e) => update({ requireAge: e.target.checked })}
          />
          {d.filter.requireAge}
        </label>
      </div>

      <button className="reset-filters" onClick={resetFilters}>
        {d.filter.resetButton}
      </button>
    </div>
  );
}
