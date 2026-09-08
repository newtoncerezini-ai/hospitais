import { useMemo, useState } from "react";
import { ArrowLeft, BedDouble, Building2, FileDown, Files, MapPin, Printer, Settings2, UsersRound, Wrench } from "lucide-react";
import { FilterBar, MultiSelectField } from "../components/FilterBar";
import { filterUnits, formatMoney, formatNumber, isConstructionStatus, normalizeSearch, statusClass, typeClass } from "../lib/format";
import type { DashboardData, Filters, HealthUnit, MoneyValue } from "../types";

type Props = {
  units: HealthUnit[];
  selected: HealthUnit;
  filterOptions: DashboardData["filters"];
  onSelect: (id: string) => void;
};

const EMPTY_FILTERS: Filters = { query: "", municipality: [], rd: [], geres: [], type: [], status: [] };

function hasValue(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  const normalized = normalizeSearch(String(value));
  return Boolean(normalized && !["-", "nao informado", "aguardando informacao", "nao encontrado"].includes(normalized));
}

function hasMoney(value: MoneyValue): boolean {
  return value.amount !== null || hasValue(value.label);
}

function formatPercentage(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function DetailBlock({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`sheet-detail-block ${className}`.trim()}><h2>{title}</h2>{children}</section>;
}

function TechnicalSheet({ unit, sequence }: { unit: HealthUnit; sequence?: number }) {
  const isConstruction = isConstructionStatus(unit.status);
  const displayedBeds = isConstruction ? unit.plannedBeds : unit.beds;
  const displayedInvestment = isConstruction ? unit.constructionInvestment : unit.managementInvestment;
  const isOss = normalizeSearch(unit.managementType).includes("oss") || hasMoney(unit.osTransfer2025);
  const hasManagementName = hasValue(unit.management) && (!isOss || normalizeSearch(unit.management) !== "oss");
  const territoryParts = [
    hasValue(unit.municipality) ? unit.municipality : null,
    hasValue(unit.rd) ? unit.rd : null,
    hasValue(unit.geres) ? `${unit.geres} GERES` : null,
  ].filter(Boolean);
  const hasBedExpansion = !isConstruction && (
    unit.bedsOpenedInManagement !== null
    || hasValue(unit.openedBedTypes)
    || unit.bedsToOpenAfterRenovation !== null
  );
  const hasFinancialDetails = hasMoney(unit.cofinancing2022)
    || hasMoney(unit.cofinancing2025)
    || unit.cofinancingIncreasePercent !== null
    || hasMoney(unit.osTransfer2025)
    || hasValue(unit.professionals)
    || unit.calledProfessionals !== null;

  return (
    <article className="technical-sheet">
      <header className="sheet-identity">
        <div className="sheet-title">
          <div className="sheet-marks">
            {hasValue(unit.type) && <span className={`type-badge ${typeClass(unit.type)}`}>{unit.type}</span>}
            {hasValue(unit.status) && <span className={`status-badge ${statusClass(unit.status)}`}>{unit.status}</span>}
          </div>
          <h2>{unit.name}</h2>
          {territoryParts.length > 0 && <p><MapPin size={17} /> {territoryParts.join(" · ")}</p>}
          {hasValue(unit.address) && <address>{unit.address}</address>}
        </div>
        <div className="sheet-document-mark"><FileDown size={23} /><span>Ficha técnica</span><strong>{sequence ? `${String(sequence).padStart(2, "0")} · ` : ""}PE · 2026</strong></div>
      </header>

      <section className="sheet-kpis">
        {displayedBeds !== null && <div><Building2 size={22} /><span>{isConstruction ? "Leitos previstos" : "Leitos em funcionamento"}</span><strong>{formatNumber(displayedBeds)}</strong></div>}
        {hasMoney(unit.maintenanceContract) && <div className="maintenance-highlight"><Wrench size={22} /><span>Contrato de manutenção predial</span><strong>{formatMoney(unit.maintenanceContract, true)}</strong><small>valor anual informado</small></div>}
        {hasValue(unit.managementType) && <div><UsersRound size={22} /><span>Tipo de gestão</span><strong>{unit.managementType}</strong></div>}
        {hasManagementName && <div><span>{isOss ? "Organização social responsável" : "Gestão"}</span><strong>{unit.management}</strong><small>{unit.type}</small></div>}
        {hasMoney(displayedInvestment) && <div><span>{isConstruction ? "Investimento para obra e equipagem" : "Investimento na gestão"}</span><strong>{formatMoney(displayedInvestment, true)}</strong><small>valor disponível na base</small></div>}
      </section>

      <div className="sheet-content-grid">
        {hasBedExpansion && (
          <section className="sheet-detail-block bed-evolution-block">
            <div className="sheet-section-heading"><BedDouble size={20} /><h2>Expansão de leitos nesta gestão</h2></div>
            <dl className="detail-list">
              {unit.bedsOpenedInManagement !== null && <div><dt>Leitos abertos nesta gestão</dt><dd>{formatNumber(unit.bedsOpenedInManagement)}</dd></div>}
              {hasValue(unit.openedBedTypes) && <div><dt>Tipos de leitos abertos</dt><dd>{unit.openedBedTypes}</dd></div>}
              {unit.bedsToOpenAfterRenovation !== null && <div><dt>Leitos a abrir com o fim das reformas</dt><dd>{formatNumber(unit.bedsToOpenAfterRenovation)}</dd></div>}
            </dl>
            <p className="bed-evolution-note">Indicadores de expansão: não são somados automaticamente aos leitos atualmente em funcionamento.</p>
          </section>
        )}

        {hasValue(unit.profile) && <DetailBlock title={isConstruction ? "Perfil assistencial previsto" : "Perfil assistencial"}><p className="long-copy">{unit.profile}</p></DetailBlock>}

        <DetailBlock title="Território e gestão">
          <dl className="detail-list">
            {hasValue(unit.municipality) && <div><dt>Município</dt><dd>{unit.municipality}</dd></div>}
            {hasValue(unit.rd) && <div><dt>Região de Desenvolvimento</dt><dd>{unit.rd}</dd></div>}
            {hasValue(unit.geres) && <div><dt>GERES</dt><dd>{unit.geres}</dd></div>}
            {hasValue(unit.type) && <div><dt>Tipo</dt><dd>{unit.type}</dd></div>}
            {hasValue(unit.managementType) && <div><dt>Tipo de gestão</dt><dd>{unit.managementType}</dd></div>}
            {hasManagementName && <div><dt>{isOss ? "Organização social" : "Gestão"}</dt><dd>{unit.management}</dd></div>}
          </dl>
        </DetailBlock>

        {hasFinancialDetails && (
          <DetailBlock title="Recursos e indicadores financeiros" className="financial-detail-block">
            <dl className="detail-list">
              {hasMoney(unit.cofinancing2022) && <div><dt>Cofinanciamento 2022</dt><dd>{formatMoney(unit.cofinancing2022)}</dd></div>}
              {hasMoney(unit.cofinancing2025) && <div><dt>Cofinanciamento 2025</dt><dd>{formatMoney(unit.cofinancing2025)}</dd></div>}
              {unit.cofinancingIncreasePercent !== null && <div><dt>Aumento do cofinanciamento 2022 a 2025</dt><dd>{formatPercentage(unit.cofinancingIncreasePercent)}</dd></div>}
              {hasMoney(unit.osTransfer2025) && <div><dt>Repasse para OS em 2025</dt><dd>{formatMoney(unit.osTransfer2025)}</dd></div>}
              {hasValue(unit.professionals) && <div><dt>Profissionais</dt><dd>{unit.professionals}</dd></div>}
              {unit.calledProfessionals !== null && <div><dt>Profissionais convocados</dt><dd>{formatNumber(unit.calledProfessionals)}</dd></div>}
            </dl>
          </DetailBlock>
        )}

        {hasValue(unit.mainAdvances) && <DetailBlock title="Principais avanços"><p className="long-copy">{unit.mainAdvances}</p></DetailBlock>}
      </div>
    </article>
  );
}

export function TechnicalSheetView({ units, selected, filterOptions, onSelect }: Props) {
  const [reportMode, setReportMode] = useState<"single" | "builder" | "all">("single");
  const [reportFilters, setReportFilters] = useState<Filters>(EMPTY_FILTERS);
  const [managementTypes, setManagementTypes] = useState<string[]>([]);
  const [managements, setManagements] = useState<string[]>([]);

  const managementTypeOptions = useMemo(() => Array.from(new Set(units.map((unit) => unit.managementType).filter(hasValue) as string[])).sort((a, b) => a.localeCompare(b, "pt-BR")), [units]);
  const managementOptions = useMemo(() => Array.from(new Set(units.map((unit) => unit.management).filter((value) => hasValue(value) && normalizeSearch(value) !== "oss") as string[])).sort((a, b) => a.localeCompare(b, "pt-BR")), [units]);
  const reportUnits = useMemo(() => filterUnits(units, reportFilters).filter((unit) => (
    (managementTypes.length === 0 || (unit.managementType !== null && managementTypes.includes(unit.managementType)))
    && (managements.length === 0 || (unit.management !== null && managements.includes(unit.management)))
  )), [managementTypes, managements, reportFilters, units]);

  const resetReportFilters = () => {
    setReportFilters(EMPTY_FILTERS);
    setManagementTypes([]);
    setManagements([]);
  };
  const hasAnyReportFilter = Boolean(reportFilters.query)
    || reportFilters.municipality.length > 0
    || reportFilters.rd.length > 0
    || reportFilters.geres.length > 0
    || reportFilters.type.length > 0
    || reportFilters.status.length > 0
    || managementTypes.length > 0
    || managements.length > 0;

  if (reportMode === "all") {
    return (
      <div className="technical-page bulk-report-mode">
        <div className="sheet-toolbar bulk-report-toolbar">
          <div><strong>Relatório selecionado</strong><span>{reportUnits.length} {reportUnits.length === 1 ? "ficha técnica" : "fichas técnicas"} · campos sem informação serão omitidos</span></div>
          <div className="sheet-toolbar-actions">
            <button type="button" className="button secondary" onClick={() => setReportMode("builder")}><Settings2 size={18} /> Ajustar filtros</button>
            <button type="button" className="button primary" onClick={() => window.print()}><Printer size={18} /> Imprimir / salvar PDF</button>
          </div>
        </div>
        <section className="panel bulk-report-preview">
          <span className="bulk-report-icon" aria-hidden="true"><Files size={30} /></span>
          <div><h2>Caderno técnico pronto para exportação</h2><p>O documento reunirá somente as unidades selecionadas. Cada ficha começa em uma nova página e os blocos se adaptam aos dados realmente disponíveis.</p></div>
          <dl>
            <div><dt>Em funcionamento</dt><dd>{reportUnits.filter((unit) => unit.status === "Em funcionamento").length}</dd></div>
            <div><dt>Em construção</dt><dd>{reportUnits.filter((unit) => isConstructionStatus(unit.status)).length}</dd></div>
            <div><dt>Sem status na fonte</dt><dd>{reportUnits.filter((unit) => unit.status === "Não informado").length}</dd></div>
          </dl>
        </section>
        <div className="bulk-report-print" aria-hidden="true">
          <section className="bulk-report-cover">
            <div className="bulk-report-cover-mark"><Files size={34} /><span>SES · PE</span></div>
            <div><h1>Relatório das unidades de saúde</h1><p>Caderno consolidado com {reportUnits.length} {reportUnits.length === 1 ? "ficha técnica" : "fichas técnicas"} da rede de Pernambuco.</p></div>
            <dl><div><dt>Unidades</dt><dd>{reportUnits.length}</dd></div><div><dt>Municípios</dt><dd>{new Set(reportUnits.map((unit) => unit.municipality)).size}</dd></div></dl>
            <small>Gerado pelo Painel da Rede de Saúde de Pernambuco · 2026</small>
          </section>
          {reportUnits.map((unit, index) => <div className="bulk-report-entry" key={unit.id}><TechnicalSheet unit={unit} sequence={index + 1} /></div>)}
        </div>
      </div>
    );
  }

  if (reportMode === "builder") {
    return (
      <div className="technical-page report-builder-page">
        <div className="sheet-toolbar bulk-report-toolbar">
          <div><strong>Configurar relatório</strong><span>Selecione os recortes que devem compor o caderno técnico.</span></div>
          <button type="button" className="button secondary" onClick={() => setReportMode("single")}><ArrowLeft size={18} /> Voltar ao individual</button>
        </div>
        <FilterBar filters={reportFilters} options={filterOptions} onChange={setReportFilters} resultCount={reportUnits.length} />
        <section className="panel report-management-filters" aria-label="Filtros de gestão do relatório">
          <MultiSelectField id="report-management-type" label="Tipo de gestão" values={managementTypes} options={managementTypeOptions} onChange={setManagementTypes} />
          <MultiSelectField id="report-management" label="Gestão / OS" values={managements} options={managementOptions} onChange={setManagements} />
          {hasAnyReportFilter && <button type="button" className="text-button" onClick={resetReportFilters}>Limpar todos os filtros</button>}
        </section>
        <section className="panel report-builder-summary">
          <div className="report-builder-count"><Files size={27} /><span><strong>{reportUnits.length}</strong><small>{reportUnits.length === 1 ? "unidade selecionada" : "unidades selecionadas"}</small></span></div>
          <p>{reportUnits.length ? "O relatório manterá apenas campos preenchidos e aplicará uma quebra limpa entre as unidades." : "Altere ou limpe os filtros para selecionar pelo menos uma unidade."}</p>
          <button type="button" className="button primary" disabled={!reportUnits.length} onClick={() => setReportMode("all")}><Files size={18} /> Preparar relatório</button>
        </section>
      </div>
    );
  }

  return (
    <div className="technical-page">
      <div className="sheet-toolbar">
        <label className="field sheet-selector" htmlFor="sheet-unit">
          <span>Selecionar unidade</span>
          <select id="sheet-unit" value={selected.id} onChange={(event) => onSelect(event.target.value)}>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} · {unit.municipality} · {unit.status}</option>)}
          </select>
        </label>
        <div className="sheet-toolbar-actions">
          <button type="button" className="button secondary" onClick={() => setReportMode("builder")}><Settings2 size={18} /> Relatório com filtros</button>
          <button type="button" className="button primary" onClick={() => window.print()}><Printer size={18} /> Imprimir ficha</button>
        </div>
      </div>
      <TechnicalSheet unit={selected} />
    </div>
  );
}
