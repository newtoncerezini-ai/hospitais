import { ArrowRight, BedDouble, Building2, HardHat, MapPin } from "lucide-react";
import { displayValue, formatMoney, formatNumber, typeClass } from "../lib/format";
import type { DashboardData, HealthUnit } from "../types";

type Props = {
  data: DashboardData;
  onOpenUnit: (unit: HealthUnit) => void;
};

export function NewUnitsView({ data, onOpenUnit }: Props) {
  const units = data.units.filter((unit) => unit.status === "Em construção");
  const municipalities = new Set(units.map((unit) => unit.municipality)).size;
  const unitsWithBeds = units.filter((unit) => unit.plannedBeds !== null).length;

  return (
    <div className="new-units-page">
      <section className="new-units-summary" aria-label="Resumo das novas unidades">
        <div className="new-units-summary-copy">
          <span className="new-units-symbol" aria-hidden="true"><HardHat size={25} /></span>
          <div>
            <h2>Uma nova frente de atendimento em Pernambuco</h2>
            <p>Projetos registrados na base como unidades em construção, sem misturar capacidade prevista com leitos já em funcionamento.</p>
          </div>
        </div>
        <dl>
          <div><dt>Novas unidades</dt><dd>{formatNumber(units.length)}</dd></div>
          <div><dt>Leitos previstos</dt><dd>{formatNumber(data.meta.plannedBeds)}</dd></div>
          <div><dt>Municípios alcançados</dt><dd>{formatNumber(municipalities)}</dd></div>
          <div><dt>Projetos com leitos informados</dt><dd>{formatNumber(unitsWithBeds)}</dd></div>
        </dl>
      </section>

      <section className="panel new-units-register">
        <div className="panel-heading">
          <div>
            <h2>Carteira de novas unidades</h2>
            <p>Consulte o perfil previsto, o território e a capacidade registrada para cada projeto.</p>
          </div>
          <span className="construction-key"><span aria-hidden="true" /> Em construção</span>
        </div>

        <div className="new-unit-list">
          {units.map((unit, index) => (
            <article className="new-unit-row" key={unit.id}>
              <div className="new-unit-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</div>
              <div className="new-unit-main">
                <div className="new-unit-badges">
                  <span className={`type-badge ${typeClass(unit.type)}`}>{unit.type}</span>
                  <span>{unit.geres} GERES</span>
                </div>
                <h3>{unit.name}</h3>
                <p className="new-unit-location"><MapPin size={15} /> {unit.municipality} · {unit.rd}</p>
                <p className="new-unit-profile">{displayValue(unit.profile)}</p>
              </div>
              <dl className="new-unit-facts">
                <div><dt><BedDouble size={15} /> Leitos previstos</dt><dd>{unit.plannedBeds === null ? "Não informado" : formatNumber(unit.plannedBeds)}</dd></div>
                <div><dt><Building2 size={15} /> Obra e equipagem</dt><dd>{formatMoney(unit.constructionInvestment, true)}</dd></div>
              </dl>
              <button type="button" className="button secondary new-unit-action" onClick={() => onOpenUnit(unit)}>
                Abrir ficha <ArrowRight size={17} />
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
