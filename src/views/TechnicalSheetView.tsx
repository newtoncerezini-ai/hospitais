import { useState } from "react";
import { ArrowLeft, Building2, FileDown, Files, MapPin, Printer, UsersRound } from "lucide-react";
import { displayValue, formatMoney, formatNumber, isConstructionStatus, statusClass, typeClass } from "../lib/format";
import type { HealthUnit } from "../types";

type Props = {
  units: HealthUnit[];
  selected: HealthUnit;
  onSelect: (id: string) => void;
};

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="sheet-detail-block"><h2>{title}</h2>{children}</section>;
}

function TechnicalSheet({ unit, sequence }: { unit: HealthUnit; sequence?: number }) {
  const isConstruction = isConstructionStatus(unit.status);
  const isOperational = unit.status === "Em funcionamento";
  const displayedBeds = isConstruction ? unit.plannedBeds : unit.beds;
  const displayedInvestment = isConstruction ? unit.constructionInvestment : unit.managementInvestment;
  const hasBedExpansion = !isConstruction && (
    unit.bedsOpenedInManagement !== null
    || unit.openedBedTypes !== null
    || unit.bedsToOpenAfterRenovation !== null
  );

  return (
    <article className="technical-sheet">
      <header className="sheet-identity">
        <div className="sheet-title">
          <div className="sheet-marks"><span className={`type-badge ${typeClass(unit.type)}`}>{unit.type}</span><span className={`status-badge ${statusClass(unit.status)}`}>{unit.status}</span></div>
          <h2>{unit.name}</h2>
          <p><MapPin size={17} /> {unit.municipality} · {unit.rd} · {unit.geres} GERES</p>
          <address>{displayValue(unit.address)}</address>
        </div>
        <div className="sheet-document-mark"><FileDown size={23} /><span>Ficha técnica</span><strong>{sequence ? `${String(sequence).padStart(2, "0")} · ` : ""}PE · 2026</strong></div>
      </header>

      <section className="sheet-kpis">
        <div><Building2 size={22} /><span>{isConstruction ? "Leitos previstos" : isOperational ? "Leitos em funcionamento" : "Leitos"}</span><strong>{displayedBeds === null ? "Não informado" : formatNumber(displayedBeds)}</strong></div>
        <div><UsersRound size={22} /><span>Tipo de gestão</span><strong>{displayValue(unit.managementType)}</strong></div>
        <div><span>Gestão</span><strong>{displayValue(unit.management)}</strong><small>{unit.type}</small></div>
        <div><span>{isConstruction ? "Investimento para obra e equipagem" : "Investimento na gestão"}</span><strong>{formatMoney(displayedInvestment, true)}</strong><small>{isConstruction ? (displayedInvestment.amount === null ? "situação registrada na base da obra" : "valor informado para a obra") : "valor disponível na base"}</small></div>
      </section>

      <div className="sheet-content-grid">
        {hasBedExpansion && (
          <section className="sheet-detail-block bed-evolution-block">
            <h2>Expansão de leitos nesta gestão</h2>
            <dl className="detail-list">
              <div><dt>Leitos abertos nesta gestão</dt><dd>{unit.bedsOpenedInManagement === null ? "Não informado" : formatNumber(unit.bedsOpenedInManagement)}</dd></div>
              <div><dt>Tipos de leitos abertos</dt><dd>{displayValue(unit.openedBedTypes)}</dd></div>
              <div><dt>Leitos a abrir com o fim das reformas</dt><dd>{unit.bedsToOpenAfterRenovation === null ? "Não informado" : formatNumber(unit.bedsToOpenAfterRenovation)}</dd></div>
            </dl>
            <p className="bed-evolution-note">Indicadores de expansão: não são somados automaticamente aos leitos atualmente em funcionamento.</p>
          </section>
        )}
        <DetailBlock title={isConstruction ? "Perfil assistencial previsto" : "Perfil assistencial"}><p className="long-copy">{displayValue(unit.profile)}</p></DetailBlock>
        <DetailBlock title="Território e gestão">
          <dl className="detail-list">
            <div><dt>Município</dt><dd>{unit.municipality}</dd></div>
            <div><dt>Região de Desenvolvimento</dt><dd>{unit.rd}</dd></div>
            <div><dt>GERES</dt><dd>{unit.geres}</dd></div>
            <div><dt>Tipo</dt><dd>{unit.type}</dd></div>
            <div><dt>Tipo de gestão</dt><dd>{displayValue(unit.managementType)}</dd></div>
            <div><dt>Gestão</dt><dd>{displayValue(unit.management)}</dd></div>
          </dl>
        </DetailBlock>
        <DetailBlock title={isConstruction ? "Obra e recursos previstos" : "Recursos e manutenção"}>
          <dl className="detail-list">
            <div><dt>Contrato de manutenção predial</dt><dd>{formatMoney(unit.maintenanceContract)}</dd></div>
            <div><dt>{isConstruction ? "Investimento para obra e equipagem" : "Investimento nesta gestão"}</dt><dd>{formatMoney(displayedInvestment)}</dd></div>
            <div><dt>Profissionais</dt><dd>{displayValue(unit.professionals)}</dd></div>
            <div><dt>Profissionais convocados</dt><dd>{displayValue(unit.calledProfessionals)}</dd></div>
          </dl>
        </DetailBlock>
        <DetailBlock title="Principais avanços"><p className="long-copy">{displayValue(unit.mainAdvances)}</p></DetailBlock>
      </div>

      <footer className="sheet-footer">
        <span>Fonte: {unit.source.sheet} · linha {unit.source.row}</span>
        {unit.source.supplemental && <span>Complemento: {unit.source.supplemental.sheet} · linha {unit.source.supplemental.row}</span>}
        <span>Posição no mapa em nível municipal</span>
        {unit.enrichment.municipalityCorrected && <span>Município normalizado e documentado</span>}
      </footer>
    </article>
  );
}

export function TechnicalSheetView({ units, selected, onSelect }: Props) {
  const [reportMode, setReportMode] = useState<"single" | "all">("single");

  if (reportMode === "all") {
    return (
      <div className="technical-page bulk-report-mode">
        <div className="sheet-toolbar bulk-report-toolbar">
          <div>
            <strong>Relatório completo da rede</strong>
            <span>{units.length} fichas técnicas · uma unidade por seção</span>
          </div>
          <div className="sheet-toolbar-actions">
            <button type="button" className="button secondary" onClick={() => setReportMode("single")}><ArrowLeft size={18} /> Voltar ao individual</button>
            <button type="button" className="button primary" onClick={() => window.print()}><Printer size={18} /> Imprimir / salvar PDF</button>
          </div>
        </div>

        <section className="panel bulk-report-preview">
          <span className="bulk-report-icon" aria-hidden="true"><Files size={30} /></span>
          <div><h2>Caderno técnico pronto para exportação</h2><p>O arquivo reunirá as {units.length} unidades na ordem da base, preservando as lacunas como “Não informado”. A impressão pode levar alguns segundos para preparar todas as páginas.</p></div>
          <dl>
            <div><dt>Em funcionamento</dt><dd>{units.filter((unit) => unit.status === "Em funcionamento").length}</dd></div>
            <div><dt>Em construção</dt><dd>{units.filter((unit) => isConstructionStatus(unit.status)).length}</dd></div>
            <div><dt>Sem status na fonte</dt><dd>{units.filter((unit) => unit.status === "Não informado").length}</dd></div>
          </dl>
        </section>

        <div className="bulk-report-print" aria-hidden="true">
          <section className="bulk-report-cover">
            <div className="bulk-report-cover-mark"><Files size={34} /><span>SES · PE</span></div>
            <div><h1>Relatório das unidades de saúde</h1><p>Caderno consolidado com {units.length} fichas técnicas da rede de Pernambuco.</p></div>
            <dl><div><dt>Unidades</dt><dd>{units.length}</dd></div><div><dt>Municípios</dt><dd>{new Set(units.map((unit) => unit.municipality)).size}</dd></div></dl>
            <small>Gerado pelo Painel da Rede de Saúde de Pernambuco · 2026</small>
          </section>
          {units.map((unit, index) => <div className="bulk-report-entry" key={unit.id}><TechnicalSheet unit={unit} sequence={index + 1} /></div>)}
        </div>
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
          <button type="button" className="button secondary" onClick={() => setReportMode("all")}><Files size={18} /> Relatório completo ({units.length})</button>
          <button type="button" className="button primary" onClick={() => window.print()}><Printer size={18} /> Imprimir ficha</button>
        </div>
      </div>
      <TechnicalSheet unit={selected} />
    </div>
  );
}
