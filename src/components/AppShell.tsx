import type { ReactNode } from "react";
import {
  Building2,
  ClipboardList,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  MapPinned,
} from "lucide-react";
import type { View } from "../types";

const navItems: Array<{ view: View; label: string; icon: typeof LayoutDashboard }> = [
  { view: "units", label: "Unidades de saúde", icon: Building2 },
  { view: "new-units", label: "Novas unidades", icon: Hospital },
  { view: "overview", label: "Visão geral", icon: LayoutDashboard },
  { view: "map", label: "Mapa da rede", icon: MapPinned },
  { view: "technical", label: "Relatórios", icon: ClipboardList },
];

const titles: Record<View, { title: string; subtitle: string }> = {
  overview: { title: "Rede estadual em uma leitura", subtitle: "Cobertura, tipologia e qualidade da base consolidada." },
  units: { title: "Unidades de saúde", subtitle: "Consulte, compare e abra a ficha técnica de cada unidade." },
  "new-units": { title: "Novas unidades de saúde", subtitle: "Projetos em construção, capacidade prevista e cobertura territorial." },
  map: { title: "Mapa da rede", subtitle: "Distribuição municipal das unidades, classificada por tipo e status." },
  technical: { title: "Relatórios", subtitle: "Gere uma ficha individual ou o caderno completo de todas as unidades." },
};

type Props = {
  view: View;
  onViewChange: (view: View) => void;
  sourceLabel: string;
  generatedAt: string;
  totalUnits: number;
  activeUnits: number;
  constructionUnits: number;
  unitsWithoutStatus: number;
  children: ReactNode;
};

export function AppShell({ view, onViewChange, sourceLabel, generatedAt, totalUnits, activeUnits, constructionUnits, unitsWithoutStatus, children }: Props) {
  const current = titles[view];
  const formattedDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${generatedAt}T00:00:00Z`))
    .replace(" de ", " ")
    .replace(" de ", " ");
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true"><HeartPulse size={25} /></span>
          <span>
            <strong>Rede de Saúde</strong>
            <small>Pernambuco</small>
          </span>
        </div>

        <nav className="nav-list" aria-label="Navegação principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                type="button"
                className={view === item.view ? "active" : ""}
                aria-current={view === item.view ? "page" : undefined}
                onClick={() => onViewChange(item.view)}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-source">
          <span>Base de referência</span>
          <strong>{sourceLabel}</strong>
          <p>{totalUnits} unidades: {activeUnits} em funcionamento, {constructionUnits} em construção e {unitsWithoutStatus} sem status informado.</p>
        </div>
      </aside>

      <main className="main">
        <div className="content-width">
          <header className="topbar">
            <div>
              <p className="breadcrumb">Saúde / Pernambuco</p>
              <h1>{current.title}</h1>
              <p className="topbar-subtitle">{current.subtitle}</p>
            </div>
            <div className="source-stamp">
              <span>Atualização da base</span>
              <strong>{formattedDate}</strong>
            </div>
          </header>
          <div className="view-panel">{children}</div>
        </div>
      </main>
    </div>
  );
}
