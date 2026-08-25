import { useState } from "react";
import { Footer } from "./components/Footer";
import { GalaxyDetailDrawer } from "./components/GalaxyDetailDrawer";
import { NavBar } from "./components/NavBar";
import { useRoute } from "./hooks/useRoute";
import { GalaxiesPage } from "./pages/GalaxiesPage";
import { HomePage } from "./pages/HomePage";

/** Thin router: swaps page content by path, keeps NavBar/Footer/
 * GalaxyDetailDrawer shared across both pages (selectedPgcId is lifted
 * here so GalaxiesPage's image modal can also open the same detail
 * drawer the home page's charts use). */
export default function App() {
  const { path, navigateTo } = useRoute();
  const [selectedPgcId, setSelectedPgcId] = useState<number | null>(null);

  return (
    <div className="app-shell">
      <NavBar navigateTo={navigateTo} />

      {path === "/galaxies" ? (
        <GalaxiesPage onPointClick={setSelectedPgcId} />
      ) : (
        <HomePage onPointClick={setSelectedPgcId} />
      )}

      <Footer />

      <GalaxyDetailDrawer pgcId={selectedPgcId} onClose={() => setSelectedPgcId(null)} />
    </div>
  );
}
