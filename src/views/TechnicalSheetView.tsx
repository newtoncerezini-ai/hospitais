import { Building2, FileDown, MapPin, Printer, UsersRound } from "lucide-react";
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

export function TechnicalSheetView({ units, selected, onSelect }: Props) {
  const isConstruction = isConstructionStatus(selected.status);
  const displayedBeds = isConstruction ? selected.plannedBeds : selected.beds;
  const displayedInvestment = isConstruction ? selected.constructionInvestment : selected.managementInvestment;
  const hasBedExpansion = !isConstruction && (
    selected.bedsOpenedInManagement !== null
    || selected.openedBedTypes !== null
    || selected.bedsToOpenAfterRenovation !== null
  );
  return (
    <div className="technical-page">
      <div className="sheet-toolbar">
        <label className="field sheet-selector" htmlFor="sheet-unit">
          <span>Selecionar unidade</span>
          <select id="sheet-unit" value={selected.id} onChange={(event) => onSelect(event.target.value)}>
            {units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} · {unit.municipality} · {unit.status}</option>)}
          </select>
        </label>
        <button type="button" className="button primary" onClick={() => window.print()}><Printer size={18} /> Imprimir / salvar PDF</button>
      </div>

      <article className="technical-sheet">
        <header className="sheet-identity">
          <div className="sheet-title">
            <div className="sheet-marks"><span className={`type-badge ${typeClass(selected.type)}`}>{selected.type}</span><span className={`status-badge ${statusClass(selected.status)}`}>{selected.status}</span></div>
            <h2>{selected.name}</h2>
            <p><MapPin size={17} /> {selected.municipality} · {selected.rd} · {selected.geres} GERES</p>
            <address>{displayValue(selected.address)}</address>
          </div>
          <div className="sheet-document-mark"><FileDown size={23} /><span>Ficha técnica</span><strong>PE · 2026</strong></div>
        </header>

        <section className="sheet-kpis">
          <div><Building2 size={22} /><span>{isConstruction ? "Leitos previstos" : "Leitos em funcionamento"}</span><strong>{displayedBeds === null ? "Não informado" : formatNumber(displayedBeds)}</strong></div>
          <div><UsersRound size={22} /><span>Tipo de gestão</span><strong>{displayValue(selected.managementType)}</strong></div>
          <div><span>Gestão</span><strong>{displayValue(selected.management)}</strong><small>{selected.type}</small></div>
          <div><span>{isConstruction ? "Investimento para obra e equipagem" : "Investimento na gestão"}</span><strong>{formatMoney(displayedInvestment, true)}</strong><small>{isConstruction ? (displayedInvestment.amount === null ? "situação registrada na base da obra" : "valor informado para a obra") : "valor disponível na base"}</small></div>
        </section>

        <div className="sheet-content-grid">
          {hasBedExpansion && (
            <section className="sheet-detail-block bed-evolution-block">
              <h2>Expansão de leitos nesta gestão</h2>
              <dl className="detail-list">
                <div><dt>Leitos abertos nesta gestão</dt><dd>{selected.bedsOpenedInManagement === null ? "Não informado" : formatNumber(selected.bedsOpenedInManagement)}</dd></div>
                <div><dt>Tipos de leitos abertos</dt><dd>{displayValue(selected.openedBedTypes)}</dd></div>
                <div><dt>Leitos a abrir com o fim das reformas</dt><dd>{selected.bedsToOpenAfterRenovation === null ? "Não informado" : formatNumber(selected.bedsToOpenAfterRenovation)}</dd></div>
              </dl>
              <p className="bed-evolution-note">Indicadores de expansão: não são somados automaticamente aos leitos atualmente em funcionamento.</p>
            </section>
          )}
          <DetailBlock title={isConstruction ? "Perfil assistencial previsto" : "Perfil assistencial"}><p className="long-copy">{displayValue(selected.profile)}</p></DetailBlock>
          <DetailBlock title="Território e gestão">
            <dl className="detail-list">
              <div><dt>Município</dt><dd>{selected.municipality}</dd></div>
              <div><dt>Região de Desenvolvimento</dt><dd>{selected.rd}</dd></div>
              <div><dt>GERES</dt><dd>{selected.geres}</dd></div>
              <div><dt>Tipo</dt><dd>{selected.type}</dd></div>
              <div><dt>Tipo de gestão</dt><dd>{displayValue(selected.managementType)}</dd></div>
              <div><dt>Gestão</dt><dd>{displayValue(selected.management)}</dd></div>
            </dl>
          </DetailBlock>
          <DetailBlock title={isConstruction ? "Obra e recursos previstos" : "Recursos e manutenção"}>
            <dl className="detail-list">
              <div><dt>Contrato de manutenção predial</dt><dd>{formatMoney(selected.maintenanceContract)}</dd></div>
              <div><dt>{isConstruction ? "Investimento para obra e equipagem" : "Investimento nesta gestão"}</dt><dd>{formatMoney(displayedInvestment)}</dd></div>
              <div><dt>Profissionais</dt><dd>{displayValue(selected.professionals)}</dd></div>
              <div><dt>Profissionais convocados</dt><dd>{displayValue(selected.calledProfessionals)}</dd></div>
            </dl>
          </DetailBlock>
          <DetailBlock title="Principais avanços"><p className="long-copy">{displayValue(selected.mainAdvances)}</p></DetailBlock>
        </div>

        <footer className="sheet-footer">
          <span>Fonte: {selected.source.sheet} · linha {selected.source.row}</span>
          {selected.source.supplemental && <span>Complemento: {selected.source.supplemental.sheet} · linha {selected.source.supplemental.row}</span>}
          <span>Posição no mapa em nível municipal</span>
          {selected.enrichment.municipalityCorrected && <span>Município normalizado e documentado</span>}
        </footer>
      </article>
    </div>
  );
}
