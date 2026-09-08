import { Check, ChevronDown, Search, X } from "lucide-react";
import type { DashboardData, Filters } from "../types";

type Props = {
  filters: Filters;
  options: DashboardData["filters"];
  onChange: (filters: Filters) => void;
  resultCount: number;
};

export function MultiSelectField({
  id,
  label,
  values,
  options,
  onChange,
}: {
  id: string;
  label: string;
  values: string[];
  options: string[];
  onChange: (values: string[]) => void;
}) {
  const summary = values.length === 0
    ? "Todos"
    : values.length === 1
      ? values[0]
      : `${values.length} selecionados`;

  const toggle = (option: string) => {
    onChange(values.includes(option)
      ? values.filter((value) => value !== option)
      : [...values, option]);
  };

  return (
    <div className={`field multi-select-field field-${id}`}>
      <span id={`${id}-label`}>{label}</span>
      <details className="multi-select" name="unit-filters">
        <summary aria-labelledby={`${id}-label ${id}-summary`}>
          <span id={`${id}-summary`}>{summary}</span>
          <ChevronDown size={17} aria-hidden="true" />
        </summary>
        <div className="multi-select-menu" role="group" aria-labelledby={`${id}-label`}>
          <div className="multi-select-menu-heading">
            <strong>Selecione uma ou mais</strong>
            {values.length > 0 && <button type="button" onClick={() => onChange([])}>Todos</button>}
          </div>
          {options.map((option) => {
            const checked = values.includes(option);
            return (
              <label key={option} className={checked ? "is-selected" : ""}>
                <input type="checkbox" checked={checked} onChange={() => toggle(option)} />
                <span>{option}</span>
                <i aria-hidden="true">{checked && <Check size={14} />}</i>
              </label>
            );
          })}
        </div>
      </details>
    </div>
  );
}

export function FilterBar({ filters, options, onChange, resultCount }: Props) {
  const hasFilters = Boolean(filters.query) || filters.municipality.length > 0 || filters.rd.length > 0 || filters.geres.length > 0 || filters.type.length > 0 || filters.status.length > 0;
  const setQuery = (value: string) => onChange({ ...filters, query: value });
  const set = (key: Exclude<keyof Filters, "query">, value: string[]) => onChange({ ...filters, [key]: value });
  const reset = () => onChange({ query: "", municipality: [], rd: [], geres: [], type: [], status: [] });

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
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nome, endereço, município, RD ou GERES"
          />
        </span>
      </label>
      <MultiSelectField id="municipality" label="Município" values={filters.municipality} options={options.municipalities} onChange={(value) => set("municipality", value)} />
      <MultiSelectField id="rd" label="RD" values={filters.rd} options={options.rds} onChange={(value) => set("rd", value)} />
      <MultiSelectField id="geres" label="GERES" values={filters.geres} options={options.geres} onChange={(value) => set("geres", value)} />
      <MultiSelectField id="unit-type" label="Tipo" values={filters.type} options={options.types} onChange={(value) => set("type", value)} />
      <MultiSelectField id="unit-status" label="Status" values={filters.status} options={options.statuses} onChange={(value) => set("status", value)} />
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
