import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Info, MapPin, X } from "lucide-react";
import { FilterBar } from "../components/FilterBar";
import { ALL, typeClass } from "../lib/format";
import { layoutMapMarkers, minimumMapWidth } from "../lib/mapLayout";
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

const MARKER_SIZE = 46;
const MARKER_GAP = 6;
const LEADER_THRESHOLD = 22;

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
  const frameRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [centers, setCenters] = useState<Record<string, Point>>({});
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const groups = useMemo<MarkerGroup[]>(() => {
    const grouped = new Map<string, MarkerGroup>();
    units.forEach((unit) => {
      if (!unit.ibgeCode) return;
      const key = `${unit.ibgeCode}:${unit.type}`;
      const current = grouped.get(key) ?? { key, code: unit.ibgeCode, type: unit.type, units: [] };
      current.units.push(unit);
      grouped.set(key, current);
    });
    const typeOrder = new Map(data.filters.types.map((type, index) => [type, index]));
    return [...grouped.values()].sort(
      (a, b) => a.units[0].municipality.localeCompare(b.units[0].municipality, "pt-BR")
        || (typeOrder.get(a.type) ?? 99) - (typeOrder.get(b.type) ?? 99)
        || a.key.localeCompare(b.key),
    );
  }, [data.filters.types, units]);

  const [activeKey, setActiveKey] = useState<string | null>(groups[0]?.key ?? null);
  const [viewMinX, viewMinY, viewWidth, viewHeight] = useMemo(
    () => data.map.viewBox.split(/\s+/).map(Number),
    [data.map.viewBox],
  );
  const mapMinWidth = Math.max(
    760,
    minimumMapWidth(groups.length, viewWidth / viewHeight, MARKER_SIZE, MARKER_GAP),
  );

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

  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;

    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const next = { width: bounds.width, height: bounds.height };
      setStageSize((current) => (
        Math.abs(current.width - next.width) < 0.5 && Math.abs(current.height - next.height) < 0.5
          ? current
          : next
      ));
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [mapMinWidth]);

  useEffect(() => {
    if (!groups.some((group) => group.key === activeKey)) setActiveKey(groups[0]?.key ?? null);
  }, [groups, activeKey]);

  const active = groups.find((group) => group.key === activeKey) ?? null;
  const codesWithUnits = useMemo(() => new Set(groups.map((group) => group.code)), [groups]);
  const markerPlacements = useMemo(() => {
    const typeOrder = new Map(data.filters.types.map((type, index) => [type, index]));
    const anchors = groups.flatMap((group) => {
      const center = centers[group.code];
      if (!center || stageSize.width <= 0 || stageSize.height <= 0) return [];
      return [{
        key: group.key,
        municipalityCode: group.code,
        anchorX: ((center.x - viewMinX) / viewWidth) * stageSize.width,
        anchorY: ((center.y - viewMinY) / viewHeight) * stageSize.height,
        order: typeOrder.get(group.type) ?? 99,
      }];
    });
    return layoutMapMarkers(anchors, {
      width: stageSize.width,
      height: stageSize.height,
      markerSize: MARKER_SIZE,
      gap: MARKER_GAP,
    });
  }, [centers, data.filters.types, groups, stageSize, viewHeight, viewMinX, viewMinY, viewWidth]);
  const placementByKey = useMemo(
    () => new Map(markerPlacements.map((placement) => [placement.key, placement])),
    [markerPlacements],
  );
  const guideKey = previewKey ?? activeKey ?? "";
  const guidePlacement = placementByKey.get(guideKey);
  const highlightedCode = groups.find((group) => group.key === guideKey)?.code ?? active?.code;
  const guideGeometry = (() => {
    if (!guidePlacement) return null;
    const deltaX = guidePlacement.x - guidePlacement.anchorX;
    const deltaY = guidePlacement.y - guidePlacement.anchorY;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < LEADER_THRESHOLD) return null;
    const markerInset = MARKER_SIZE / 2 - 3;
    return {
      x1: guidePlacement.anchorX,
      y1: guidePlacement.anchorY,
      x2: guidePlacement.x - (deltaX / distance) * markerInset,
      y2: guidePlacement.y - (deltaY / distance) * markerInset,
    };
  })();

  useEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    const placement = activeKey ? placementByKey.get(activeKey) : undefined;
    if (!frame || !stage || !placement) return;

    const markerCenter = stage.offsetLeft + placement.x;
    const visibleStart = frame.scrollLeft + MARKER_SIZE;
    const visibleEnd = frame.scrollLeft + frame.clientWidth - MARKER_SIZE;
    if (markerCenter < visibleStart || markerCenter > visibleEnd) {
      frame.scrollTo({
        left: Math.max(0, markerCenter - frame.clientWidth / 2),
        behavior: "auto",
      });
    }
  }, [activeKey, placementByKey]);

  const resetFilters = () => onFiltersChange({
    query: "",
    municipality: ALL,
    rd: ALL,
    geres: ALL,
    type: ALL,
  });

  return (
    <div className="map-page">
      <FilterBar filters={filters} options={data.filters} onChange={onFiltersChange} resultCount={units.length} />
      <section className="map-layout">
        <div className="panel map-canvas-panel">
          <div className="panel-heading"><div><h2>Pernambuco · distribuição municipal</h2><p>Selecione um símbolo para ver as unidades daquele tipo no município.</p></div></div>
          <div className="type-legend" aria-label="Legenda de tipos">
            {data.filters.types.map((type) => <span key={type}><i className={typeClass(type)} />{type}</span>)}
          </div>
          <div
            ref={frameRef}
            className="map-frame"
            role="region"
            aria-label="Mapa esquemático da rede. Em telas estreitas, role horizontalmente para explorar."
            tabIndex={0}
          >
            <div
              ref={stageRef}
              className="map-stage"
              style={{ aspectRatio: `${viewWidth} / ${viewHeight}`, minWidth: `${mapMinWidth}px` }}
            >
              <svg className="pe-network-map" viewBox={data.map.viewBox} role="img" aria-label="Mapa de Pernambuco com símbolos distribuídos esquematicamente por município e agregados por tipo">
                <g className={`map-inset ${highlightedCode === "2605459" ? "is-active" : ""}`} aria-label="Quadro de Fernando de Noronha">
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
                      className={`${codesWithUnits.has(code) ? "has-units" : ""} ${highlightedCode === code ? "is-active" : ""}`.trim()}
                    />
                  ))}
                </g>
              </svg>

              {stageSize.width > 0 && (
                <svg
                  className="map-leader-layer"
                  viewBox={`0 0 ${stageSize.width} ${stageSize.height}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                  focusable="false"
                >
                  {guideGeometry && guidePlacement && (
                    <g className="is-active">
                      <line {...guideGeometry} />
                      <circle cx={guidePlacement.anchorX} cy={guidePlacement.anchorY} r="2.5" />
                    </g>
                  )}
                </svg>
              )}

              <div className="map-marker-overlay" aria-label="Unidades no mapa">
                {groups.map((group, index) => {
                  const placement = placementByKey.get(group.key);
                  if (!placement) return null;
                  const unitCount = group.units.length === 1 ? "1 unidade" : `${group.units.length} unidades`;
                  return (
                    <button
                      key={group.key}
                      type="button"
                      className={`map-marker ${activeKey === group.key ? "active" : ""}`}
                      style={{ left: `${placement.x}px`, top: `${placement.y}px`, animationDelay: `${Math.min(index, 20) * 18}ms` }}
                      aria-label={`${group.units[0].municipality}: ${unitCount} do tipo ${group.type}`}
                      aria-pressed={activeKey === group.key}
                      aria-controls="map-detail-panel"
                      onClick={() => setActiveKey(group.key)}
                      onPointerEnter={() => setPreviewKey(group.key)}
                      onPointerLeave={() => setPreviewKey((current) => current === group.key ? null : current)}
                      onFocus={(event) => {
                        setActiveKey(group.key);
                        event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
                      }}
                    >
                      <svg viewBox="-10 -10 20 20" aria-hidden="true"><MarkerSymbol type={group.type} count={group.units.length} /></svg>
                      {group.units.length > 1 && <span>{group.units.length}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="map-disclaimer"><Info size={16} /> Distribuição esquemática: os símbolos são organizados para evitar sobreposição e ligados ao centro visual do município. Eles não representam o endereço exato. Em telas menores, deslize o mapa na horizontal.</p>
        </div>

        <aside id="map-detail-panel" className="panel map-detail" aria-live="polite">
          {groups.length === 0 ? (
            <div className="empty-map-detail">
              <MapPin size={30} />
              <h2>Nenhuma unidade encontrada</h2>
              <p>Não há resultados para a combinação de filtros atual.</p>
              <button type="button" className="text-button" onClick={resetFilters}>
                <X size={15} aria-hidden="true" /> Limpar filtros
              </button>
            </div>
          ) : active ? (
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
