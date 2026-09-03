import type { HealthUnit } from "../types";

export type MapSignal = "advances" | "bedExpansion" | "investment";

export const MAP_SIGNAL_LABELS: Record<MapSignal, string> = {
  advances: "Avanços registrados",
  bedExpansion: "Expansão de leitos",
  investment: "Investimento informado",
};

export function matchesMapSignal(unit: HealthUnit, signal: MapSignal) {
  if (signal === "advances") return Boolean(unit.mainAdvances);
  if (signal === "bedExpansion") {
    return unit.plannedBeds !== null
      || unit.bedsOpenedInManagement !== null
      || unit.bedsToOpenAfterRenovation !== null;
  }
  return unit.managementInvestment.amount !== null
    || unit.managementInvestment.label !== null
    || unit.constructionInvestment.amount !== null
    || unit.constructionInvestment.label !== null;
}

export function filterMapUnits(
  units: HealthUnit[],
  selectedTypes: string[],
  selectedStatuses: string[],
  selectedSignals: MapSignal[],
) {
  return units.filter((unit) => (
    selectedTypes.includes(unit.type)
    && selectedStatuses.includes(unit.status)
    && (selectedSignals.length === 0 || selectedSignals.some((signal) => matchesMapSignal(unit, signal)))
  ));
}
