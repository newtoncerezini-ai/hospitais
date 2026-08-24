import { Download, Eye, MapPin, SlidersHorizontal } from "lucide-react";
import { FilterBar } from "../components/FilterBar";
import { displayValue, downloadUnitsCsv, formatMoney, typeClass } from "../lib/format";
import type { DashboardData, Filters, HealthUnit } from "../types";

type Props = {
  data: DashboardData;
  units: HealthUnit[];
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onOpenUnit: (unit: HealthUnit) => void;
};

const cellText = (value: string | null) => <span className="clamped-cell" title={value ?? "Não informado"}>{displayValue(value)}</span>;

export function UnitsView({ data, units, filters, onFiltersChange, onOpenUnit }: Props) {
  return (
    <div className="units-page">
      <FilterBar filters={filters} options={data.filters} onChange={onFiltersChange} resultCount={units.length} />

      <section className="panel table-panel">
        <div className="panel-heading table-heading">
          <div><h2>Lista consolidada</h2><p>Todos os campos solicitados, com ausências identificadas como “Não informado”.</p></div>
          <button type="button" className="button secondary" onClick={() => downloadUnitsCsv(units)} disabled={!units.length}>
            <Download size={17} aria-hidden="true" /> Exportar CSV
          </button>
        </div>

        {units.length ? (
          <>
            <div className="table-scroll desktop-table" tabIndex={0} aria-label="Tabela de unidades de saúde; role para ver todas as colunas">
              <table>
                <thead>
                  <tr>
                    <th>Unidade de saúde</th><th>Município</th><th>Endereço</th><th>RD</th><th>GERES</th><th>Leitos</th><th>Perfil</th><th>Tipo</th><th>Tipo de gestão</th><th>Gestão</th><th>Contrato de manutenção</th><th>Investimento na gestão</th><th>Principais avanços</th><th><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((unit) => (
                    <tr key={unit.id}>
                      <td className="sticky-name"><button type="button" className="unit-name-button" onClick={() => onOpenUnit(unit)}>{unit.name}</button></td>
                      <td>{unit.municipality}</td>
                      <td>{cellText(unit.address)}</td>
                      <td>{unit.rd}</td>
                      <td><span className="geres-tag">{unit.geres}</span></td>
                      <td className="numeric-cell">{displayValue(unit.beds)}</td>
                      <td>{cellText(unit.profile)}</td>
                      <td><span className={`type-badge ${typeClass(unit.type)}`}>{unit.type}</span></td>
                      <td>{displayValue(unit.managementType)}</td>
                      <td>{displayValue(unit.management)}</td>
                      <td className="money-cell">{formatMoney(unit.maintenanceContract, true)}</td>
                      <td className="money-cell">{formatMoney(unit.managementInvestment, true)}</td>
                      <td>{cellText(unit.mainAdvances)}</td>
                      <td><button type="button" className="icon-button" aria-label={`Abrir ficha de ${unit.name}`} onClick={() => onOpenUnit(unit)}><Eye size={18} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mobile-unit-list">
              {units.map((unit) => (
                <article key={unit.id} className="mobile-unit-card">
                  <header><span className={`type-badge ${typeClass(unit.type)}`}>{unit.type}</span><span>{unit.geres} GERES</span></header>
                  <h3>{unit.name}</h3>
                  <p><MapPin size={16} /> {unit.municipality} · {displayValue(unit.address)}</p>
                  <dl><div><dt>Leitos</dt><dd>{displayValue(unit.beds)}</dd></div><div><dt>Gestão</dt><dd>{displayValue(unit.management)}</dd></div><div><dt>RD</dt><dd>{unit.rd}</dd></div></dl>
                  <details className="mobile-unit-details">
                    <summary>Ver todos os campos</summary>
                    <dl>
                      <div><dt>Perfil</dt><dd>{displayValue(unit.profile)}</dd></div>
                      <div><dt>Tipo de gestão</dt><dd>{displayValue(unit.managementType)}</dd></div>
                      <div><dt>Contrato de manutenção</dt><dd>{formatMoney(unit.maintenanceContract)}</dd></div>
                      <div><dt>Investimento na gestão</dt><dd>{formatMoney(unit.managementInvestment)}</dd></div>
                      <div><dt>Principais avanços</dt><dd>{displayValue(unit.mainAdvances)}</dd></div>
                    </dl>
                  </details>
                  <button type="button" className="button primary" onClick={() => onOpenUnit(unit)}>Gerar ficha técnica <Eye size={17} /></button>
                </article>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <SlidersHorizontal size={28} aria-hidden="true" />
            <h3>Nenhuma unidade encontrada</h3>
            <p>Revise o texto ou limpe um dos filtros para ampliar a busca.</p>
          </div>
        )}
      </section>
    </div>
  );
}
