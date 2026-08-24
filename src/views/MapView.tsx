import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Info, MapPin, X } from "lucide-react";
import { FilterBar } from "../components/FilterBar";
import { ALL, displayValue, statusClass, typeClass } from "../lib/format";
import type { DashboardData, Filters, HealthUnit } from "../types";

type Props = {
  data: DashboardData;
  units: HealthUnit[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onOpenUnit: (unit: HealthUnit) => void;
};

type Point = { x: number; y: number };
type MunicipalityAnchor = Point & { clearance: number };
type MunicipalityGroup = {
  key: string;
  code: string;
  municipality: string;
  rd: string;
  geres: string;
  units: HealthUnit[];
  typeCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  hasConstruction: boolean;
};

const TYPE_COLORS: Record<string, string> = {
  Hospital: "#006591",
  UPA: "#cf5d32",
  UPAE: "#7154a8",
  "UPAE-R": "#168772",
};

const MAP_MIN_WIDTH = 760;
const MARKER_TARGET_SIZE = 44;
const MAX_MARKER_SIZE = 36;
const MIN_MARKER_SIZE = 5;

function findInteriorAnchor(element: SVGPathElement): MunicipalityAnchor {
  const box = element.getBBox();
  const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const fallback = { ...center, clearance: Math.max(2, Math.min(box.width, box.height) / 2) };
  if (box.width === 0 || box.height === 0 || typeof element.isPointInFill !== "function") return fallback;

  const point = element.ownerSVGElement?.createSVGPoint();
  if (!point) return fallback;
  const isInside = (x: number, y: number) => {
    point.x = x;
    point.y = y;
    return element.isPointInFill(point);
  };
  const rayStep = Math.max(0.45, Math.min(box.width, box.height) / 18);
  const maxRay = Math.hypot(box.width, box.height);
  const estimateClearance = (x: number, y: number) => {
    let clearance = maxRay;
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12;
      let distance = rayStep;
      while (distance <= maxRay && isInside(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance)) {
        distance += rayStep;
      }
      clearance = Math.min(clearance, Math.max(rayStep / 2, distance - rayStep / 2));
    }
    return clearance;
  };

  let best: MunicipalityAnchor | null = null;
  const gridSize = 17;
  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const x = box.x + ((column + 0.5) / gridSize) * box.width;
      const y = box.y + ((row + 0.5) / gridSize) * box.height;
      if (!isInside(x, y)) continue;
      const clearance = estimateClearance(x, y);
      const distanceToCenter = Math.hypot(x - center.x, y - center.y);
      if (!best || clearance > best.clearance || (clearance === best.clearance && distanceToCenter < Math.hypot(best.x - center.x, best.y - center.y))) {
        best = { x, y, clearance };
      }
    }
  }
  return best ?? fallback;
}

function MunicipalityGlyph({ group, typeOrder }: { group: MunicipalityGroup; typeOrder: string[] }) {
  const radius = 14;
  const circumference = Math.PI * 2 * radius;
  const types = Object.entries(group.typeCounts).sort(
    ([first], [second]) => typeOrder.indexOf(first) - typeOrder.indexOf(second),
  );
  let offset = 0;

  return (
    <svg className="municipality-marker-glyph" viewBox="-21 -21 42 42" aria-hidden="true">
      {group.hasConstruction && <circle className="municipality-marker-construction" r="18" />}
      <circle className="municipality-marker-track" r={radius} />
      {types.map(([type, count]) => {
        const segmentLength = (count / group.units.length) * circumference;
        const visibleLength = Math.max(1, segmentLength - (types.length > 1 ? 1.5 : 0));
        const segment = (
          <circle
            key={type}
            className="municipality-marker-segment"
            r={radius}
            transform="rotate(-90)"
            stroke={TYPE_COLORS[type] ?? "#334155"}
            strokeDasharray={`${visibleLength} ${circumference - visibleLength}`}
            strokeDashoffset={-offset}
          />
        );
        offset += segmentLength;
        return segment;
      })}
      <circle className="municipality-marker-core" r="9.25" />
      <text className="municipality-marker-count" textAnchor="middle" dominantBaseline="central">{group.units.length}</text>
    </svg>
  );
}

export function MapView({ data, units, filters, onFiltersChange, onOpenUnit }: Props) {
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const frameRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [anchors, setAnchors] = useState<Record<string, MunicipalityAnchor>>({});
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  const groups = useMemo<MunicipalityGroup[]>(() => {
    const grouped = new Map<string, HealthUnit[]>();
    units.forEach((unit) => {
      if (!unit.ibgeCode) return;
      const municipalityUnits = grouped.get(unit.ibgeCode) ?? [];
      municipalityUnits.push(unit);
      grouped.set(unit.ibgeCode, municipalityUnits);
    });
    return [...grouped.entries()].map(([code, municipalityUnits]) => {
      municipalityUnits.sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
      const typeCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      municipalityUnits.forEach((unit) => {
        typeCounts[unit.type] = (typeCounts[unit.type] ?? 0) + 1;
        statusCounts[unit.status] = (statusCounts[unit.status] ?? 0) + 1;
      });
      return {
        key: code,
        code,
        municipality: municipalityUnits[0].municipality,
        rd: municipalityUnits[0].rd,
        geres: municipalityUnits[0].geres,
        units: municipalityUnits,
        typeCounts,
        statusCounts,
        hasConstruction: Boolean(statusCounts["Em construção"]),
      };
    }).sort((first, second) => first.municipality.localeCompare(second.municipality, "pt-BR"));
  }, [units]);

  const groupByCode = useMemo(() => new Map(groups.map((group) => [group.code, group])), [groups]);
  const [activeCode, setActiveCode] = useState<string | null>(groups[0]?.code ?? null);
  const [viewMinX, viewMinY, viewWidth, viewHeight] = useMemo(
    () => data.map.viewBox.split(/\s+/).map(Number),
    [data.map.viewBox],
  );

  useLayoutEffect(() => {
    const next: Record<string, MunicipalityAnchor> = {};
    Object.entries(data.map.fallbackCenters ?? {}).forEach(([code, center]) => {
      if (groupByCode.has(code)) next[code] = { x: center.x, y: center.y, clearance: 14 };
    });
    Object.entries(pathRefs.current).forEach(([code, element]) => {
      if (!element || !groupByCode.has(code)) return;
      next[code] = findInteriorAnchor(element);
    });
    setAnchors(next);
  }, [data.map.fallbackCenters, data.map.paths, groupByCode]);

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
  }, []);

  useEffect(() => {
    if (!groups.some((group) => group.code === activeCode)) setActiveCode(groups[0]?.code ?? null);
  }, [groups, activeCode]);

  const active = groups.find((group) => group.code === activeCode) ?? null;
  const highlightedCode = previewCode ?? activeCode;
  const markerPlacements = useMemo(() => {
    const scale = stageSize.width > 0 ? stageSize.width / viewWidth : 1;
    return new Map(groups.flatMap((group) => {
      const anchor = anchors[group.code];
      if (!anchor || stageSize.width <= 0 || stageSize.height <= 0) return [];
      const naturalSize = anchor.clearance * 2 * scale * 0.72;
      return [[group.code, {
        x: ((anchor.x - viewMinX) / viewWidth) * stageSize.width,
        y: ((anchor.y - viewMinY) / viewHeight) * stageSize.height,
        visualSize: Math.max(MIN_MARKER_SIZE, Math.min(MAX_MARKER_SIZE, naturalSize)),
      }] as const];
    }));
  }, [anchors, groups, stageSize, viewHeight, viewMinX, viewMinY, viewWidth]);

  useEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    const placement = activeCode ? markerPlacements.get(activeCode) : undefined;
    if (!frame || !stage || !placement) return;
    const markerCenter = stage.offsetLeft + placement.x;
    const visibleStart = frame.scrollLeft + MARKER_TARGET_SIZE;
    const visibleEnd = frame.scrollLeft + frame.clientWidth - MARKER_TARGET_SIZE;
    if (markerCenter < visibleStart || markerCenter > visibleEnd) {
      frame.scrollTo({ left: Math.max(0, markerCenter - frame.clientWidth / 2), behavior: "auto" });
    }
  }, [activeCode, markerPlacements]);

  const resetFilters = () => onFiltersChange({
    query: "",
    municipality: ALL,
    rd: ALL,
    geres: ALL,
    type: ALL,
    status: ALL,
  });

  return (
    <div className="map-page">
      <FilterBar filters={filters} options={data.filters} onChange={onFiltersChange} resultCount={units.length} />
      <section className="map-layout">
        <div className="panel map-canvas-panel">
          <div className="panel-heading"><div><h2>Pernambuco · distribuição municipal</h2><p>Cada marcador reúne todas as unidades do município sem sair dos seus limites.</p></div></div>
          <div className="type-legend" aria-label="Legenda de tipos e status">
            {data.filters.types.map((type) => <span key={type}><i className={typeClass(type)} />{type}</span>)}
            <span className="construction-legend"><i />Anel tracejado: município com obra</span>
          </div>
          <div
            ref={frameRef}
            className="map-frame"
            role="region"
            aria-label="Mapa municipal da rede. Em telas estreitas, role horizontalmente para explorar."
            tabIndex={0}
          >
            <div
              ref={stageRef}
              className="map-stage"
              style={{ aspectRatio: `${viewWidth} / ${viewHeight}`, minWidth: `${MAP_MIN_WIDTH}px` }}
            >
              <svg className="pe-network-map" viewBox={data.map.viewBox} role="img" aria-label="Mapa de Pernambuco com um marcador interno por município">
                <g
                  className={`map-inset ${groupByCode.has("2605459") ? "has-units is-interactive" : ""} ${highlightedCode === "2605459" ? "is-active" : ""}`.trim()}
                  aria-label="Quadro de Fernando de Noronha"
                  onClick={() => groupByCode.has("2605459") && setActiveCode("2605459")}
                  onPointerEnter={() => groupByCode.has("2605459") && setPreviewCode("2605459")}
                  onPointerLeave={() => setPreviewCode((current) => current === "2605459" ? null : current)}
                >
                  <rect x="875" y="10" width="118" height="76" rx="6" />
                  <path d="M921 55c7-8 20-9 29-3-6 8-17 13-29 3Z" />
                  <text x="884" y="28">Fernando de Noronha</text>
                </g>
                <g className="municipality-layer">
                  {Object.entries(data.map.paths).map(([code, path]) => {
                    const group = groupByCode.get(code);
                    return (
                      <path
                        key={code}
                        ref={(element) => { pathRefs.current[code] = element; }}
                        data-code={code}
                        d={path}
                        className={`${group ? "has-units is-interactive" : ""} ${highlightedCode === code ? "is-active" : ""}`.trim()}
                        onClick={() => group && setActiveCode(code)}
                        onPointerEnter={() => group && setPreviewCode(code)}
                        onPointerLeave={() => setPreviewCode((current) => current === code ? null : current)}
                      />
                    );
                  })}
                </g>
              </svg>

              <div className="map-marker-overlay" aria-label="Municípios com unidades de saúde">
                {groups.map((group, index) => {
                  const placement = markerPlacements.get(group.code);
                  if (!placement) return null;
                  const unitCount = group.units.length === 1 ? "1 unidade" : `${group.units.length} unidades`;
                  const style = {
                    left: `${placement.x}px`,
                    top: `${placement.y}px`,
                    animationDelay: `${Math.min(index, 20) * 18}ms`,
                    "--marker-visual-size": `${placement.visualSize}px`,
                  } as CSSProperties;
                  return (
                    <button
                      key={group.key}
                      type="button"
                      data-municipality-code={group.code}
                      className={`municipality-marker ${placement.visualSize < 15 ? "is-compact" : ""} ${group.hasConstruction ? "has-construction" : ""} ${activeCode === group.code ? "active" : ""}`}
                      style={style}
                      aria-label={`${group.municipality}: ${unitCount}. Selecione para ver a lista.`}
                      aria-pressed={activeCode === group.code}
                      aria-controls="map-detail-panel"
                      onClick={() => setActiveCode(group.code)}
                      onPointerEnter={() => setPreviewCode(group.code)}
                      onPointerLeave={() => setPreviewCode((current) => current === group.code ? null : current)}
                      onFocus={() => setActiveCode(group.code)}
                    >
                      <MunicipalityGlyph group={group} typeOrder={data.filters.types} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="map-disclaimer"><Info size={16} /> O marcador indica o município, não o endereço exato. O anel colorido resume os tipos de unidade e o número central informa o total cadastrado. Municípios pequenos recebem símbolos menores para preservar a associação territorial.</p>
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
              <header>
                <div className="map-detail-badges">
                  {Object.entries(active.typeCounts).map(([type, count]) => <span key={type} className={`type-badge ${typeClass(type)}`}>{count} {type}</span>)}
                  {Object.entries(active.statusCounts).map(([status, count]) => <span key={status} className={`status-badge ${statusClass(status)}`}>{count} {status.toLocaleLowerCase("pt-BR")}</span>)}
                </div>
                <h2>{active.municipality}</h2>
                <p>{active.rd} · {active.geres} GERES · {active.units.length} {active.units.length === 1 ? "unidade" : "unidades"}</p>
              </header>
              <div className="map-unit-list">
                {active.units.map((unit) => (
                  <button key={unit.id} type="button" onClick={() => onOpenUnit(unit)}>
                    <span>
                      <strong>{unit.name}</strong>
                      <span className="map-unit-badges"><span className={`type-badge ${typeClass(unit.type)}`}>{unit.type}</span><span className={`status-badge ${statusClass(unit.status)}`}>{unit.status}</span></span>
                      <small><MapPin size={14} /> {displayValue(unit.address)}</small>
                    </span>
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-map-detail"><MapPin size={30} /><h2>Escolha um município</h2><p>As unidades aparecem aqui com acesso direto à ficha técnica.</p></div>
          )}
        </aside>
      </section>
    </div>
  );
}
