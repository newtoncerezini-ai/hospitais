import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { AppShell } from "./components/AppShell";
import { ALL, filterUnits } from "./lib/format";
import type { DashboardData, Filters, HealthUnit, View } from "./types";
import { MapView } from "./views/MapView";
import { OverviewView } from "./views/OverviewView";
import { TechnicalSheetView } from "./views/TechnicalSheetView";
import { UnitsView } from "./views/UnitsView";

const INITIAL_FILTERS: Filters = { query: "", municipality: ALL, rd: ALL, geres: ALL, type: ALL };

export default function App() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [view, setView] = useState<View>("overview");
  const [filters, setFilters] = useState<Filters>(INITIAL_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    fetch(`${import.meta.env.BASE_URL}data/health-units.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Falha ao carregar a base (${response.status}).`);
        return response.json() as Promise<DashboardData>;
      })
      .then((payload) => {
        setData(payload);
        setSelectedId((current) => current ?? payload.units[0]?.id ?? null);
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Não foi possível carregar a base.");
      });
    return () => controller.abort();
  }, [attempt]);

  const filteredUnits = useMemo(() => data ? filterUnits(data.units, filters) : [], [data, filters]);
  const selected = data?.units.find((unit) => unit.id === selectedId) ?? data?.units[0] ?? null;

  const openUnit = (unit: HealthUnit) => {
    setSelectedId(unit.id);
    setView("technical");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  if (error) {
    return (
      <main className="load-state error-state">
        <AlertTriangle size={32} />
        <h1>A base não pôde ser carregada</h1>
        <p>{error}</p>
        <button type="button" className="button primary" onClick={() => setAttempt((value) => value + 1)}><RefreshCw size={17} /> Tentar novamente</button>
      </main>
    );
  }

  if (!data || !selected) {
    return <main className="load-state"><span className="loading-mark" aria-hidden="true" /><h1>Preparando a rede de saúde</h1><p>Organizando unidades, territórios e fichas técnicas.</p></main>;
  }

  return (
    <AppShell view={view} onViewChange={setView} sourceLabel={data.meta.sourceLabel}>
      {view === "overview" && <OverviewView data={data} onNavigate={setView} />}
      {view === "units" && <UnitsView data={data} units={filteredUnits} filters={filters} onFiltersChange={setFilters} onOpenUnit={openUnit} />}
      {view === "map" && <MapView data={data} units={filteredUnits} filters={filters} onFiltersChange={setFilters} onOpenUnit={openUnit} />}
      {view === "technical" && <TechnicalSheetView units={data.units} selected={selected} onSelect={setSelectedId} />}
    </AppShell>
  );
}
