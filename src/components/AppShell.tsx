import type { ReactNode } from "react";
import {
  Building2,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  MapPinned,
} from "lucide-react";
import type { View } from "../types";

const navItems: Array<{ view: View; label: string; icon: typeof LayoutDashboard }> = [
  { view: "overview", label: "Visão geral", icon: LayoutDashboard },
  { view: "units", label: "Unidades de saúde", icon: Building2 },
  { view: "map", label: "Mapa da rede", icon: MapPinned },
  { view: "technical", label: "Ficha técnica", icon: ClipboardList },
];

const titles: Record<View, { title: string; subtitle: string }> = {
  overview: { title: "Rede estadual em uma leitura", subtitle: "Cobertura, tipologia e qualidade da base consolidada." },
  units: { title: "Unidades de saúde", subtitle: "Consulte, compare e abra a ficha técnica de cada unidade." },
  map: { title: "Mapa da rede", subtitle: "Distribuição municipal das unidades, classificada por tipo." },
  technical: { title: "Ficha técnica", subtitle: "Informações assistenciais, territoriais e de gestão para impressão." },
};

type Props = {
  view: View;
  onViewChange: (view: View) => void;
  sourceLabel: string;
  children: ReactNode;
};

export function AppShell({ view, onViewChange, sourceLabel, children }: Props) {
  const current = titles[view];
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
          <p>65 unidades ativas da aba Consolidado.</p>
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
              <strong>20 ago 2026</strong>
            </div>
          </header>
          <div className="view-panel">{children}</div>
        </div>
      </main>
    </div>
  );
}
