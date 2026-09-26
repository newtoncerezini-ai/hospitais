import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { DashboardData } from "./types";

const dataPath = path.resolve(process.cwd(), "public/data/health-units.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf-8")) as DashboardData;

describe("base publicada", () => {
  it("publica as 97 unidades únicas do Compilado total", () => {
    expect(data.units).toHaveLength(97);
    expect(new Set(data.units.map((unit) => unit.id)).size).toBe(97);
    expect(new Set(data.units.map((unit) => unit.sourceUnitCode)).size).toBe(97);
    expect(data.meta.activeUnits).toBe(65);
    expect(data.meta.constructionUnits).toBe(8);
    expect(data.meta.unitsWithoutStatus).toBe(24);
    expect(data.meta.statusCounts).toEqual({ "Em construção": 8, "Em funcionamento": 65, "Não informado": 24 });
  });

  it("mantém os campos territoriais necessários para busca e mapa", () => {
    for (const unit of data.units) {
      expect(unit.name).toBeTruthy();
      expect(unit.municipality).not.toBe("Não informado");
      expect(unit.rd).not.toBe("Não informado");
      expect(unit.ibgeCode).toMatch(/^26\d{5}$/);
      expect(Boolean(data.map.paths[unit.ibgeCode!] || data.map.fallbackCenters?.[unit.ibgeCode!])).toBe(true);
    }
    expect(data.units.filter((unit) => unit.geres === "Não informado")).toHaveLength(0);
  });

  it("reconcilia os totais e a cobertura reportada", () => {
    expect(data.meta.totalUnits).toBe(data.units.length);
    expect(data.meta.totalMunicipalities).toBe(new Set(data.units.map((unit) => unit.municipality)).size);
    expect(data.meta.totalBeds).toBe(data.units.reduce((sum, unit) => sum + (unit.beds ?? 0), 0));
    expect(data.meta.totalBeds).toBe(6782);
    expect(data.meta.plannedBeds).toBe(data.units.reduce((sum, unit) => sum + (unit.plannedBeds ?? 0), 0));
    expect(data.meta.plannedBeds).toBe(861);
    expect(data.meta.bedsOpenedInManagement).toBe(data.units.reduce((sum, unit) => sum + (unit.bedsOpenedInManagement ?? 0), 0));
    expect(data.meta.bedsOpenedInManagement).toBe(1258);
    expect(data.meta.unitsWithBedsOpenedInManagement).toBe(40);
    expect(data.meta.bedsToOpenAfterRenovation).toBe(data.units.reduce((sum, unit) => sum + (unit.bedsToOpenAfterRenovation ?? 0), 0));
    expect(data.meta.bedsToOpenAfterRenovation).toBe(642);
    expect(data.meta.unitsWithBedsToOpenAfterRenovation).toBe(5);
    expect(data.meta.constructionUnitsWithBeds).toBe(5);
    expect(data.meta.constructionMunicipalities).toBe(6);
    expect(data.meta.totalMunicipalities).toBe(30);
    expect(data.meta.typeCounts).toEqual({ Hospital: 40, "Rede Credenciada": 24, UPA: 14, UPAE: 16, "UPAE-R": 3 });
    expect(data.meta.investmentTotal2023To2026).toBeCloseTo(1_845_951_289.14, 2);
    expect(data.meta.costTotal2023To2026).toBeCloseTo(4_650_851_993.79, 2);
    expect(data.filters.statuses).toEqual(["Em funcionamento", "Em construção", "Não informado"]);
    expect(data.dataQuality.sourceCoverage).toMatchObject({
      operationalBeds: 50,
      plannedBeds: 5,
      status: 73,
      operationalProfile: 65,
      plannedProfile: 7,
      bedsOpenedInManagement: 40,
      openedBedTypes: 38,
      bedsToOpenAfterRenovation: 5,
      managementInvestment: 65,
      constructionInvestment: 8,
      cofinancing2022: 16,
      cofinancing2025: 16,
      osTransfer2025: 44,
      sourceUnitCode: 97,
      investmentTotal2023To2026: 97,
      costTotal2023To2026: 97,
      professionalBreakdown: 39,
    });
    expect(data.units.filter((unit) => unit.managementInvestment.amount !== null)).toHaveLength(65);
    expect(data.dataQuality.corrections).toHaveLength(0);
    expect(data.dataQuality.possibleDuplicates).toEqual([]);
  });

  it("mantém expansão, estoque operacional e novas obras como medidas distintas", () => {
    const barao = data.units.find((unit) => unit.id === "hospital-barao-de-lucena-hbl");
    const otavio = data.units.find((unit) => unit.id === "hospital-otavio-de-freitas-hof");
    const agreste = data.units.find((unit) => unit.id === "hospital-regional-do-agreste-hra");

    expect(barao).toMatchObject({
      type: "Hospital",
      beds: 379,
      bedsOpenedInManagement: 25,
      openedBedTypes: "10 leitos de UTI Pediátrica 15 leitos de Enfermaria pediátrica",
      bedsToOpenAfterRenovation: 71,
    });
    expect(otavio).toMatchObject({
      bedsOpenedInManagement: null,
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
    expect(restauracao?.managementInvestment).toEqual({ amount: 199_166_096.49, label: null });
  });

  it("preserva todos os repasses de 2025 informados pela nova fonte", () => {
    const unitsWithOsTransfer = data.units.filter((unit) => unit.osTransfer2025.amount !== null || unit.osTransfer2025.label !== null);
    expect(unitsWithOsTransfer).toHaveLength(44);
    expect(unitsWithOsTransfer.every((unit) => unit.managementType === "OSS")).toBe(true);
    expect(data.units.find((unit) => unit.id === "hospital-dom-malan")?.osTransfer2025.amount).toBe(100_419_517.08);
    expect(data.units.find((unit) => unit.id === "hospital-da-mulher-do-agreste")?.osTransfer2025.amount).toBe(44_712_253.07);
  });

  it("preserva as lacunas declaradas da Rede Credenciada sem inferir operação", () => {
    const credentialedUnits = data.units.filter((unit) => unit.type === "Rede Credenciada");
    expect(credentialedUnits).toHaveLength(24);
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
    expect(constructionUnits.every((unit) => unit.source.sheet === "Compilado total")).toBe(true);
    expect(constructionUnits.reduce((sum, unit) => sum + (unit.plannedBeds ?? 0), 0)).toBe(861);

    const allMapMunicipalities = new Set(data.units.map((unit) => unit.ibgeCode));
    const constructionMapMunicipalities = new Set(constructionUnits.map((unit) => unit.ibgeCode));
    expect(allMapMunicipalities.size).toBe(30);
    expect(constructionMapMunicipalities.size).toBe(6);
  });
});
