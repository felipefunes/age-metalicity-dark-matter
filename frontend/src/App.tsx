import { useState } from "react";
import { FilterPanel } from "./components/FilterPanel";
import { GalaxyDetailDrawer } from "./components/GalaxyDetailDrawer";
import { Header } from "./components/Header";
import { HubbleTypeChart } from "./components/HubbleTypeChart";
import { ScatterPanel } from "./components/ScatterPanel";
import type { GalaxyFilters } from "./api";
import { useCorrelation } from "./hooks/useCorrelation";
import { useGalaxies } from "./hooks/useGalaxies";
import { useUrlState } from "./hooks/useUrlState";
import type { ApiVariable } from "./types";

const AXIS_TO_API_VARIABLE: Record<string, ApiVariable> = {
  metallicity: "metallicity",
  age_gyr: "age_gyr",
  dm_fraction: "dm_fraction",
  mass: "mass",
  mhi: "mhi",
};

export default function App() {
  const [state, update] = useUrlState();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPgcId, setSelectedPgcId] = useState<number | null>(null);

  const filters: GalaxyFilters = {
    massMin: state.massMin,
    massMax: state.massMax,
    excludeLowQuality: state.excludeLowQuality,
    matchMethods: state.matchMethods,
    requireAge: state.requireAge,
  };

  const { galaxies, loading, error } = useGalaxies(filters);

  const correlation = useCorrelation(
    AXIS_TO_API_VARIABLE[state.xAxis],
    AXIS_TO_API_VARIABLE[state.yAxis],
    filters,
    state.controlForMass ? "mass" : null,
  );

  return (
    <div className="app-shell">
      <Header />

      <div className="app-body">
        <button
          className="mobile-drawer-toggle reset-filters"
          style={{ position: "fixed", bottom: 16, right: 16, zIndex: 30, width: "auto" }}
          onClick={() => setSidebarOpen(true)}
        >
          Filtros ☰
        </button>

        {/* Always visible on desktop; on narrow screens CSS hides it unless
            sidebar--open is set (toggled by the floating "Filtros" button). */}
        <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
          <FilterPanel state={state} update={update} onClose={() => setSidebarOpen(false)} />
        </aside>

        <main className="main-content">
          <ScatterPanel
            galaxies={galaxies}
            xAxis={state.xAxis}
            yAxis={state.yAxis}
            correlation={correlation.result}
            controlForMass={state.controlForMass}
            onControlForMassChange={(value) => update({ controlForMass: value })}
            onPointClick={setSelectedPgcId}
            loading={loading}
            error={error}
          />

          <HubbleTypeChart galaxies={galaxies} onPointClick={setSelectedPgcId} loading={loading} />
        </main>
      </div>

      <GalaxyDetailDrawer pgcId={selectedPgcId} onClose={() => setSelectedPgcId(null)} />
    </div>
  );
}
