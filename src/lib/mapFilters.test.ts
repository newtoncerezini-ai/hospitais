import { describe, expect, it } from "vitest";
import { filterMapUnits, matchesMapSignal } from "./mapFilters";
import type { HealthUnit } from "../types";

function unit(overrides: Partial<HealthUnit>): HealthUnit {
  return {
    id: "sample",
    ibgeCode: "2611606",
    name: "Unidade de teste",
    municipality: "Recife",
    sourceMunicipality: null,
    rd: "Metropolitana",
    geres: "I",
    address: null,
    status: "Em funcionamento",
    type: "Hospital",
    managementType: null,
    management: null,
    beds: null,
    plannedBeds: null,
    bedsOpenedInManagement: null,
    openedBedTypes: null,
    bedsToOpenAfterRenovation: null,
    profile: null,
    professionals: null,
    calledProfessionals: null,
    maintenanceContract: { amount: null, label: null },
    managementInvestment: { amount: null, label: null },
    constructionInvestment: { amount: null, label: null },
    mainAdvances: null,
    latitude: null,
    longitude: null,
    source: { sheet: "Consolidado", row: 2, supplemental: null },
    enrichment: { rd: "workbook", geres: "workbook", municipalityCorrected: false, investment: "source", construction: "source-row" },
    ...overrides,
  };
}

describe("filtros dinâmicos do mapa", () => {
  const hospital = unit({ id: "hospital", mainAdvances: "Reforma", managementInvestment: { amount: 10, label: null } });
  const construction = unit({ id: "construction", type: "UPAE-R", status: "Em construção", plannedBeds: 40 });
  const credentialed = unit({ id: "credentialed", type: "Rede Credenciada", status: "Não informado", bedsOpenedInManagement: 20 });

  it("combina tipos e status selecionados", () => {
    expect(filterMapUnits(
      [hospital, construction, credentialed],
      ["Hospital", "UPAE-R"],
      ["Em funcionamento", "Em construção"],
      [],
    ).map((item) => item.id)).toEqual(["hospital", "construction"]);
  });

  it("combina evidências selecionadas com lógica inclusiva", () => {
    expect(filterMapUnits(
      [hospital, construction, credentialed],
      ["Hospital", "UPAE-R", "Rede Credenciada"],
      ["Em funcionamento", "Em construção", "Não informado"],
      ["advances", "bedExpansion"],
    ).map((item) => item.id)).toEqual(["hospital", "construction", "credentialed"]);
  });

  it("reconhece investimento e expansão sem misturar os indicadores", () => {
    expect(matchesMapSignal(hospital, "investment")).toBe(true);
    expect(matchesMapSignal(hospital, "bedExpansion")).toBe(false);
    expect(matchesMapSignal(construction, "bedExpansion")).toBe(true);
  });
});
