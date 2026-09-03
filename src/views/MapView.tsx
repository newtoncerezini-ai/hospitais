import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, Info, MapPin, RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { FilterBar } from "../components/FilterBar";
import { ALL, displayValue, statusClass, typeClass } from "../lib/format";
import { filterMapUnits, MAP_SIGNAL_LABELS, matchesMapSignal, type MapSignal } from "../lib/mapFilters";
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
};

const MAP_MIN_WIDTH = 900;
const MARKER_TARGET_SIZE = 36;
const SIGNALS = Object.keys(MAP_SIGNAL_LABELS) as MapSignal[];
const NORONHA_CODE = "2605459";
const NORONHA_CENTER = { x: 935, y: 299 };

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
      while (distance <= maxRay && isInside(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance)) distance += rayStep;
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
      if (!best || clearance > best.clearance || (clearance === best.clearance && distanceToCenter < Math.hypot(best.x - center.x, best.y - center.y))) best = { x, y, clearance };
    }
  }
  return best ?? fallback;
}

function findInteriorPoints(element: SVGPathElement, count: number): Point[] {
  if (count <= 0) return [];
  const anchor = findInteriorAnchor(element);
  if (count === 1 || typeof element.isPointInFill !== "function") return [anchor];
  const box = element.getBBox();
  const point = element.ownerSVGElement?.createSVGPoint();
  if (!point) return [anchor];
  const isInside = (x: number, y: number) => {
    point.x = x;
    point.y = y;
    return element.isPointInFill(point);
  };
  const gridSize = Math.min(31, Math.max(17, 11 + count * 2));
  const candidates: Point[] = [];
  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const x = box.x + ((column + 0.5) / gridSize) * box.width;
      const y = box.y + ((row + 0.5) / gridSize) * box.height;
      if (isInside(x, y)) candidates.push({ x, y });
    }
  }
  const selected: Point[] = [anchor];
  while (selected.length < count && candidates.length > 0) {
    let bestIndex = 0;
    let bestDistance = -1;
    candidates.forEach((candidate, index) => {
      const distance = Math.min(...selected.map((chosen) => Math.hypot(candidate.x - chosen.x, candidate.y - chosen.y)));
      if (distance > bestDistance) {
        bestIndex = index;
        bestDistance = distance;
      }
    });
    selected.push(candidates.splice(bestIndex, 1)[0]);
  }
  while (selected.length < count) selected.push(anchor);
  return selected;
}

function distributeFallback(center: Point, count: number): Point[] {
  if (count <= 1) return [center];
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) return center;
    const ringIndex = index - 1;
    const ring = ringIndex < 8 ? 1 : 2;
    const itemsInRing = ring === 1 ? Math.min(8, count - 1) : Math.max(1, count - 9);
    const angle = ((ringIndex - (ring === 1 ? 0 : 8)) / itemsInRing) * Math.PI * 2 - Math.PI / 2;
    const radius = ring === 1 ? 15 : 25;
    return { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius };
  });
}

function buildGroups(units: HealthUnit[]): MunicipalityGroup[] {
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
    return { key: code, code, municipality: municipalityUnits[0].municipality, rd: municipalityUnits[0].rd, geres: municipalityUnits[0].geres, units: municipalityUnits, typeCounts, statusCounts };
  }).sort((first, second) => first.municipality.localeCompare(second.municipality, "pt-BR"));
}

function toggleSelection<T>(current: T[], value: T) {
  return current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
}

export function MapView({ data, units, filters, onFiltersChange, onOpenUnit }: Props) {
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const frameRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [unitAnchors, setUnitAnchors] = useState<Record<string, Point>>({});
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(data.filters.types);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(data.filters.statuses);
  const [selectedSignals, setSelectedSignals] = useState<MapSignal[]>([]);

  const mapUnits = useMemo(() => filterMapUnits(units, selectedTypes, selectedStatuses, selectedSignals), [selectedSignals, selectedStatuses, selectedTypes, units]);
  const groups = useMemo(() => buildGroups(mapUnits), [mapUnits]);
  const groupByCode = useMemo(() => new Map(groups.map((group) => [group.code, group])), [groups]);
  const allUnitsByCode = useMemo(() => {
    const grouped = new Map<string, HealthUnit[]>();
    data.units.forEach((unit) => {
      if (!unit.ibgeCode) return;
      const municipalityUnits = grouped.get(unit.ibgeCode) ?? [];
      municipalityUnits.push(unit);
      grouped.set(unit.ibgeCode, municipalityUnits);
    });
    grouped.forEach((municipalityUnits) => municipalityUnits.sort((first, second) => Number(second.type === "Hospital") - Number(first.type === "Hospital") || first.name.localeCompare(second.name, "pt-BR")));
    return grouped;
  }, [data.units]);
  const [viewMinX, viewMinY, viewWidth, viewHeight] = useMemo(() => data.map.viewBox.split(/\s+/).map(Number), [data.map.viewBox]);

  const typeCounts = useMemo(() => Object.fromEntries(data.filters.types.map((type) => [type, units.filter((unit) => unit.type === type).length])), [data.filters.types, units]);
  const statusCounts = useMemo(() => Object.fromEntries(data.filters.statuses.map((status) => [status, units.filter((unit) => unit.status === status).length])), [data.filters.statuses, units]);
  const signalCounts = useMemo(() => Object.fromEntries(SIGNALS.map((signal) => [signal, units.filter((unit) => matchesMapSignal(unit, signal)).length])) as Record<MapSignal, number>, [units]);

  useLayoutEffect(() => {
    const next: Record<string, Point> = {};
    Object.entries(data.map.fallbackCenters ?? {}).forEach(([code, center]) => {
      const municipalityUnits = allUnitsByCode.get(code) ?? [];
      const displayCenter = code === NORONHA_CODE ? NORONHA_CENTER : center;
      distributeFallback(displayCenter, municipalityUnits.length).forEach((point, index) => {
        const unit = municipalityUnits[index];
        if (unit) next[unit.id] = point;
      });
    });
    Object.entries(pathRefs.current).forEach(([code, element]) => {
      const municipalityUnits = allUnitsByCode.get(code) ?? [];
      if (!element || !data.map.paths[code] || municipalityUnits.length === 0) return;
      findInteriorPoints(element, municipalityUnits.length).forEach((point, index) => {
        const unit = municipalityUnits[index];
        if (unit) next[unit.id] = point;
      });
    });
    setUnitAnchors(next);
  }, [allUnitsByCode, data.map.fallbackCenters, data.map.paths]);

  useLayoutEffect(() => {
    const element = stageRef.current;
    if (!element) return undefined;
    const measure = () => {
      const bounds = element.getBoundingClientRect();
      const next = { width: bounds.width, height: bounds.height };
      setStageSize((current) => Math.abs(current.width - next.width) < 0.5 && Math.abs(current.height - next.height) < 0.5 ? current : next);
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
  }, [activeCode, groups]);

  const active = groups.find((group) => group.code === activeCode) ?? null;
  const highlightedCode = previewCode ?? activeCode;
  const markerPlacements = useMemo(() => new Map(mapUnits.flatMap((unit) => {
    const anchor = unitAnchors[unit.id];
    if (!anchor || stageSize.width <= 0 || stageSize.height <= 0) return [];
    return [[unit.id, { x: ((anchor.x - viewMinX) / viewWidth) * stageSize.width, y: ((anchor.y - viewMinY) / viewHeight) * stageSize.height }] as const];
  })), [mapUnits, stageSize, unitAnchors, viewHeight, viewMinX, viewMinY, viewWidth]);

  useEffect(() => {
    const frame = frameRef.current;
    const stage = stageRef.current;
    const activeUnit = active?.units.find((unit) => markerPlacements.has(unit.id));
    const placement = activeUnit ? markerPlacements.get(activeUnit.id) : undefined;
    if (!frame || !stage || !placement) return;
    const markerCenter = stage.offsetLeft + placement.x;
    if (markerCenter < frame.scrollLeft + MARKER_TARGET_SIZE || markerCenter > frame.scrollLeft + frame.clientWidth - MARKER_TARGET_SIZE) frame.scrollTo({ left: Math.max(0, markerCenter - frame.clientWidth / 2), behavior: "auto" });
  }, [active, markerPlacements]);

  const resetMapSelections = () => {
    setSelectedTypes(data.filters.types);
    setSelectedStatuses(data.filters.statuses);
    setSelectedSignals([]);
  };
  const resetFilters = () => {
    onFiltersChange({ query: "", municipality: ALL, rd: ALL, geres: ALL, type: ALL, status: ALL });
    resetMapSelections();
  };
  const hasMapSelections = selectedTypes.length !== data.filters.types.length || selectedStatuses.length !== data.filters.statuses.length || selectedSignals.length > 0;

  return (
    <div className="map-page">
      <FilterBar filters={filters} options={data.filters} onChange={onFiltersChange} resultCount={units.length} />
      <section className="map-layout">
        <div className="panel map-canvas-panel">
          <div className="panel-heading"><div><h2>Pernambuco · unidades em evidência</h2><p>Cada símbolo representa uma unidade; hospitais recebem maior escala para conduzir a leitura.</p></div></div>
          <section className="map-filter-strip" aria-label="Filtros dinâmicos do mapa">
            <header><span><SlidersHorizontal size={18} aria-hidden="true" /><strong>Filtros do mapa</strong></span><div className="map-filter-summary" aria-live="polite"><b>{mapUnits.length}</b> {mapUnits.length === 1 ? "unidade" : "unidades"} · {groups.length} {groups.length === 1 ? "município" : "municípios"}</div>{hasMapSelections && <button type="button" className="text-button" onClick={resetMapSelections}><RotateCcw size={14} aria-hidden="true" /> Restaurar mapa</button>}</header>
            <div className="map-filter-groups">
              <fieldset><legend>Tipos visíveis <button type="button" onClick={() => setSelectedTypes(data.filters.types)}>Selecionar todos</button></legend><div className="map-toggle-list">{data.filters.types.map((type) => { const selected = selectedTypes.includes(type); return <button key={type} type="button" className={`map-toggle ${selected ? "is-selected" : ""}`} aria-pressed={selected} disabled={typeCounts[type] === 0} onClick={() => setSelectedTypes((current) => toggleSelection(current, type))}><i className={typeClass(type)} />{selected && <Check size={13} aria-hidden="true" />}<span>{type}</span><b>{typeCounts[type]}</b></button>; })}</div></fieldset>
              <fieldset><legend>Status <button type="button" onClick={() => setSelectedStatuses(data.filters.statuses)}>Selecionar todos</button></legend><div className="map-toggle-list">{data.filters.statuses.map((status) => { const selected = selectedStatuses.includes(status); return <button key={status} type="button" className={`map-toggle status-toggle ${statusClass(status)} ${selected ? "is-selected" : ""}`} aria-pressed={selected} disabled={statusCounts[status] === 0} onClick={() => setSelectedStatuses((current) => toggleSelection(current, status))}>{selected && <Check size={13} aria-hidden="true" />}<span>{status}</span><b>{statusCounts[status]}</b></button>; })}</div></fieldset>
              <fieldset><legend>Evidências <button type="button" onClick={() => setSelectedSignals([])}>Limpar recorte</button></legend><div className="map-toggle-list">{SIGNALS.map((signal) => { const selected = selectedSignals.includes(signal); return <button key={signal} type="button" className={`map-toggle signal-toggle ${selected ? "is-selected" : ""}`} aria-pressed={selected} disabled={signalCounts[signal] === 0} onClick={() => setSelectedSignals((current) => toggleSelection(current, signal))}>{selected && <Check size={13} aria-hidden="true" />}<span>{MAP_SIGNAL_LABELS[signal]}</span><b>{signalCounts[signal]}</b></button>; })}</div></fieldset>
            </div>
          </section>
          <div className="unit-map-legend" aria-label="Legenda dos símbolos do mapa"><span><i className="legend-hospital-symbol" />Hospital · símbolo ampliado</span><span><i className="legend-unit-dot" />Demais unidades</span><span className="construction-legend"><i />Contorno laranja · obra</span></div>
          <div ref={frameRef} className="map-frame unit-map-frame" role="region" aria-label="Mapa municipal da rede. Em telas estreitas, role horizontalmente para explorar." tabIndex={0}>
            <div ref={stageRef} className="map-stage" style={{ aspectRatio: `${viewWidth} / ${viewHeight}`, minWidth: `${MAP_MIN_WIDTH}px` }}>
              <svg className="pe-network-map" viewBox={data.map.viewBox} role="img" aria-label="Mapa de Pernambuco com uma marca por unidade de saúde">
                <g className={`map-inset ${groupByCode.has(NORONHA_CODE) ? "has-units is-interactive" : ""} ${highlightedCode === NORONHA_CODE ? "is-active" : ""}`.trim()} aria-label="Quadro de Fernando de Noronha" onClick={() => groupByCode.has(NORONHA_CODE) && setActiveCode(NORONHA_CODE)} onPointerEnter={() => groupByCode.has(NORONHA_CODE) && setPreviewCode(NORONHA_CODE)} onPointerLeave={() => setPreviewCode((current) => current === NORONHA_CODE ? null : current)}><rect x="866" y="258" width="127" height="68" rx="6" /><path d="M910 299c8-9 24-10 35-3-7 9-21 14-35 3Z" /><text x="875" y="274">Fernando de Noronha</text></g>
                <g className="municipality-layer unit-map-municipalities">{Object.entries(data.map.paths).map(([code, path]) => { const group = groupByCode.get(code); return <path key={code} ref={(element) => { pathRefs.current[code] = element; }} data-code={code} d={path} className={`${group ? "has-units is-interactive" : ""} ${highlightedCode === code ? "is-active" : ""}`.trim()} onClick={() => group && setActiveCode(code)} onPointerEnter={() => group && setPreviewCode(code)} onPointerLeave={() => setPreviewCode((current) => current === code ? null : current)} />; })}</g>
              </svg>
              <div className="map-marker-overlay unit-marker-overlay" aria-label="Unidades de saúde representadas no mapa">{mapUnits.map((unit, index) => { const placement = markerPlacements.get(unit.id); if (!placement || !unit.ibgeCode) return null; const isHospital = unit.type === "Hospital"; const isConstruction = unit.status === "Em construção"; const isIsland = unit.ibgeCode === NORONHA_CODE; const style = { left: `${placement.x}px`, top: `${placement.y}px`, animationDelay: `${Math.min(index, 35) * 12}ms` } as CSSProperties; return <button key={unit.id} type="button" className={`health-unit-marker ${isHospital ? "is-hospital" : "is-other-unit"} ${isConstruction ? "is-construction" : ""} ${isIsland ? "is-island" : ""} ${activeCode === unit.ibgeCode ? "active-municipality" : ""}`} style={style} aria-label={`${unit.name}, ${unit.municipality}. ${unit.type}. ${unit.status}.`} aria-pressed={activeCode === unit.ibgeCode} aria-controls="map-detail-panel" onClick={() => setActiveCode(unit.ibgeCode)} onPointerEnter={() => setPreviewCode(unit.ibgeCode)} onPointerLeave={() => setPreviewCode((current) => current === unit.ibgeCode ? null : current)} onFocus={() => setActiveCode(unit.ibgeCode)}><span className="health-unit-symbol" aria-hidden="true" /><span className="unit-marker-tooltip" role="tooltip"><strong>{unit.name}</strong><small>{unit.municipality} · {unit.type}</small></span></button>; })}</div>
            </div>
          </div>
          <p className="map-disclaimer"><Info size={16} /> Os símbolos são distribuídos de forma ilustrativa dentro de cada município e não representam endereços exatos. Use os filtros para combinar tipos, status e evidências de intervenção.</p>
        </div>
        <aside id="map-detail-panel" className="panel map-detail" aria-live="polite">{groups.length === 0 ? <div className="empty-map-detail"><MapPin size={30} /><h2>Nenhuma unidade encontrada</h2><p>Não há resultados para a combinação de filtros atual.</p><button type="button" className="text-button" onClick={resetFilters}><X size={15} aria-hidden="true" /> Limpar todos os filtros</button></div> : active ? <><header><div className="map-detail-badges">{Object.entries(active.typeCounts).map(([type, count]) => <span key={type} className={`type-badge ${typeClass(type)}`}>{count} {type}</span>)}{Object.entries(active.statusCounts).map(([status, count]) => <span key={status} className={`status-badge ${statusClass(status)}`}>{count} {status.toLocaleLowerCase("pt-BR")}</span>)}</div><h2>{active.municipality}</h2><p>{active.rd} · {active.geres} GERES · {active.units.length} {active.units.length === 1 ? "unidade" : "unidades"}</p></header><div className="map-unit-list">{active.units.map((unit) => <button key={unit.id} type="button" onClick={() => onOpenUnit(unit)}><span><strong>{unit.name}</strong><span className="map-unit-badges"><span className={`type-badge ${typeClass(unit.type)}`}>{unit.type}</span><span className={`status-badge ${statusClass(unit.status)}`}>{unit.status}</span></span><small><MapPin size={14} /> {displayValue(unit.address)}</small></span><ArrowRight size={18} aria-hidden="true" /></button>)}</div></> : <div className="empty-map-detail"><MapPin size={30} /><h2>Escolha um município</h2><p>As unidades aparecem aqui com acesso direto à ficha técnica.</p></div>}</aside>
      </section>
    </div>
  );
}
