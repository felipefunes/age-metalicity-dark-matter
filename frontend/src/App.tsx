import { useState } from "react";
import { FilterPanel } from "./components/FilterPanel";
import { GalaxyDetailDrawer } from "./components/GalaxyDetailDrawer";
import { HubbleTypeChart } from "./components/HubbleTypeChart";
import { NavBar } from "./components/NavBar";
import { ScatterPanel } from "./components/ScatterPanel";
import type { GalaxyFilters } from "./api";
import { useCorrelation } from "./hooks/useCorrelation";
import { useGalaxies } from "./hooks/useGalaxies";
import { useLocale } from "./i18n/LocaleContext";
import { useUrlState } from "./hooks/useUrlState";

export default function App() {
  const [state, update] = useUrlState();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedPgcId, setSelectedPgcId] = useState<number | null>(null);
  const { t } = useLocale();
  const d = t((dict) => dict);

  const filters: GalaxyFilters = {
    massMin: state.massMin,
    massMax: state.massMax,
    excludeLowQuality: state.excludeLowQuality,
    matchMethods: state.matchMethods,
    requireAge: state.requireAge,
  };

  const { galaxies, loading, error } = useGalaxies(filters);

  const correlation = useCorrelation(
    state.xAxis,
    state.yAxis,
    filters,
    state.controlForMass ? "mass" : null,
  );

  return (
    <div className="app-shell">
      <NavBar />

      <section id="datos" className="app-body">
        <button
          className="mobile-drawer-toggle reset-filters"
          style={{ position: "fixed", bottom: 16, right: 16, zIndex: 30, width: "auto" }}
          onClick={() => setSidebarOpen(true)}
        >
          {d.filter.mobileToggle} ☰
        </button>

        {/* Always visible on desktop; on narrow screens CSS hides it unless
            sidebar--open is set (toggled by the floating filter-toggle button). */}
        <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
          <FilterPanel
            state={state}
            update={update}
            onClose={() => setSidebarOpen(false)}
            galaxies={galaxies}
          />
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

          <HubbleTypeChart
            galaxies={galaxies}
            filters={filters}
            controlForMass={state.controlForMass}
            onControlForMassChange={(value) => update({ controlForMass: value })}
            onPointClick={setSelectedPgcId}
            loading={loading}
          />
        </main>
      </section>

      <GalaxyDetailDrawer pgcId={selectedPgcId} onClose={() => setSelectedPgcId(null)} />
    </div>
  );
}
