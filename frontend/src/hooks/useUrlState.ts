import { useCallback, useState } from "react";
import type { MatchMethod, ScatterAxis } from "../types";
import { SCATTER_AXIS_OPTIONS } from "../utils/format";

export interface AppState {
  massMin: number | null;
  massMax: number | null;
  excludeLowQuality: boolean;
  matchMethods: MatchMethod[];
  requireAge: boolean;
  xAxis: ScatterAxis;
  yAxis: ScatterAxis;
  controlForMass: boolean;
}

const DEFAULT_STATE: AppState = {
  massMin: null,
  massMax: null,
  excludeLowQuality: false,
  matchMethods: ["name_match", "coordinate_match"],
  requireAge: false,
  xAxis: "metallicity",
  yAxis: "dm_fraction",
  controlForMass: false,
};

function parseState(search: string): AppState {
  const params = new URLSearchParams(search);
  const massMin = params.get("mass_min");
  const massMax = params.get("mass_max");
  const matchMethodParam = params.get("match_method");
  const xAxis = params.get("x");
  const yAxis = params.get("y");

  return {
    massMin: massMin !== null ? Number(massMin) : null,
    massMax: massMax !== null ? Number(massMax) : null,
    excludeLowQuality: params.get("exclude_low_quality") === "true",
    matchMethods: matchMethodParam
      ? (matchMethodParam.split(",").filter((m): m is MatchMethod =>
          m === "name_match" || m === "coordinate_match",
        ) as MatchMethod[])
      : DEFAULT_STATE.matchMethods,
    requireAge: params.get("require_age") === "true",
    xAxis: xAxis && SCATTER_AXIS_OPTIONS.includes(xAxis as ScatterAxis) ? (xAxis as ScatterAxis) : DEFAULT_STATE.xAxis,
    yAxis: yAxis && SCATTER_AXIS_OPTIONS.includes(yAxis as ScatterAxis) ? (yAxis as ScatterAxis) : DEFAULT_STATE.yAxis,
    controlForMass: params.get("control_for_mass") === "true",
  };
}

function stateToSearch(state: AppState): string {
  const params = new URLSearchParams();
  if (state.massMin !== null) params.set("mass_min", String(state.massMin));
  if (state.massMax !== null) params.set("mass_max", String(state.massMax));
  if (state.excludeLowQuality) params.set("exclude_low_quality", "true");
  if (state.matchMethods.length > 0 && state.matchMethods.length < 2) {
    params.set("match_method", state.matchMethods.join(","));
  }
  if (state.requireAge) params.set("require_age", "true");
  if (state.xAxis !== DEFAULT_STATE.xAxis) params.set("x", state.xAxis);
  if (state.yAxis !== DEFAULT_STATE.yAxis) params.set("y", state.yAxis);
  if (state.controlForMass) params.set("control_for_mass", "true");
  return params.toString();
}

/** App filter/axis state, synced bidirectionally with the URL query string
 * so any view can be shared via link (back/forward navigation also works
 * since we push history entries). */
export function useUrlState(): [AppState, (update: Partial<AppState>) => void] {
  const [state, setState] = useState<AppState>(() => parseState(window.location.search));

  const update = useCallback((partial: Partial<AppState>) => {
    setState((prev) => {
      const next = { ...prev, ...partial };
      const search = stateToSearch(next);
      const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
      window.history.replaceState(null, "", url);
      return next;
    });
  }, []);

  return [state, update];
}
