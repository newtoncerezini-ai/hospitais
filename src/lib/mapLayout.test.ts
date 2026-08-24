import { describe, expect, it } from "vitest";

import {
  layoutMapMarkers,
  minimumMapWidth,
  type MapMarkerAnchor,
} from "./mapLayout";

const MARKER_SIZE = 46;
const GAP = 6;

function denseAnchors(count = 50): MapMarkerAnchor[] {
  return Array.from({ length: count }, (_, index) => ({
    key: `marker-${String(index).padStart(2, "0")}`,
    municipalityCode: `26${String(Math.floor(index / 2)).padStart(5, "0")}`,
    anchorX: 680 + (index % 5) * 3,
    anchorY: 118 + (index % 4) * 3,
    order: index % 2,
  }));
}

describe("minimumMapWidth", () => {
  it("reserva uma largura útil para os 50 grupos atuais sem miniaturizar os alvos", () => {
    const width = minimumMapWidth(50, 1000 / 337.35, MARKER_SIZE, GAP);
    expect(width).toBeGreaterThanOrEqual(760);
  });
});

describe("layoutMapMarkers", () => {
  it.each([760, 780, 1040, 1280, 1440])(
    "distribui um cenário denso sem interseção no estágio de %d px",
    (width) => {
      const height = width / (1000 / 337.35);
      const placements = layoutMapMarkers(denseAnchors(), {
        width,
        height,
        markerSize: MARKER_SIZE,
        gap: GAP,
      });

      expect(placements).toHaveLength(50);
      placements.forEach((placement) => {
        expect(placement.x).toBeGreaterThanOrEqual(MARKER_SIZE / 2);
        expect(placement.x).toBeLessThanOrEqual(width - MARKER_SIZE / 2);
        expect(placement.y).toBeGreaterThanOrEqual(MARKER_SIZE / 2);
        expect(placement.y).toBeLessThanOrEqual(height - MARKER_SIZE / 2);
      });

      for (let first = 0; first < placements.length; first += 1) {
        for (let second = first + 1; second < placements.length; second += 1) {
          const horizontalDistance = Math.abs(placements[first].x - placements[second].x);
          const verticalDistance = Math.abs(placements[first].y - placements[second].y);
          expect(
            horizontalDistance >= MARKER_SIZE + GAP - 0.001
              || verticalDistance >= MARKER_SIZE + GAP - 0.001,
          ).toBe(true);
        }
      }
    },
  );

  it("mantém as mesmas posições quando a ordem de entrada muda", () => {
    const anchors = denseAnchors();
    const options = { width: 780, height: 270, markerSize: MARKER_SIZE, gap: GAP };
    const original = layoutMapMarkers(anchors, options);
    const reversed = layoutMapMarkers([...anchors].reverse(), options);

    expect(reversed).toEqual(original);
  });

  it("mantém os tipos do mesmo município em um buquê compacto e ordenado", () => {
    const placements = layoutMapMarkers([
      { key: "hospital", municipalityCode: "2611606", anchorX: 350, anchorY: 120, order: 0 },
      { key: "upa", municipalityCode: "2611606", anchorX: 350, anchorY: 120, order: 1 },
      { key: "upae-r", municipalityCode: "2611606", anchorX: 350, anchorY: 120, order: 3 },
    ], { width: 760, height: 256, markerSize: MARKER_SIZE, gap: GAP });

    const byKey = new Map(placements.map((placement) => [placement.key, placement]));
    const hospital = byKey.get("hospital")!;
    const upa = byKey.get("upa")!;
    const upaeRegional = byKey.get("upae-r")!;
    const distances = [
      Math.hypot(hospital.x - upa.x, hospital.y - upa.y),
      Math.hypot(hospital.x - upaeRegional.x, hospital.y - upaeRegional.y),
      Math.hypot(upa.x - upaeRegional.x, upa.y - upaeRegional.y),
    ];

    expect(Math.max(...distances)).toBeLessThanOrEqual(Math.sqrt(2) * (MARKER_SIZE + GAP));
  });
});
