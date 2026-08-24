import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DashboardData } from "./types";

const dataPath = path.resolve(process.cwd(), "public/data/health-units.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as DashboardData;

describe("base publicada", () => {
  it("publica as 73 unidades, incluindo 8 em construção, sem IDs duplicados", () => {
    expect(data.units).toHaveLength(73);
    expect(new Set(data.units.map((unit) => unit.id)).size).toBe(73);
    expect(data.meta.activeUnits).toBe(65);
    expect(data.meta.constructionUnits).toBe(8);
    expect(data.meta.statusCounts).toEqual({ "Em construção": 8, "Em funcionamento": 65 });
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
    expect(data.meta.totalBeds).toBe(6796);
    expect(data.meta.plannedBeds).toBe(data.units.reduce((sum, unit) => sum + (unit.plannedBeds ?? 0), 0));
    expect(data.meta.plannedBeds).toBe(861);
    expect(data.meta.constructionUnitsWithBeds).toBe(5);
    expect(data.meta.constructionMunicipalities).toBe(6);
    expect(data.meta.typeCounts).toEqual({ Hospital: 40, UPA: 14, UPAE: 15, "UPAE-R": 4 });
    expect(data.filters.statuses).toEqual(["Em funcionamento", "Em construção"]);
    expect(data.dataQuality.sourceCoverage).toMatchObject({
      operationalBeds: 50,
      plannedBeds: 5,
      operationalProfile: 65,
      plannedProfile: 3,
      managementInvestment: 25,
      constructionInvestment: 0,
    });
    expect(data.units.filter((unit) => unit.managementInvestment.amount !== null)).toHaveLength(43);
    expect(data.dataQuality.corrections).toHaveLength(3);
  });

  it("não mistura capacidade e investimento previstos com a rede em funcionamento", () => {
    const activeUnits = data.units.filter((unit) => unit.status === "Em funcionamento");
    const constructionUnits = data.units.filter((unit) => unit.status === "Em construção");

    expect(activeUnits).toHaveLength(65);
    expect(constructionUnits).toHaveLength(8);
    expect(activeUnits.every((unit) => unit.plannedBeds === null)).toBe(true);
    expect(constructionUnits.every((unit) => unit.beds === null)).toBe(true);
    expect(constructionUnits.every((unit) => unit.managementInvestment.amount === null)).toBe(true);
    expect(constructionUnits.every((unit) => unit.managementInvestment.label === null)).toBe(true);
    expect(constructionUnits.every((unit) => unit.source.supplemental?.sheet === "UNIDADES EM CONSTRUÇÃO")).toBe(true);
    expect(constructionUnits.reduce((sum, unit) => sum + (unit.plannedBeds ?? 0), 0)).toBe(861);

    const allMapMunicipalities = new Set(data.units.map((unit) => unit.ibgeCode));
    const constructionMapMunicipalities = new Set(constructionUnits.map((unit) => unit.ibgeCode));
    expect(allMapMunicipalities.size).toBe(25);
    expect(constructionMapMunicipalities.size).toBe(6);
  });
});
