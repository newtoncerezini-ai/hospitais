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
            rows.append(row)
    return headers, rows


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
    ignored_sheets = {SHEET_NAME, "0_Template_Cod_Mun_RD", "UNIDADES EM CONSTRUÇÃO"}
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


def count_construction_units(workbook_path: Path) -> int:
    workbook = load_workbook(workbook_path, read_only=True, data_only=True)
    sheet = workbook["UNIDADES EM CONSTRUÇÃO"]
    return sum(1 for row in sheet.iter_rows(min_row=2, values_only=True) if clean_text(row[1] if len(row) > 1 else None))


def load_map(map_path: Path) -> dict[str, Any]:
    with map_path.open(encoding="utf-8") as stream:
        data = json.load(stream)
    return data.get("map", data)


def source_coverage(rows: list[dict[str, Any]], header: str) -> int:
    return sum(1 for row in rows if clean_text(row.get(header)))


def build_payload(workbook_path: Path, map_path: Path) -> dict[str, Any]:
    headers, raw_rows = read_rows(workbook_path)
    municipality_reference = read_municipality_reference(workbook_path)
    source_investments = read_source_investments(workbook_path)
    map_data = load_map(map_path)
    construction_units = count_construction_units(workbook_path)

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
        correction = municipality_corrections.get(normalize(unit_name))
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
                "status": clean_text(row.get("STATUS")),
                "type": (clean_text(row.get("TIPO")) or "Não informado").replace("UPAE/R", "UPAE-R"),
                "managementType": clean_text(row.get("TIPO GESTÃO")),
                "management": clean_text(row.get("GESTÃO")),
                "beds": parse_integer(row.get("LEITOS")),
                "profile": clean_text(row.get("PERFIL")),
                "professionals": clean_text(row.get("PROSSIONAIS")),
                "calledProfessionals": parse_integer(row.get("PROFISSIONAIS CONVOCADOS NA GESTÃO")),
                "maintenanceContract": parse_money(row.get("CONTRATO DE MANUTENÇÃO PREDIAL")),
                "managementInvestment": parsed_investment,
                "mainAdvances": clean_text(row.get("PRINCIPAIS AVANÇOS")),
                "latitude": None,
                "longitude": None,
                "source": {"sheet": SHEET_NAME, "row": row["__source_row"]},
                "enrichment": {
                    "rd": "workbook-municipality-template" if municipality_ref else "workbook-row",
                    "geres": "municipality-mode" if not source_geres and geres != "Não informado" else "workbook",
                    "municipalityCorrected": bool(correction),
                    "investment": "source-sheet" if parsed_investment != parse_money(investment_source) else "consolidated",
                },
            }
        )

    type_counts = Counter(unit["type"] for unit in units)
    municipalities = sorted({unit["municipality"] for unit in units}, key=normalize)
    rds = sorted({unit["rd"] for unit in units}, key=normalize)
    geres_values = sorted({unit["geres"] for unit in units}, key=normalize)
    numeric_beds = [unit["beds"] for unit in units if unit["beds"] is not None]

    quality = {
        "sourceFile": workbook_path.name,
        "sourceSheet": SHEET_NAME,
        "generatedAt": date.today().isoformat(),
        "sourceRows": len(raw_rows),
        "publishedUnits": len(units),
        "municipalities": len(municipalities),
        "sourceCoverage": {
            "municipality": source_coverage(raw_rows, "NOME MUNICIPIO"),
            "rd": source_coverage(raw_rows, "RD"),
            "geres": source_coverage(raw_rows, "GERES"),
            "address": source_coverage(raw_rows, "LOCALIZAÇÃO"),
            "beds": source_coverage(raw_rows, "LEITOS"),
            "profile": source_coverage(raw_rows, "PERFIL"),
            "maintenanceContract": source_coverage(raw_rows, "CONTRATO DE MANUTENÇÃO PREDIAL"),
            "managementInvestment": source_coverage(raw_rows, "INVESTIMENTO NESTA GESTÃO"),
            "mainAdvances": source_coverage(raw_rows, "PRINCIPAIS AVANÇOS"),
            "coordinates": 0,
        },
        "enrichment": {
            "rdFromWorkbookMunicipalityTemplate": rd_enriched,
            "geresFromMunicipalityMode": geres_enriched,
            "investmentFromSourceSheets": investments_enriched,
            "documentedCorrections": len(corrections),
        },
        "corrections": corrections,
        "warnings": [
            "A planilha não contém latitude/longitude; os marcadores do mapa representam o município, não o endereço exato.",
            "Valores ausentes permanecem nulos e são exibidos como Não informado.",
            "RD e código IBGE foram normalizados pela aba 0_Template_Cod_Mun_RD da própria planilha para permitir busca consistente.",
            f"{construction_units} unidades da aba UNIDADES EM CONSTRUÇÃO não integram o Consolidado e não são publicadas nesta primeira versão.",
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
            "totalMunicipalities": len(municipalities),
            "totalBeds": sum(numeric_beds),
            "unitsWithBeds": len(numeric_beds),
            "typeCounts": dict(sorted(type_counts.items())),
        },
        "filters": {
            "municipalities": municipalities,
            "rds": rds,
            "geres": geres_values,
            "types": sorted(type_counts, key=normalize),
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
    parser = argparse.ArgumentParser(description="Gera o JSON do painel a partir da aba Consolidado.")
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
                "municipalities": payload["meta"]["totalMunicipalities"],
                "beds": payload["meta"]["totalBeds"],
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
