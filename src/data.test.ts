import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DashboardData } from "./types";

const dataPath = path.resolve(process.cwd(), "public/data/health-units.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as DashboardData;

describe("base publicada", () => {
  it("publica as 65 unidades ativas sem IDs duplicados", () => {
    expect(data.units).toHaveLength(65);
    expect(new Set(data.units.map((unit) => unit.id)).size).toBe(65);
  });

  it("mantém os campos territoriais necessários para busca e mapa", () => {
    for (const unit of data.units) {
      expect(unit.name).toBeTruthy();
      expect(unit.municipality).not.toBe("Não informado");
      expect(unit.rd).not.toBe("Não informado");
      expect(unit.geres).not.toBe("Não informado");
      expect(unit.ibgeCode).toMatch(/^26\d{5}$/);
      expect(Boolean(data.map.paths[unit.ibgeCode!] || data.map.fallbackCenters?.[unit.ibgeCode!])).toBe(true);
    }
  });

  it("reconcilia os totais e a cobertura reportada", () => {
    expect(data.meta.totalUnits).toBe(data.units.length);
    expect(data.meta.totalMunicipalities).toBe(new Set(data.units.map((unit) => unit.municipality)).size);
    expect(data.meta.totalBeds).toBe(data.units.reduce((sum, unit) => sum + (unit.beds ?? 0), 0));
    expect(data.units.filter((unit) => unit.managementInvestment.amount !== null)).toHaveLength(43);
    expect(data.dataQuality.corrections).toHaveLength(5);
  });
});
