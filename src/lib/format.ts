import type { Filters, HealthUnit, MoneyValue } from "../types";

export function normalizeSearch(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

export function filterUnits(units: HealthUnit[], filters: Filters): HealthUnit[] {
  const query = normalizeSearch(filters.query);
  return units.filter((unit) => {
    const haystack = normalizeSearch(
      [unit.name, unit.municipality, unit.address, unit.rd, unit.geres, unit.status].filter(Boolean).join(" "),
    );
    return (
      (!query || haystack.includes(query)) &&
      (filters.municipality.length === 0 || filters.municipality.includes(unit.municipality)) &&
      (filters.rd.length === 0 || filters.rd.includes(unit.rd)) &&
      (filters.geres.length === 0 || filters.geres.includes(unit.geres)) &&
      (filters.type.length === 0 || filters.type.includes(unit.type)) &&
      (filters.status.length === 0 || filters.status.includes(unit.status))
    );
  });
}

export function displayValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "" || value === "-") return "Não informado";
  return String(value);
}

const fullCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatMoney(value: MoneyValue, compact = false): string {
  if (value.amount !== null) return (compact ? compactCurrency : fullCurrency).format(value.amount);
  return displayValue(value.label);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function typeClass(type: string): string {
  return `type-${normalizeSearch(type).replace(/[^a-z0-9]/g, "-")}`;
}

export function statusClass(status: string): string {
  return `status-${normalizeSearch(status).replace(/[^a-z0-9]/g, "-")}`;
}

export function isConstructionStatus(status: string | null | undefined): boolean {
  return normalizeSearch(status) === "em construcao";
}

export function downloadUnitsCsv(units: HealthUnit[]): void {
  const columns: Array<[string, (unit: HealthUnit) => string | number | null]> = [
    ["Unidade de saúde", (unit) => unit.name],
    ["Status", (unit) => unit.status],
    ["Município", (unit) => unit.municipality],
    ["Endereço", (unit) => unit.address],
    ["RD", (unit) => unit.rd],
    ["GERES", (unit) => unit.geres],
    ["Leitos em funcionamento", (unit) => unit.beds],
    ["Leitos previstos", (unit) => unit.plannedBeds],
    ["Leitos abertos nesta gestão", (unit) => unit.bedsOpenedInManagement],
    ["Tipos de leitos abertos nesta gestão", (unit) => unit.openedBedTypes],
    ["Leitos a abrir com o fim das reformas", (unit) => unit.bedsToOpenAfterRenovation],
    ["Perfil", (unit) => unit.profile],
    ["Tipo", (unit) => unit.type],
    ["Tipo de gestão", (unit) => unit.managementType],
    ["Gestão", (unit) => unit.management],
    ["Contrato de manutenção", (unit) => formatMoney(unit.maintenanceContract)],
    ["Investimento na gestão", (unit) => formatMoney(unit.managementInvestment)],
    ["Investimento para obra e equipagem", (unit) => formatMoney(unit.constructionInvestment)],
    ["Principais avanços", (unit) => unit.mainAdvances],
  ];
  const quote = (value: string | number | null) => `"${displayValue(value).replace(/"/g, '""')}"`;
  const csv = [
    columns.map(([label]) => quote(label)).join(";"),
    ...units.map((unit) => columns.map(([, getter]) => quote(getter(unit))).join(";")),
  ].join("\r\n");
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "unidades-saude-pernambuco.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}
