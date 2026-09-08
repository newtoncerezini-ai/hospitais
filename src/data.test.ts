import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DashboardData } from "./types";

const dataPath = path.resolve(process.cwd(), "public/data/health-units.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as DashboardData;

describe("base publicada", () => {
  it("publica os 98 registros, incluindo a Rede Credenciada, sem IDs duplicados", () => {
    expect(data.units).toHaveLength(98);
    expect(new Set(data.units.map((unit) => unit.id)).size).toBe(98);
    expect(data.meta.activeUnits).toBe(65);
    expect(data.meta.constructionUnits).toBe(8);
    expect(data.meta.unitsWithoutStatus).toBe(25);
    expect(data.meta.statusCounts).toEqual({ "Em construção": 8, "Em funcionamento": 65, "Não informado": 25 });
  });

  it("mantém os campos territoriais necessários para busca e mapa", () => {
    for (const unit of data.units) {
      expect(unit.name).toBeTruthy();
      expect(unit.municipality).not.toBe("Não informado");
      expect(unit.rd).not.toBe("Não informado");
      expect(unit.ibgeCode).toMatch(/^26\d{5}$/);
      expect(Boolean(data.map.paths[unit.ibgeCode!] || data.map.fallbackCenters?.[unit.ibgeCode!])).toBe(true);
    }
    const unitsWithoutGeres = data.units.filter((unit) => unit.geres === "Não informado");
    expect(unitsWithoutGeres).toHaveLength(6);
    expect(unitsWithoutGeres.every((unit) => unit.type === "Rede Credenciada" && unit.status === "Não informado")).toBe(true);
  });

  it("reconcilia os totais e a cobertura reportada", () => {
    expect(data.meta.totalUnits).toBe(data.units.length);
    expect(data.meta.totalMunicipalities).toBe(new Set(data.units.map((unit) => unit.municipality)).size);
    expect(data.meta.totalBeds).toBe(data.units.reduce((sum, unit) => sum + (unit.beds ?? 0), 0));
    expect(data.meta.totalBeds).toBe(6796);
    expect(data.meta.plannedBeds).toBe(data.units.reduce((sum, unit) => sum + (unit.plannedBeds ?? 0), 0));
    expect(data.meta.plannedBeds).toBe(861);
    expect(data.meta.bedsOpenedInManagement).toBe(data.units.reduce((sum, unit) => sum + (unit.bedsOpenedInManagement ?? 0), 0));
    expect(data.meta.bedsOpenedInManagement).toBe(865);
    expect(data.meta.unitsWithBedsOpenedInManagement).toBe(38);
    expect(data.meta.bedsToOpenAfterRenovation).toBe(data.units.reduce((sum, unit) => sum + (unit.bedsToOpenAfterRenovation ?? 0), 0));
    expect(data.meta.bedsToOpenAfterRenovation).toBe(642);
    expect(data.meta.unitsWithBedsToOpenAfterRenovation).toBe(5);
    expect(data.meta.constructionUnitsWithBeds).toBe(5);
    expect(data.meta.constructionMunicipalities).toBe(6);
    expect(data.meta.totalMunicipalities).toBe(30);
    expect(data.meta.typeCounts).toEqual({ Hospital: 40, "Rede Credenciada": 25, UPA: 14, UPAE: 16, "UPAE-R": 3 });
    expect(data.filters.statuses).toEqual(["Em funcionamento", "Em construção", "Não informado"]);
    expect(data.dataQuality.sourceCoverage).toMatchObject({
      operationalBeds: 50,
      plannedBeds: 5,
      status: 73,
      operationalProfile: 65,
      plannedProfile: 3,
      bedsOpenedInManagement: 38,
      openedBedTypes: 38,
      bedsToOpenAfterRenovation: 5,
      managementInvestment: 64,
      constructionInvestment: 0,
      cofinancing2022: 16,
      cofinancing2025: 16,
      osTransfer2025: 16,
      professionalBreakdown: 39,
    });
    expect(data.units.filter((unit) => unit.managementInvestment.amount !== null)).toHaveLength(64);
    expect(data.dataQuality.corrections).toHaveLength(1);
    expect(data.dataQuality.possibleDuplicates).toEqual([{
      unitName: "Hospital Memorial de Pernambuco",
      municipality: "Caruaru",
      sourceRows: [19, 21],
    }]);
  });

  it("mantém expansão, estoque operacional e novas obras como medidas distintas", () => {
    const barao = data.units.find((unit) => unit.id === "hospital-barao-de-lucena-hbl");
    const otavio = data.units.find((unit) => unit.id === "hospital-otavio-de-freitas-hof");
    const agreste = data.units.find((unit) => unit.id === "hospital-regional-do-agreste-hra");

    expect(barao).toMatchObject({
      type: "Hospital",
      beds: 311,
      bedsOpenedInManagement: 10,
      openedBedTypes: "UTI Pediátrica",
      bedsToOpenAfterRenovation: 71,
    });
    expect(otavio).toMatchObject({
      bedsOpenedInManagement: 20,
      bedsToOpenAfterRenovation: 146,
    });
    expect(agreste).toMatchObject({ bedsOpenedInManagement: null, bedsToOpenAfterRenovation: 288 });
    expect(data.units.filter((unit) => unit.status === "Em construção").every((unit) => (
      unit.bedsOpenedInManagement === null
      && unit.openedBedTypes === null
      && unit.bedsToOpenAfterRenovation === null
    ))).toBe(true);
  });

  it("publica a correção de investimento do Hospital da Restauração", () => {
    const restauracao = data.units.find((unit) => unit.id === "hospital-da-restauracao-hr");
    expect(restauracao?.managementInvestment).toEqual({ amount: 176_573_825.3, label: null });
  });

  it("preserva as lacunas declaradas da Rede Credenciada sem inferir operação", () => {
    const credentialedUnits = data.units.filter((unit) => unit.type === "Rede Credenciada");
    expect(credentialedUnits).toHaveLength(25);
    expect(new Set(credentialedUnits.map((unit) => unit.municipality)).size).toBe(15);
    expect(credentialedUnits.every((unit) => (
      unit.status === "Não informado"
      && unit.beds === null
      && unit.plannedBeds === null
    ))).toBe(true);
    expect(credentialedUnits.reduce((sum, unit) => sum + (unit.bedsOpenedInManagement ?? 0), 0)).toBe(696);
    expect(credentialedUnits.every((unit) => unit.openedBedTypes !== null)).toBe(true);
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
    expect(constructionUnits.every((unit) => unit.source.references.some((reference) => reference.sheet === "UNIDADES EM CONSTRUÇÃO"))).toBe(true);
    expect(constructionUnits.reduce((sum, unit) => sum + (unit.plannedBeds ?? 0), 0)).toBe(861);

    const allMapMunicipalities = new Set(data.units.map((unit) => unit.ibgeCode));
    const constructionMapMunicipalities = new Set(constructionUnits.map((unit) => unit.ibgeCode));
    expect(allMapMunicipalities.size).toBe(30);
    expect(constructionMapMunicipalities.size).toBe(6);
  });
});
