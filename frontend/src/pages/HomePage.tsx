import { useState } from "react";
import { FilterPanel } from "../components/FilterPanel";
import { Hero } from "../components/Hero";
import { HubbleTypeChart } from "../components/HubbleTypeChart";
import { ReliabilityMap } from "../components/ReliabilityMap";
import { ScatterPanel } from "../components/ScatterPanel";
import { SourcesSection } from "../components/SourcesSection";
import type { GalaxyFilters } from "../api";
import { useCorrelation } from "../hooks/useCorrelation";
import { useGalaxies } from "../hooks/useGalaxies";
import { useLocale } from "../i18n/LocaleContext";
import { useUrlState } from "../hooks/useUrlState";

interface HomePageProps {
  onPointClick: (pgcId: number) => void;
}

/** Everything that used to be directly in App.tsx -- moved verbatim, no
 * behavior change, just extracted so App.tsx can switch between this and
 * GalaxiesPage.tsx via the new hand-rolled router (useRoute.ts). NavBar,
 * Footer, and GalaxyDetailDrawer stay lifted in App.tsx since they're
 * shared chrome across both pages. */
export function HomePage({ onPointClick }: HomePageProps) {
  const [state, update] = useUrlState();
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    state.controlForMassScatter ? "mass" : null,
  );

  return (
    <>
      <Hero />
      <ReliabilityMap />

      <section id="datos" className="app-section">
        <div className="app-body">
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
              controlForMass={state.controlForMassScatter}
              onControlForMassChange={(value) => update({ controlForMassScatter: value })}
              onPointClick={onPointClick}
              loading={loading}
              error={error}
            />

            <HubbleTypeChart galaxies={galaxies} filters={filters} onPointClick={onPointClick} loading={loading} />
          </main>
        </div>
      </section>

      <SourcesSection />
    </>
  );
}
