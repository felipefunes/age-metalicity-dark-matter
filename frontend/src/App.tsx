import { useState } from "react";
import { Footer } from "./components/Footer";
import { GalaxyDetailDrawer } from "./components/GalaxyDetailDrawer";
import { NavBar } from "./components/NavBar";
import { HomePage } from "./pages/HomePage";

/** Still just HomePage for now -- becomes a real router (via the new
 * useRoute.ts) in the next commit, once GalaxiesPage exists to route
 * "/galaxies" to. This commit only extracts HomePage's content out of
 * App.tsx with no behavior change, to keep that next commit focused. */
export default function App() {
  const [selectedPgcId, setSelectedPgcId] = useState<number | null>(null);

  return (
    <div className="app-shell">
      <NavBar />

      <HomePage onPointClick={setSelectedPgcId} />

      <Footer />

      <GalaxyDetailDrawer pgcId={selectedPgcId} onClose={() => setSelectedPgcId(null)} />
    </div>
  );
}
