import { ArrowRight, BedDouble, Database, Handshake, HardHat, MapPinned, ShieldCheck } from "lucide-react";
import { displayValue, formatNumber, typeClass } from "../lib/format";
import type { DashboardData, View } from "../types";

type Props = {
  data: DashboardData;
  onNavigate: (view: View) => void;
};

export function OverviewView({ data, onNavigate }: Props) {
  const activeUnits = data.units.filter((unit) => unit.status === "Em funcionamento");
  const activeTypeCounts = data.meta.typeCountsByStatus["Em funcionamento"] ?? {};
  const constructionTypeCounts = data.meta.typeCountsByStatus["Em construção"] ?? {};
  const credentialedUnits = data.units.filter((unit) => unit.type === "Rede Credenciada");
  const credentialedMunicipalities = new Set(credentialedUnits.map((unit) => unit.municipality)).size;
  const expansionUnits = data.units.filter(
    (unit) => unit.status !== "Em construção" && (unit.bedsOpenedInManagement !== null || unit.bedsToOpenAfterRenovation !== null),
  ).sort((first, second) => (
    (second.bedsOpenedInManagement ?? 0) + (second.bedsToOpenAfterRenovation ?? 0)
    - (first.bedsOpenedInManagement ?? 0) - (first.bedsToOpenAfterRenovation ?? 0)
  ));
  const highlightedExpansionUnits = expansionUnits.slice(0, 8);
  const geresCounts = Object.entries(
    activeUnits.reduce<Record<string, number>>((acc, unit) => {
      acc[unit.geres] = (acc[unit.geres] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => Number.parseInt(a[0], 10) - Number.parseInt(b[0], 10));
  const maxGeres = Math.max(...geresCounts.map(([, count]) => count));

  return (
    <div className="overview-page">
      <section className="summary-rail" aria-label="Resumo da rede">
        <article><span>Unidades cadastradas</span><strong>{formatNumber(data.meta.totalUnits)}</strong><small>{data.meta.activeUnits} em funcionamento · {data.meta.constructionUnits} em construção · {data.meta.unitsWithoutStatus} sem status informado</small></article>
        <article><span>Municípios</span><strong>{formatNumber(data.meta.totalMunicipalities)}</strong><small>{data.meta.constructionMunicipalities} com unidades em construção</small></article>
        <article><span>Leitos em funcionamento</span><strong>{formatNumber(data.meta.totalBeds)}</strong><small>em {data.meta.unitsWithBeds} unidades</small></article>
        <article><span>Leitos previstos</span><strong>{formatNumber(data.meta.plannedBeds)}</strong><small>em {data.meta.constructionUnitsWithBeds} unidades em construção</small></article>
      </section>

      <div className="overview-grid">
        <section className="panel network-composition">
          <div className="panel-heading">
            <div><h2>Rede em funcionamento</h2><p>As {data.meta.activeUnits} unidades operacionais distribuídas por tipo assistencial.</p></div>
            <button type="button" className="link-action" onClick={() => onNavigate("units")}>Abrir lista <ArrowRight size={17} /></button>
          </div>
          <div className="type-distribution">
            {Object.entries(activeTypeCounts).map(([type, count]) => (
              <div className="type-row" key={type}>
                <span className={`type-symbol ${typeClass(type)}`} aria-hidden="true" />
                <strong>{type}</strong>
                <div className="bar-track" aria-hidden="true"><span className={typeClass(type)} style={{ width: `${(count / data.meta.activeUnits) * 100}%` }} /></div>
                <b>{count}</b>
              </div>
            ))}
          </div>
          <div className="construction-overview">
            <HardHat size={23} aria-hidden="true" />
            <span>
              <strong>{data.meta.constructionUnits} unidades em construção</strong>
              <small>{Object.entries(constructionTypeCounts).map(([type, count]) => `${count} do tipo ${type}`).join(" · ")} · {data.meta.constructionMunicipalities} municípios</small>
            </span>
            <b>{formatNumber(data.meta.plannedBeds)} leitos previstos</b>
          </div>
          <div className="credentialed-overview">
            <Handshake size={23} aria-hidden="true" />
            <span><strong>{credentialedUnits.length} unidades da Rede Credenciada</strong><small>Presentes em {credentialedMunicipalities} municípios; status e campos administrativos não foram informados.</small></span>
            <b>Status não informado</b>
          </div>
          <button type="button" className="map-callout" onClick={() => onNavigate("map") }>
            <MapPinned size={24} aria-hidden="true" />
            <span><strong>Ver a rede no território</strong><small>Mapa municipal com símbolos por tipo de unidade.</small></span>
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        </section>

        <section className="panel geres-panel">
          <div className="panel-heading"><div><h2>Unidades por GERES</h2><p>Distribuição das {data.meta.activeUnits} unidades em funcionamento.</p></div></div>
          <div className="geres-bars">
            {geresCounts.map(([geres, count]) => (
              <div key={geres}>
                <span>{geres} GERES</span>
                <div className="bar-track"><span style={{ width: `${(count / maxGeres) * 100}%` }} /></div>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel bed-expansion-panel">
        <div className="panel-heading">
          <div><h2>Expansão de leitos</h2><p>Entregas desta gestão e capacidade prevista após reformas, separadas do estoque em funcionamento e das novas obras.</p></div>
          <BedDouble size={26} aria-hidden="true" />
        </div>
        <dl className="bed-expansion-summary">
          <div><dt>Leitos abertos nesta gestão</dt><dd><b>{formatNumber(data.meta.bedsOpenedInManagement)}</b><small>informados em {data.meta.unitsWithBedsOpenedInManagement} unidades</small></dd></div>
          <div><dt>Leitos a abrir após reformas</dt><dd><b>{formatNumber(data.meta.bedsToOpenAfterRenovation)}</b><small>informados em {data.meta.unitsWithBedsToOpenAfterRenovation} unidades</small></dd></div>
        </dl>
        <div className="bed-expansion-list-heading"><strong>Maiores expansões informadas</strong><span>8 de {expansionUnits.length} registros · lista completa na página Unidades de saúde</span></div>
        <div className="bed-expansion-list" role="list" aria-label="Maiores expansões de leitos por unidade">
          {highlightedExpansionUnits.map((unit) => (
            <div className="bed-expansion-row" role="listitem" key={unit.id}>
              <span><strong>{unit.name}</strong><small>{unit.municipality}</small></span>
              <dl>
                <div><dt>Abertos</dt><dd>{displayValue(unit.bedsOpenedInManagement)}</dd></div>
                <div><dt>Após reforma</dt><dd>{displayValue(unit.bedsToOpenAfterRenovation)}</dd></div>
              </dl>
              <small>{unit.openedBedTypes ? `Tipos abertos: ${unit.openedBedTypes}` : "Tipos de leito aberto não informados"}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="quality-strip">
        <div className="quality-intro">
          <Database size={25} aria-hidden="true" />
          <div><h2>Base preparada para consulta</h2><p>A origem foi preservada e cada enriquecimento ficou registrado.</p></div>
        </div>
        <dl>
          <div><dt>RD recuperada</dt><dd>{data.dataQuality.enrichment.rdFromWorkbookMunicipalityTemplate} registros</dd></div>
          <div><dt>Investimentos recuperados</dt><dd>{data.dataQuality.enrichment.investmentFromSourceSheets} registros</dd></div>
          <div><dt>Ajustes documentados</dt><dd>{data.dataQuality.enrichment.documentedCorrections} ocorrências</dd></div>
        </dl>
        <div className="quality-note"><ShieldCheck size={19} /><span>Sem coordenadas na fonte: o mapa informa posição municipal.</span></div>
      </section>
    </div>
  );
}
