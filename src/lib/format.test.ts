import { describe, expect, it } from "vitest";

import type { Filters, HealthUnit } from "../types";
import { ALL, filterUnits, formatMoney, normalizeSearch } from "./format";

const makeUnit = (overrides: Partial<HealthUnit> = {}): HealthUnit => ({
  id: "hospital-agamenon-magalhaes",
  ibgeCode: "2611606",
  name: "Hospital Agamenon Magalhães",
  municipality: "Recife",
  sourceMunicipality: null,
  rd: "Metropolitana",
  geres: "I",
  address: "Estrada do Arraial, 2723, Casa Amarela",
  status: "Em funcionamento",
  type: "Hospital",
  managementType: "Gestão própria",
  management: "SES",
  beds: 382,
  profile: "Urgência e emergência",
  professionals: null,
  calledProfessionals: null,
  maintenanceContract: { amount: 10_638_677.03, label: null },
  managementInvestment: { amount: null, label: null },
  mainAdvances: null,
  latitude: null,
  longitude: null,
  source: { sheet: "Consolidado", row: 2 },
  enrichment: {
    rd: "workbook-municipality-template",
    geres: "municipality-mode",
    municipalityCorrected: false,
    investment: "consolidated",
  },
  ...overrides,
});

const allFilters = (overrides: Partial<Filters> = {}): Filters => ({
  query: "",
  municipality: ALL,
  rd: ALL,
  geres: ALL,
  type: ALL,
  ...overrides,
});

describe("normalizeSearch", () => {
  it("normaliza acentos, caixa e espaços para a busca", () => {
    expect(normalizeSearch("  HOSPITAL\tBarão  de\nLucena  ")).toBe(
      "hospital barao de lucena",
    );
  });

  it("trata valores ausentes como texto vazio", () => {
    expect(normalizeSearch(null)).toBe("");
    expect(normalizeSearch(undefined)).toBe("");
  });
});

describe("filterUnits", () => {
  const units = [
    makeUnit(),
    makeUnit({
      id: "upae-petrolina",
      name: "UPAE Petrolina",
      municipality: "Petrolina",
      rd: "Sertão do São Francisco",
      geres: "VIII",
      address: null,
      type: "UPAE",
    }),
    makeUnit({
      id: "upa-sao-lourenco",
      name: "UPA Professor Fernando Figueira",
      municipality: "São Lourenço da Mata",
      rd: "Metropolitana",
      geres: "I",
      address: "Rodovia BR-408",
      type: "UPA",
    }),
  ];

  it.each([
    ["agamenon magalhaes", "hospital-agamenon-magalhaes"],
    ["SAO LOURENCO", "upa-sao-lourenco"],
    ["br-408", "upa-sao-lourenco"],
    ["sertao do sao francisco", "upae-petrolina"],
    ["viii", "upae-petrolina"],
  ])("busca por texto normalizado: %s", (query, expectedId) => {
    expect(filterUnits(units, allFilters({ query })).map((unit) => unit.id)).toEqual([
      expectedId,
    ]);
  });

  it("combina município, RD, GERES e tipo com correspondência exata", () => {
    const result = filterUnits(
      units,
      allFilters({
        municipality: "Recife",
        rd: "Metropolitana",
        geres: "I",
        type: "Hospital",
      }),
    );

    expect(result.map((unit) => unit.id)).toEqual(["hospital-agamenon-magalhaes"]);
    expect(filterUnits(units, allFilters({ municipality: "Recife", type: "UPA" }))).toEqual([]);
  });

  it("mantém todas as unidades quando a busca está vazia e os filtros estão em Todos", () => {
    expect(filterUnits(units, allFilters())).toEqual(units);
  });
});

describe("formatMoney", () => {
  it("formata valores completos em reais no padrão brasileiro", () => {
    expect(formatMoney({ amount: 1234.56, label: null })).toBe("R$\u00a01.234,56");
  });

  it("formata valores compactos quando solicitado", () => {
    expect(formatMoney({ amount: 1_200_000, label: null }, true)).toBe("R$\u00a01,2\u00a0mi");
  });

  it("preserva zero como valor monetário e prioriza amount sobre label", () => {
    expect(formatMoney({ amount: 0, label: "A pactuar" })).toBe("R$\u00a00,00");
  });

  it("usa o rótulo quando a base não contém um valor numérico", () => {
    expect(formatMoney({ amount: null, label: "Em contratação" })).toBe("Em contratação");
    expect(formatMoney({ amount: null, label: null })).toBe("Não informado");
  });
});
