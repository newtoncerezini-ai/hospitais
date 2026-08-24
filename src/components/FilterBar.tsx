import { Search, X } from "lucide-react";
import { ALL } from "../lib/format";
import type { DashboardData, Filters } from "../types";

type Props = {
  filters: Filters;
  options: DashboardData["filters"];
  onChange: (filters: Filters) => void;
  resultCount: number;
};

function SelectField({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value={ALL}>{ALL}</option>
        {options.filter((option) => option !== "Não informado").map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

export function FilterBar({ filters, options, onChange, resultCount }: Props) {
  const hasFilters = Object.values(filters).some((value) => value && value !== ALL);
  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });
  const reset = () => onChange({ query: "", municipality: ALL, rd: ALL, geres: ALL, type: ALL, status: ALL });

  return (
    <section className="filter-panel" aria-label="Filtros das unidades">
      <label className="field search-field" htmlFor="unit-search">
        <span>Unidade de saúde</span>
        <span className="input-with-icon">
          <Search size={18} aria-hidden="true" />
          <input
            id="unit-search"
            type="search"
            value={filters.query}
            onChange={(event) => set("query", event.target.value)}
            placeholder="Nome, endereço, município, RD ou GERES"
          />
        </span>
      </label>
      <SelectField id="municipality" label="Município" value={filters.municipality} options={options.municipalities} onChange={(value) => set("municipality", value)} />
      <SelectField id="rd" label="RD" value={filters.rd} options={options.rds} onChange={(value) => set("rd", value)} />
      <SelectField id="geres" label="GERES" value={filters.geres} options={options.geres} onChange={(value) => set("geres", value)} />
      <SelectField id="unit-type" label="Tipo" value={filters.type} options={options.types} onChange={(value) => set("type", value)} />
      <SelectField id="unit-status" label="Status" value={filters.status} options={options.statuses} onChange={(value) => set("status", value)} />
      <div className="filter-result" aria-live="polite">
        <strong>{resultCount}</strong>
        <span>{resultCount === 1 ? "unidade" : "unidades"}</span>
        {hasFilters && (
          <button type="button" className="text-button" onClick={reset}>
            <X size={15} aria-hidden="true" /> Limpar
          </button>
        )}
      </div>
    </section>
  );
}
