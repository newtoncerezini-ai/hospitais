import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Info, MapPin } from "lucide-react";
import { FilterBar } from "../components/FilterBar";
import { typeClass } from "../lib/format";
import type { DashboardData, Filters, HealthUnit } from "../types";

type Props = {
  data: DashboardData;
  units: HealthUnit[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onOpenUnit: (unit: HealthUnit) => void;
};

type MarkerGroup = { key: string; code: string; type: string; units: HealthUnit[] };
type Point = { x: number; y: number };

const TYPE_COLORS: Record<string, string> = {
  Hospital: "#006591",
  UPA: "#cf5d32",
  UPAE: "#7154a8",
  "UPAE-R": "#168772",
};

const OFFSETS: Point[] = [{ x: 0, y: 0 }, { x: 11, y: -8 }, { x: -11, y: -8 }, { x: 0, y: 11 }];

function MarkerSymbol({ type, count }: { type: string; count: number }) {
  const color = TYPE_COLORS[type] ?? "#334155";
  if (type === "UPA") {
    return <><path d="M 0 -8 L 8 0 L 0 8 L -8 0 Z" fill={color} stroke="#fff" strokeWidth="1.5" /><path d="M-3 0h6M0-3v6" stroke="#fff" strokeWidth="1.5" /><title>{count} {type}</title></>;
  }
  if (type === "UPAE-R") {
    return <><path d="M-7-4 0-8 7-4 7 4 0 8-7 4Z" fill={color} stroke="#fff" strokeWidth="1.5" /><circle r="2" fill="#fff" /><title>{count} {type}</title></>;
  }
  if (type === "UPAE") {
    return <><circle r="8" fill={color} stroke="#fff" strokeWidth="1.5" /><circle r="3.2" fill="none" stroke="#fff" strokeWidth="1.5" /><title>{count} {type}</title></>;
  }
  return <><rect x="-8" y="-8" width="16" height="16" rx="3" fill={color} stroke="#fff" strokeWidth="1.5" /><path d="M-3.5 0h7M0-3.5v7" stroke="#fff" strokeWidth="1.8" /><title>{count} {type}</title></>;
}

export function MapView({ data, units, filters, onFiltersChange, onOpenUnit }: Props) {
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const [centers, setCenters] = useState<Record<string, Point>>({});
  const groups = useMemo<MarkerGroup[]>(() => {
    const grouped = new Map<string, MarkerGroup>();
    units.forEach((unit) => {
      if (!unit.ibgeCode) return;
      const key = `${unit.ibgeCode}:${unit.type}`;
      const current = grouped.get(key) ?? { key, code: unit.ibgeCode, type: unit.type, units: [] };
      current.units.push(unit);
      grouped.set(key, current);
    });
    return [...grouped.values()].sort((a, b) => a.units[0].municipality.localeCompare(b.units[0].municipality, "pt-BR"));
  }, [units]);
  const [activeKey, setActiveKey] = useState<string | null>(groups[0]?.key ?? null);

  useLayoutEffect(() => {
    const next: Record<string, Point> = { ...(data.map.fallbackCenters ?? {}) };
    Object.entries(pathRefs.current).forEach(([code, element]) => {
      if (!element) return;
      const box = element.getBBox();
      if (box.width === 0 && box.height === 0) return;
      next[code] = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    });
    setCenters(next);
  }, [data.map.paths, data.map.fallbackCenters]);

  useEffect(() => {
    if (!groups.some((group) => group.key === activeKey)) setActiveKey(groups[0]?.key ?? null);
  }, [groups, activeKey]);

  const active = groups.find((group) => group.key === activeKey) ?? null;
  const codesWithUnits = new Set(groups.map((group) => group.code));
  const groupsByCode = groups.reduce<Record<string, MarkerGroup[]>>((acc, group) => {
    (acc[group.code] ??= []).push(group);
    return acc;
  }, {});
  const [viewMinX, viewMinY, viewWidth, viewHeight] = data.map.viewBox.split(/\s+/).map(Number);

  return (
    <div className="map-page">
      <FilterBar filters={filters} options={data.filters} onChange={onFiltersChange} resultCount={units.length} />
      <section className="map-layout">
        <div className="panel map-canvas-panel">
          <div className="panel-heading"><div><h2>Pernambuco · posição municipal</h2><p>Selecione um símbolo para ver as unidades daquele tipo no município.</p></div></div>
          <div className="type-legend" aria-label="Legenda de tipos">
            {data.filters.types.map((type) => <span key={type}><i className={typeClass(type)} />{type}</span>)}
          </div>
          <div className="map-frame">
            <div className="map-stage" style={{ aspectRatio: `${viewWidth} / ${viewHeight}` }}>
              <svg className="pe-network-map" viewBox={data.map.viewBox} role="img" aria-label="Mapa de Pernambuco com unidades agregadas por município e tipo">
                <g className="map-inset" aria-label="Quadro de Fernando de Noronha">
                  <rect x="875" y="10" width="118" height="76" rx="6" />
                  <path d="M921 55c7-8 20-9 29-3-6 8-17 13-29 3Z" />
                  <text x="884" y="28">Fernando de Noronha</text>
                </g>
                <g className="municipality-layer">
                  {Object.entries(data.map.paths).map(([code, path]) => (
                    <path
                      key={code}
                      ref={(element) => { pathRefs.current[code] = element; }}
                      d={path}
                      className={codesWithUnits.has(code) ? "has-units" : ""}
                    />
                  ))}
                </g>
              </svg>
              <div className="map-marker-overlay" aria-label="Unidades no mapa">
                {groups.map((group, index) => {
                  const center = centers[group.code];
                  if (!center) return null;
                  const offset = OFFSETS[(groupsByCode[group.code]?.indexOf(group) ?? 0) % OFFSETS.length];
                  const x = ((center.x + offset.x - viewMinX) / viewWidth) * 100;
                  const y = ((center.y + offset.y - viewMinY) / viewHeight) * 100;
                  return (
                    <button
                      key={group.key}
                      type="button"
                      className={`map-marker ${activeKey === group.key ? "active" : ""}`}
                      style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${Math.min(index, 20) * 18}ms` }}
                      aria-label={`${group.units[0].municipality}: ${group.units.length} ${group.type}`}
                      onClick={() => setActiveKey(group.key)}
                    >
                      <svg viewBox="-10 -10 20 20" aria-hidden="true"><MarkerSymbol type={group.type} count={group.units.length} /></svg>
                      {group.units.length > 1 && <span>{group.units.length}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="map-disclaimer"><Info size={16} /> A planilha não contém coordenadas. Os símbolos usam o centro visual do município e não representam o endereço exato.</p>
        </div>

        <aside className="panel map-detail" aria-live="polite">
          {active ? (
            <>
              <header><span className={`type-badge ${typeClass(active.type)}`}>{active.type}</span><h2>{active.units[0].municipality}</h2><p>{active.units[0].rd} · {active.units[0].geres} GERES</p></header>
              <div className="map-unit-list">
                {active.units.map((unit) => (
                  <button key={unit.id} type="button" onClick={() => onOpenUnit(unit)}>
                    <span><strong>{unit.name}</strong><small><MapPin size={14} /> {unit.address}</small></span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-map-detail"><MapPin size={30} /><h2>Escolha um símbolo</h2><p>As unidades do município aparecem aqui com acesso à ficha técnica.</p></div>
          )}
        </aside>
      </section>
    </div>
  );
}
