from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_WORKBOOK = ROOT / "data" / "raw" / "health-units.xlsx"
DEFAULT_MAP_DATA = ROOT / "data" / "reference" / "pernambuco-map.json"
DEFAULT_OUTPUT = ROOT / "public" / "data" / "health-units.json"
DEFAULT_QUALITY_OUTPUT = ROOT / "data" / "processed" / "data-quality.json"
SHEET_NAME = "Consolidado"
CONSTRUCTION_SHEET_NAME = "UNIDADES EM CONSTRUÇÃO"


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = re.sub(r"\s+", " ", str(value)).strip()
    return text or None


def normalize(value: Any) -> str:
    text = clean_text(value) or ""
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", ascii_text.lower())


def slugify(value: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.lower()).strip("-")


def title_particles(value: str) -> str:
    result = value
    for particle in (" Do ", " Da ", " Dos ", " Das ", " De "):
        result = result.replace(particle, particle.lower())
    return result


def normalize_status(value: Any) -> str:
    status = clean_text(value)
    normalized_status = normalize(status)
    if "construcao" in normalized_status:
        return "Em construção"
    if "funcionamento" in normalized_status:
        return "Em funcionamento"
    return status or "Não informado"


def normalize_unit_type(value: Any) -> str:
    unit_type = clean_text(value) or "Não informado"
    normalized_type = normalize(unit_type)
    if normalized_type in {"upaer", "upaerregional"}:
        return "UPAE-R"
    if normalized_type in {"grandeemergencia", "grandesemergencias"}:
        return "Hospital"
    return unit_type


def parse_integer(value: Any) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, (date, datetime)):
        return (value.date() - date(1899, 12, 30)).days if isinstance(value, datetime) else (value - date(1899, 12, 30)).days
    if isinstance(value, (int, float)):
        return int(value)
    text = clean_text(value)
    if not text or text in {"-", "—"}:
        return None
    match = re.search(r"\d+", text.replace(".", ""))
    return int(match.group()) if match else None


def parse_money(value: Any) -> dict[str, Any]:
    text = clean_text(value)
    if isinstance(value, bool) or value is None:
        return {"amount": None, "label": None}
    if isinstance(value, (int, float)):
        return {"amount": round(float(value), 2), "label": None}
    if not text or text in {"-", "—"}:
        return {"amount": None, "label": None}

    normalized_text = normalize(text)
    multiplier = 1
    if "milhao" in normalized_text or "milhoes" in normalized_text:
        multiplier = 1_000_000
    elif re.search(r"\bmil\b", text.lower()):
        multiplier = 1_000

    compact = re.sub(r"[^0-9,.]", "", text)
    decimal_match = re.search(r"([,.])(\d{2})$", compact)
    amount = None
    if multiplier > 1:
        match = re.search(r"\d+(?:[.,]\d+)?", text)
        if match:
            amount = float(match.group().replace(".", "").replace(",", ".")) * multiplier
    elif decimal_match:
        cents = decimal_match.group(2)
        whole = re.sub(r"\D", "", compact[: decimal_match.start()]) or "0"
        amount = float(f"{whole}.{cents}")
    elif compact and re.search(r"\d", compact):
        amount = float(re.sub(r"\D", "", compact))

    return {"amount": round(amount, 2) if amount is not None else None, "label": text}


def read_rows(workbook_path: Path) -> tuple[list[str], list[dict[str, Any]]]:
    workbook = load_workbook(workbook_path, read_only=True, data_only=True)
    if SHEET_NAME not in workbook.sheetnames:
        raise ValueError(f"Aba obrigatória ausente: {SHEET_NAME}")
    sheet = workbook[SHEET_NAME]
    iterator = sheet.iter_rows(values_only=True)
    headers = [clean_text(value) or "" for value in next(iterator)]
    rows: list[dict[str, Any]] = []
    for source_row, values in enumerate(iterator, start=2):
        row = dict(zip(headers, values))
        if clean_text(row.get("UNIDADE DE SAÚDE")):
            row["__source_row"] = source_row
            row["__source_sheet"] = SHEET_NAME
            rows.append(row)
    return headers, rows


def infer_construction_municipality(unit_name: str, location: Any) -> str | None:
    if normalize(unit_name).startswith("maternidadede"):
        return clean_text(re.sub(r"^Maternidade\s+de\s+", "", unit_name, flags=re.IGNORECASE))
    if normalize(unit_name).startswith("upaer"):
        return clean_text(re.sub(r"^UPAE[-\s]*R\s+", "", unit_name, flags=re.IGNORECASE))
    location_text = clean_text(location)
    if location_text not in {None, "-", "—"}:
        return location_text
    return None


def read_construction_rows(
    workbook_path: Path,
    municipality_reference: dict[str, dict[str, str]],
) -> list[dict[str, Any]]:
    workbook = load_workbook(workbook_path, read_only=True, data_only=True)
    sheet = workbook[CONSTRUCTION_SHEET_NAME]
    rows: list[dict[str, Any]] = []
    for source_row, values in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        unit_name = clean_text(values[1] if len(values) > 1 else None)
        if not unit_name:
            continue
        municipality = infer_construction_municipality(
            unit_name,
            values[2] if len(values) > 2 else None,
        ) or "Não informado"
        municipality_ref = municipality_reference.get(normalize(municipality))
        unit_type = "UPAE/R" if normalize(unit_name).startswith("upaer") else "Hospital"
        rows.append(
            {
                "NOME MUNICIPIO": municipality,
                "RD": municipality_ref["rd"] if municipality_ref else None,
                "GERES": values[3] if len(values) > 3 else None,
                "UNIDADE DE SAÚDE": unit_name,
                "LOCALIZAÇÃO": None,
                "STATUS": "Em construção",
                "TIPO": unit_type,
                "TIPO GESTÃO": None,
                "GESTÃO": None,
                "LEITOS": values[4] if len(values) > 4 else None,
                "PERFIL": values[5] if len(values) > 5 else None,
                "PROSSIONAIS": None,
                "PROFISSIONAIS CONVOCADOS NA GESTÃO": None,
                "CONTRATO DE MANUTENÇÃO PREDIAL": None,
                "INVESTIMENTO NESTA GESTÃO": values[6] if len(values) > 6 else None,
                "PRINCIPAIS AVANÇOS": None,
                "__source_row": source_row,
                "__source_sheet": CONSTRUCTION_SHEET_NAME,
            }
        )
    return rows


def merge_construction_rows(
    consolidated_rows: list[dict[str, Any]],
    construction_rows: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    merged = list(consolidated_rows)
    by_name = {
        normalize(row.get("UNIDADE DE SAÚDE")): row
        for row in merged
        if clean_text(row.get("UNIDADE DE SAÚDE"))
    }
    for construction_row in construction_rows:
        key = normalize(construction_row.get("UNIDADE DE SAÚDE"))
        existing = by_name.get(key)
        if not existing:
            construction_row["__construction_source_row"] = construction_row["__source_row"]
            merged.append(construction_row)
            by_name[key] = construction_row
            continue
        if normalize_status(existing.get("STATUS")) == "Em funcionamento":
            continue
        existing["__construction_source_row"] = construction_row["__source_row"]
        for field in ("STATUS", "LEITOS", "PERFIL", "INVESTIMENTO NESTA GESTÃO"):
            if not clean_text(existing.get(field)) and clean_text(construction_row.get(field)):
                existing[field] = construction_row[field]
    return merged


def read_municipality_reference(workbook_path: Path) -> dict[str, dict[str, str]]:
    workbook = load_workbook(workbook_path, read_only=True, data_only=True)
    sheet = workbook["0_Template_Cod_Mun_RD"]
    reference: dict[str, dict[str, str]] = {}
    for code_value, municipality_value, rd_value, *_ in sheet.iter_rows(min_row=3, values_only=True):
        municipality = clean_text(municipality_value)
        rd = clean_text(rd_value)
        if not municipality or not rd or code_value is None:
            continue
        try:
            code = str(int(code_value)).zfill(7)
        except (TypeError, ValueError):
            continue
        reference[normalize(municipality)] = {
            "municipality": municipality,
            "code": code,
            "rd": title_particles(rd),
        }
    return reference


def read_source_investments(workbook_path: Path) -> dict[str, Any]:
    workbook = load_workbook(workbook_path, read_only=True, data_only=True)
    values: dict[str, Any] = {}
    ignored_sheets = {SHEET_NAME, "0_Template_Cod_Mun_RD", CONSTRUCTION_SHEET_NAME}
    for sheet in workbook.worksheets:
        if sheet.title in ignored_sheets:
            continue
        rows = sheet.iter_rows(values_only=True)
        headers = [clean_text(value) or "" for value in next(rows)]
        unit_index = next((index for index, header in enumerate(headers) if header in {"HOSPITAL", "UPA ou UPAE"}), None)
        investment_index = next((index for index, header in enumerate(headers) if "Investimento nesta gestão" in header), None)
        if unit_index is None or investment_index is None:
            continue
        for row in rows:
            unit = clean_text(row[unit_index] if unit_index < len(row) else None)
            raw_investment = row[investment_index] if investment_index < len(row) else None
            parsed = parse_money(raw_investment)
            if unit and (parsed["amount"] is not None or parsed["label"] not in {None, "-", "Aguardando informação"}):
                values[normalize(unit)] = raw_investment
    return values


def load_map(map_path: Path) -> dict[str, Any]:
    with map_path.open(encoding="utf-8") as stream:
        data = json.load(stream)
    return data.get("map", data)


def source_coverage(rows: list[dict[str, Any]], header: str) -> int:
    return sum(1 for row in rows if has_substantive_value(row.get(header)))


def has_substantive_value(value: Any) -> bool:
    text = clean_text(value)
    return bool(text and text not in {"-", "—"} and normalize(text) not in {"aguardandoinformacao", "naoinformado"})


def money_source_coverage(rows: list[dict[str, Any]], header: str) -> int:
    covered = 0
    for row in rows:
        parsed = parse_money(row.get(header))
        if parsed["amount"] is not None or has_substantive_value(parsed["label"]):
            covered += 1
    return covered


def build_payload(workbook_path: Path, map_path: Path) -> dict[str, Any]:
    headers, consolidated_rows = read_rows(workbook_path)
    municipality_reference = read_municipality_reference(workbook_path)
    construction_rows = read_construction_rows(workbook_path, municipality_reference)
    raw_rows = merge_construction_rows(consolidated_rows, construction_rows)
    source_investments = read_source_investments(workbook_path)
    map_data = load_map(map_path)

    municipality_corrections = {
        "upaengenhovelho": {
            "municipality": "Jaboatão dos Guararapes",
            "reason": "O endereço da linha e a página oficial identificam Jaboatão dos Guararapes; Engenho Velho é o bairro/unidade.",
            "evidenceUrl": "https://portal.saude.pe.gov.br/upas-oss/upa-engenho-velho/",
        },
        "upacurado": {
            "municipality": "Jaboatão dos Guararapes",
            "reason": "O endereço da linha e a página oficial situam a unidade no Curado II, em Jaboatão dos Guararapes.",
            "evidenceUrl": "https://portal.saude.pe.gov.br/upas/upa-curado-medico-fernando-de-lacerda/",
        },
        "upaegranderecife": {
            "municipality": "Abreu e Lima",
            "reason": "O endereço da linha e a página oficial situam a unidade no bairro Desterro, em Abreu e Lima.",
            "evidenceUrl": "https://portal.saude.pe.gov.br/upase-oss/upae-grande-recife-abreu-e-lima/",
        },
        "hospitalmetropolitanonortemiguelarraes": {
            "municipality": "Paulista",
            "reason": "A planilha omite o município; a página oficial informa Paulista no endereço da unidade.",
            "evidenceUrl": "https://portal.saude.pe.gov.br/hospitais-oss/hospital-metropolitano-norte-miguel-arraes-de-alencar/",
        },
    }
    geres_corrections = {
        "hospitalprofagamenonmagalhaes": {
            "geres": "XI",
            "reason": "A unidade está em Serra Talhada, município da XI GERES; a célula I diverge das demais referências territoriais.",
            "evidenceUrl": "https://cartadeservicos.saude.pe.gov.br/endereco-geres/",
        }
    }

    geres_by_municipality: dict[str, list[str]] = defaultdict(list)
    for row in raw_rows:
        source_municipality = clean_text(row.get("NOME MUNICIPIO")) or "Não informado"
        unit_correction = municipality_corrections.get(normalize(row.get("UNIDADE DE SAÚDE")))
        corrected = unit_correction["municipality"] if unit_correction else source_municipality
        geres = clean_text(row.get("GERES"))
        if geres and normalize(row.get("UNIDADE DE SAÚDE")) not in geres_corrections:
            geres_by_municipality[normalize(corrected)].append(geres)

    geres_mode = {
        key: Counter(values).most_common(1)[0][0]
        for key, values in geres_by_municipality.items()
        if values
    }

    units: list[dict[str, Any]] = []
    seen_ids: Counter[str] = Counter()
    corrections: list[dict[str, Any]] = []
    rd_enriched = 0
    geres_enriched = 0
    investments_enriched = 0

    for row in raw_rows:
        unit_name = clean_text(row.get("UNIDADE DE SAÚDE")) or "Unidade sem nome"
        source_municipality = clean_text(row.get("NOME MUNICIPIO")) or "Não informado"
        proposed_correction = municipality_corrections.get(normalize(unit_name))
        correction = proposed_correction if proposed_correction and normalize(source_municipality) != normalize(proposed_correction["municipality"]) else None
        municipality = correction["municipality"] if correction else source_municipality
        if correction:
            corrections.append(
                {
                    "sourceRow": row["__source_row"],
                    "field": "municipality",
                    "sourceValue": source_municipality,
                    "normalizedValue": municipality,
                    "reason": correction["reason"],
                    "evidenceUrl": correction["evidenceUrl"],
                }
            )

        municipality_ref = municipality_reference.get(normalize(municipality))
        source_rd = clean_text(row.get("RD"))
        rd = municipality_ref["rd"] if municipality_ref else source_rd or "Não informado"
        if not source_rd and rd != "Não informado":
            rd_enriched += 1

        source_geres = clean_text(row.get("GERES"))
        geres_correction = geres_corrections.get(normalize(unit_name))
        geres = geres_correction["geres"] if geres_correction else source_geres or geres_mode.get(normalize(municipality)) or "Não informado"
        if geres_correction:
            corrections.append(
                {
                    "sourceRow": row["__source_row"],
                    "field": "geres",
                    "sourceValue": source_geres,
                    "normalizedValue": geres,
                    "reason": geres_correction["reason"],
                    "evidenceUrl": geres_correction["evidenceUrl"],
                }
            )
        if not source_geres and geres != "Não informado":
            geres_enriched += 1

        status = normalize_status(row.get("STATUS"))
        is_construction = status == "Em construção"
        investment_source = row.get("INVESTIMENTO NESTA GESTÃO")
        parsed_investment = parse_money(investment_source)
        if parsed_investment["amount"] is None and normalize(unit_name) in source_investments:
            source_sheet_investment = source_investments[normalize(unit_name)]
            replacement = parse_money(source_sheet_investment)
            if replacement["amount"] is not None:
                parsed_investment = replacement
                investments_enriched += 1

        base_id = slugify(unit_name) or f"unidade-{row['__source_row']}"
        seen_ids[base_id] += 1
        unit_id = base_id if seen_ids[base_id] == 1 else f"{base_id}-{seen_ids[base_id]}"

        units.append(
            {
                "id": unit_id,
                "ibgeCode": municipality_ref["code"] if municipality_ref else None,
                "name": unit_name,
                "municipality": municipality,
                "sourceMunicipality": source_municipality if source_municipality != municipality else None,
                "rd": rd,
                "geres": geres,
                "address": clean_text(row.get("LOCALIZAÇÃO")),
                "status": status,
                "type": normalize_unit_type(row.get("TIPO")),
                "managementType": clean_text(row.get("TIPO GESTÃO")),
                "management": clean_text(row.get("GESTÃO")),
                "beds": None if is_construction else parse_integer(row.get("LEITOS")),
                "plannedBeds": parse_integer(row.get("LEITOS")) if is_construction else None,
                "bedsOpenedInManagement": None if is_construction else parse_integer(row.get("LEITOS ABERTOS NESTA GESTÃO")),
                "openedBedTypes": None if is_construction or not has_substantive_value(row.get("TIPOS DE LEITOS ABERTOS NESTA GESTÃO")) else clean_text(row.get("TIPOS DE LEITOS ABERTOS NESTA GESTÃO")),
                "bedsToOpenAfterRenovation": None if is_construction else parse_integer(row.get("LEITOS A ABRIR COM O FIM DA REFORMA")),
                "profile": clean_text(row.get("PERFIL")),
                "professionals": clean_text(row.get("PROSSIONAIS")),
                "calledProfessionals": parse_integer(row.get("PROFISSIONAIS CONVOCADOS NA GESTÃO")),
                "maintenanceContract": parse_money(row.get("CONTRATO DE MANUTENÇÃO PREDIAL")),
                "managementInvestment": {"amount": None, "label": None} if is_construction else parsed_investment,
                "constructionInvestment": parsed_investment if is_construction else {"amount": None, "label": None},
                "mainAdvances": clean_text(row.get("PRINCIPAIS AVANÇOS")),
                "latitude": None,
                "longitude": None,
                "source": {
                    "sheet": row.get("__source_sheet", SHEET_NAME),
                    "row": row["__source_row"],
                    "supplemental": {
                        "sheet": CONSTRUCTION_SHEET_NAME,
                        "row": row["__construction_source_row"],
                    } if row.get("__construction_source_row") else None,
                },
                "enrichment": {
                    "rd": "workbook-municipality-template" if municipality_ref else "workbook-row",
                    "geres": "municipality-mode" if not source_geres and geres != "Não informado" else "workbook",
                    "municipalityCorrected": bool(correction),
                    "investment": "construction-sheet" if is_construction and row.get("__construction_source_row") else "source-sheet" if parsed_investment != parse_money(investment_source) else "consolidated",
                    "construction": "construction-sheet" if row.get("__construction_source_row") else "source-row",
                },
            }
        )

    type_counts = Counter(unit["type"] for unit in units)
    status_counts = Counter(unit["status"] for unit in units)
    municipalities = sorted({unit["municipality"] for unit in units}, key=normalize)
    rds = sorted({unit["rd"] for unit in units}, key=normalize)
    geres_values = sorted({unit["geres"] for unit in units}, key=normalize)
    active_units = [unit for unit in units if unit["status"] == "Em funcionamento"]
    construction_units = [unit for unit in units if unit["status"] == "Em construção"]
    type_counts_by_status = {
        status: dict(sorted(Counter(unit["type"] for unit in units if unit["status"] == status).items()))
        for status in status_counts
    }
    construction_municipalities = {unit["municipality"] for unit in construction_units}
    operational_beds = [unit["beds"] for unit in active_units if unit["beds"] is not None]
    planned_beds = [unit["plannedBeds"] for unit in construction_units if unit["plannedBeds"] is not None]
    opened_beds = [unit["bedsOpenedInManagement"] for unit in active_units if unit["bedsOpenedInManagement"] is not None]
    renovation_beds = [unit["bedsToOpenAfterRenovation"] for unit in active_units if unit["bedsToOpenAfterRenovation"] is not None]
    active_source_rows = [row for row in raw_rows if normalize_status(row.get("STATUS")) == "Em funcionamento"]
    construction_source_rows = [row for row in raw_rows if normalize_status(row.get("STATUS")) == "Em construção"]

    quality = {
        "sourceFile": workbook_path.name,
        "sourceSheet": SHEET_NAME,
        "sourceSheets": [SHEET_NAME, CONSTRUCTION_SHEET_NAME],
        "generatedAt": date.today().isoformat(),
        "sourceRows": len(raw_rows),
        "constructionRows": len(construction_rows),
        "publishedUnits": len(units),
        "municipalities": len(municipalities),
        "sourceCoverage": {
            "municipality": source_coverage(raw_rows, "NOME MUNICIPIO"),
            "rd": source_coverage(raw_rows, "RD"),
            "geres": source_coverage(raw_rows, "GERES"),
            "address": source_coverage(raw_rows, "LOCALIZAÇÃO"),
            "operationalBeds": sum(1 for row in active_source_rows if parse_integer(row.get("LEITOS")) is not None),
            "plannedBeds": sum(1 for row in construction_source_rows if parse_integer(row.get("LEITOS")) is not None),
            "bedsOpenedInManagement": sum(1 for row in active_source_rows if parse_integer(row.get("LEITOS ABERTOS NESTA GESTÃO")) is not None),
            "openedBedTypes": source_coverage(active_source_rows, "TIPOS DE LEITOS ABERTOS NESTA GESTÃO"),
            "bedsToOpenAfterRenovation": sum(1 for row in active_source_rows if parse_integer(row.get("LEITOS A ABRIR COM O FIM DA REFORMA")) is not None),
            "operationalProfile": source_coverage(active_source_rows, "PERFIL"),
            "plannedProfile": source_coverage(construction_source_rows, "PERFIL"),
            "maintenanceContract": money_source_coverage(active_source_rows, "CONTRATO DE MANUTENÇÃO PREDIAL"),
            "managementInvestment": money_source_coverage(active_source_rows, "INVESTIMENTO NESTA GESTÃO"),
            "constructionInvestment": money_source_coverage(construction_source_rows, "INVESTIMENTO NESTA GESTÃO"),
            "mainAdvances": source_coverage(raw_rows, "PRINCIPAIS AVANÇOS"),
            "coordinates": 0,
        },
        "enrichment": {
            "rdFromWorkbookMunicipalityTemplate": rd_enriched,
            "geresFromMunicipalityMode": geres_enriched,
            "investmentFromSourceSheets": investments_enriched,
            "constructionDetailsFromSheet": sum(1 for row in raw_rows if row.get("__construction_source_row")),
            "documentedCorrections": len(corrections),
        },
        "corrections": corrections,
        "warnings": [
            "A planilha não contém latitude/longitude; os marcadores do mapa representam o município, não o endereço exato.",
            "Valores ausentes permanecem nulos e são exibidos como Não informado.",
            "RD e código IBGE foram normalizados pela aba 0_Template_Cod_Mun_RD da própria planilha para permitir busca consistente.",
            f"{len(construction_units)} unidades da aba UNIDADES EM CONSTRUÇÃO são publicadas com status Em construção; seus leitos são tratados como previstos e excluídos do total operacional.",
            "Leitos abertos nesta gestão e leitos a abrir após reformas são indicadores de expansão e não são somados ao estoque de leitos em funcionamento nem aos leitos previstos de novas obras.",
            "O rótulo Grandes Emergências na coluna Tipo foi normalizado como Hospital para preservar a taxonomia de unidades do painel.",
            "O valor Especializado em Tipo Gestão (Hemope) foi preservado, mas requer validação semântica pela área responsável.",
        ],
        "headers": headers,
    }

    return {
        "meta": {
            "title": "Unidades de Saúde de Pernambuco",
            "sourceLabel": "Planilha Saúde · 20 ago 2026",
            "generatedAt": quality["generatedAt"],
            "totalUnits": len(units),
            "activeUnits": len(active_units),
            "constructionUnits": len(construction_units),
            "constructionMunicipalities": len(construction_municipalities),
            "totalMunicipalities": len(municipalities),
            "totalBeds": sum(operational_beds),
            "unitsWithBeds": len(operational_beds),
            "plannedBeds": sum(planned_beds),
            "constructionUnitsWithBeds": len(planned_beds),
            "bedsOpenedInManagement": sum(opened_beds),
            "unitsWithBedsOpenedInManagement": len(opened_beds),
            "bedsToOpenAfterRenovation": sum(renovation_beds),
            "unitsWithBedsToOpenAfterRenovation": len(renovation_beds),
            "typeCounts": dict(sorted(type_counts.items())),
            "typeCountsByStatus": type_counts_by_status,
            "statusCounts": dict(status_counts),
        },
        "filters": {
            "municipalities": municipalities,
            "rds": rds,
            "geres": geres_values,
            "types": sorted(type_counts, key=normalize),
            "statuses": [status for status in ("Em funcionamento", "Em construção") if status in status_counts],
        },
        "units": units,
        "map": {
            **map_data,
            "fallbackCenters": {
                "2605459": {"x": 935, "y": 48, "label": "Fernando de Noronha"}
            },
        },
        "dataQuality": quality,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Gera o JSON do painel a partir das abas Consolidado e UNIDADES EM CONSTRUÇÃO.")
    parser.add_argument("--workbook", type=Path, default=DEFAULT_WORKBOOK)
    parser.add_argument("--map-data", type=Path, default=DEFAULT_MAP_DATA)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--quality-output", type=Path, default=DEFAULT_QUALITY_OUTPUT)
    args = parser.parse_args()

    payload = build_payload(args.workbook, args.map_data)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.quality_output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    args.quality_output.write_text(json.dumps(payload["dataQuality"], ensure_ascii=False, indent=2), encoding="utf-8")
    print(
        json.dumps(
            {
                "output": str(args.output),
                "units": payload["meta"]["totalUnits"],
                "activeUnits": payload["meta"]["activeUnits"],
                "constructionUnits": payload["meta"]["constructionUnits"],
                "municipalities": payload["meta"]["totalMunicipalities"],
                "operationalBeds": payload["meta"]["totalBeds"],
                "plannedBeds": payload["meta"]["plannedBeds"],
                "bedsOpenedInManagement": payload["meta"]["bedsOpenedInManagement"],
                "bedsToOpenAfterRenovation": payload["meta"]["bedsToOpenAfterRenovation"],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
