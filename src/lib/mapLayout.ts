export type MapMarkerAnchor = {
  key: string;
  municipalityCode: string;
  anchorX: number;
  anchorY: number;
  order: number;
};

export type MapMarkerPlacement = MapMarkerAnchor & {
  x: number;
  y: number;
};

export type MapLayoutOptions = {
  width: number;
  height: number;
  markerSize?: number;
  gap?: number;
};

type GridCell = { column: number; row: number };
type Pattern = GridCell[];

const DEFAULT_MARKER_SIZE = 46;
const DEFAULT_GAP = 6;
const PACKING_EFFICIENCY = 0.65;

function cellKey(cell: GridCell) {
  return `${cell.column}:${cell.row}`;
}

function patternCentroid(pattern: Pattern) {
  const total = pattern.reduce(
    (sum, cell) => ({ x: sum.x + cell.column, y: sum.y + cell.row }),
    { x: 0, y: 0 },
  );
  return { x: total.x / pattern.length, y: total.y / pattern.length };
}

function patternsFor(count: number): Pattern[] {
  if (count <= 1) return [[{ column: 0, row: 0 }]];
  if (count === 2) {
    return [
      [{ column: 0, row: 0 }, { column: 1, row: 0 }],
      [{ column: 0, row: 0 }, { column: 0, row: 1 }],
    ];
  }
  if (count === 3) {
    return [
      [{ column: 0, row: 0 }, { column: 1, row: 0 }, { column: 0, row: 1 }],
      [{ column: 0, row: 0 }, { column: 1, row: 0 }, { column: 1, row: 1 }],
      [{ column: 0, row: 0 }, { column: 0, row: 1 }, { column: 1, row: 1 }],
      [{ column: 1, row: 0 }, { column: 0, row: 1 }, { column: 1, row: 1 }],
      [{ column: 0, row: 0 }, { column: 1, row: 0 }, { column: 2, row: 0 }],
      [{ column: 0, row: 0 }, { column: 0, row: 1 }, { column: 0, row: 2 }],
    ];
  }
  if (count === 4) {
    return [[
      { column: 0, row: 0 },
      { column: 1, row: 0 },
      { column: 0, row: 1 },
      { column: 1, row: 1 },
    ]];
  }

  const columns = Math.ceil(Math.sqrt(count));
  const pattern: Pattern = [];
  for (let index = 0; index < count; index += 1) {
    pattern.push({ column: index % columns, row: Math.floor(index / columns) });
  }
  return [pattern];
}

export function minimumMapWidth(
  markerCount: number,
  aspectRatio: number,
  markerSize = DEFAULT_MARKER_SIZE,
  gap = DEFAULT_GAP,
) {
  if (markerCount <= 0 || !Number.isFinite(aspectRatio) || aspectRatio <= 0) return 0;
  const cellSize = markerSize + gap;
  const packedWidth = Math.sqrt(
    (markerCount * cellSize * cellSize * aspectRatio) / PACKING_EFFICIENCY,
  );
  return Math.ceil(packedWidth + markerSize);
}

export function layoutMapMarkers(
  anchors: MapMarkerAnchor[],
  { width, height, markerSize = DEFAULT_MARKER_SIZE, gap = DEFAULT_GAP }: MapLayoutOptions,
): MapMarkerPlacement[] {
  if (anchors.length === 0 || width <= 0 || height <= 0) return [];

  const cellSize = markerSize + gap;
  const edgeInset = markerSize / 2 + 2;
  const columns = Math.max(1, Math.floor((width - edgeInset * 2) / cellSize) + 1);
  const rows = Math.max(1, Math.floor((height - edgeInset * 2) / cellSize) + 1);
  const gridStartX = (width - (columns - 1) * cellSize) / 2;
  const gridStartY = (height - (rows - 1) * cellSize) / 2;

  const byMunicipality = new Map<string, MapMarkerAnchor[]>();
  anchors.forEach((anchor) => {
    const current = byMunicipality.get(anchor.municipalityCode) ?? [];
    current.push(anchor);
    byMunicipality.set(anchor.municipalityCode, current);
  });

  const bouquets = [...byMunicipality.entries()].map(([code, entries]) => {
    const sortedEntries = [...entries].sort((a, b) => a.order - b.order || a.key.localeCompare(b.key));
    const anchorX = sortedEntries.reduce((sum, entry) => sum + entry.anchorX, 0) / sortedEntries.length;
    const anchorY = sortedEntries.reduce((sum, entry) => sum + entry.anchorY, 0) / sortedEntries.length;
    return { code, entries: sortedEntries, anchorX, anchorY, density: 0 };
  });

  bouquets.sort((a, b) => a.code.localeCompare(b.code));
  bouquets.forEach((bouquet) => {
    const density = bouquets.reduce((score, other) => {
      if (bouquet.code === other.code) return score;
      const distance = Math.hypot(bouquet.anchorX - other.anchorX, bouquet.anchorY - other.anchorY);
      return distance < cellSize * 3 ? score + (cellSize * 3 - distance) : score;
    }, 0);
    bouquet.density = Math.round(density * 1000) / 1000;
  });

  bouquets.sort(
    (a, b) => b.density - a.density
      || b.entries.length - a.entries.length
      || a.code.localeCompare(b.code),
  );

  const occupied = new Set<string>();
  const placements = new Map<string, MapMarkerPlacement>();

  bouquets.forEach((bouquet) => {
    let best:
      | { cells: GridCell[]; cost: number }
      | undefined;

    patternsFor(bouquet.entries.length).forEach((pattern, patternIndex) => {
      const centroid = patternCentroid(pattern);
      for (let baseRow = 0; baseRow < rows; baseRow += 1) {
        for (let baseColumn = 0; baseColumn < columns; baseColumn += 1) {
          const cells = pattern.map((cell) => ({
            column: baseColumn + cell.column,
            row: baseRow + cell.row,
          }));
          const isAvailable = cells.every(
            (cell) => cell.column >= 0
              && cell.column < columns
              && cell.row >= 0
              && cell.row < rows
              && !occupied.has(cellKey(cell)),
          );
          if (!isAvailable) continue;

          const centerX = gridStartX + (baseColumn + centroid.x) * cellSize;
          const centerY = gridStartY + (baseRow + centroid.y) * cellSize;
          const distanceCost = (centerX - bouquet.anchorX) ** 2 + (centerY - bouquet.anchorY) ** 2;
          const cost = distanceCost + patternIndex * 0.001 + baseRow * 0.000001 + baseColumn * 0.000000001;
          if (!best || cost < best.cost) {
            best = { cells, cost };
          }
        }
      }
    });

    let cells = best?.cells;
    if (!cells) {
      const freeCells: GridCell[] = [];
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const cell = { column, row };
          if (!occupied.has(cellKey(cell))) freeCells.push(cell);
        }
      }
      cells = freeCells
        .sort((a, b) => {
          const ax = gridStartX + a.column * cellSize;
          const ay = gridStartY + a.row * cellSize;
          const bx = gridStartX + b.column * cellSize;
          const by = gridStartY + b.row * cellSize;
          return ((ax - bouquet.anchorX) ** 2 + (ay - bouquet.anchorY) ** 2)
            - ((bx - bouquet.anchorX) ** 2 + (by - bouquet.anchorY) ** 2)
            || a.row - b.row
            || a.column - b.column;
        })
        .slice(0, bouquet.entries.length);
    }

    bouquet.entries.forEach((entry, index) => {
      const cell = cells?.[index];
      if (!cell) {
        placements.set(entry.key, {
          ...entry,
          x: Math.min(Math.max(entry.anchorX, edgeInset), width - edgeInset),
          y: Math.min(Math.max(entry.anchorY, edgeInset), height - edgeInset),
        });
        return;
      }
      occupied.add(cellKey(cell));
      placements.set(entry.key, {
        ...entry,
        x: gridStartX + cell.column * cellSize,
        y: gridStartY + cell.row * cellSize,
      });
    });
  });

  return [...placements.values()].sort((a, b) => a.key.localeCompare(b.key));
}
