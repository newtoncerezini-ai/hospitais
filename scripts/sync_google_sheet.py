from __future__ import annotations

import json
import os
import shutil
import tempfile
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from build_data import (
    DEFAULT_MAP_DATA,
    DEFAULT_OUTPUT,
    DEFAULT_QUALITY_OUTPUT,
    DEFAULT_WORKBOOK,
    DRIVE_SHEET_NAME,
    build_payload,
    canonical_unit_key,
)


DEFAULT_SHEET_ID = "1I0rhyE5D9jvFqe6IHPsyCxSyr3QZEL-AgL4p2DMGTEE"


def download_sheet(sheet_id: str, destination: Path) -> None:
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=xlsx"
    request = urllib.request.Request(url, headers={"User-Agent": "painel-saude-pe-data-sync/1.0"})
    with urllib.request.urlopen(request, timeout=60) as response, destination.open("wb") as stream:
        content_type = response.headers.get("Content-Type", "")
        if "spreadsheet" not in content_type and "application/octet-stream" not in content_type:
            raise RuntimeError(f"Resposta inesperada do Google Drive: {content_type or 'sem Content-Type'}")
        shutil.copyfileobj(response, stream)
    if destination.stat().st_size < 10_000 or destination.read_bytes()[:2] != b"PK":
        raise RuntimeError("O download não produziu um arquivo XLSX válido.")


def load_previous_payload() -> dict | None:
    if not DEFAULT_OUTPUT.exists():
        return None
    try:
        return json.loads(DEFAULT_OUTPUT.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def validate_payload(payload: dict, previous: dict | None) -> None:
    units = payload["units"]
    meta = payload["meta"]
    errors: list[str] = []
    if payload["dataQuality"]["sourceSheet"] != DRIVE_SHEET_NAME:
        errors.append(f"a aba principal não é {DRIVE_SHEET_NAME}")
    if len(units) < 90:
        errors.append(f"somente {len(units)} unidades foram produzidas")
    if len({unit["id"] for unit in units}) != len(units):
        errors.append("há IDs duplicados")
    for field in ("name", "municipality", "rd", "ibgeCode"):
        missing = [unit["name"] for unit in units if not unit.get(field) or unit.get(field) == "Não informado"]
        if missing:
            errors.append(f"{len(missing)} unidade(s) sem {field}")

    status_counts = Counter(unit["status"] for unit in units)
    type_counts = Counter(unit["type"] for unit in units)
    if status_counts["Em funcionamento"] < 60:
        errors.append("a rede em funcionamento caiu abaixo de 60 unidades")
    if status_counts["Em construção"] < 8:
        errors.append("obras em construção foram perdidas")
    if type_counts["Rede Credenciada"] < 25:
        errors.append("a Rede Credenciada não foi integralmente incorporada")
    if meta["plannedBeds"] < 800:
        errors.append("o total de leitos previstos ficou abaixo do piso de segurança")

    units_by_key = {canonical_unit_key(unit["name"]): unit for unit in units}
    required_by_column = {
        "I": "beds",
        "J": "profile",
        "K": "professionals",
        "L": "calledProfessionals",
        "M": "maintenanceContract",
        "N": "managementInvestment",
        "T": "mainAdvances",
    }
    for formula_error in payload["dataQuality"].get("formulaErrors", []):
        unit = units_by_key.get(canonical_unit_key(formula_error["unitName"]))
        field = required_by_column.get(formula_error["cell"][0])
        if not unit or not field:
            continue
        value = unit.get(field)
        if isinstance(value, dict):
            recovered = value.get("amount") is not None or value.get("label") is not None
        else:
            recovered = value is not None and value != "#N/A"
        if not recovered:
            errors.append(f"{formula_error['cell']} ({formula_error['unitName']}) não foi recuperada")

    if previous:
        previous_meta = previous.get("meta", {})
        for key, label in (
            ("totalUnits", "unidades"),
            ("totalBeds", "leitos operacionais"),
            ("bedsOpenedInManagement", "leitos abertos na gestão"),
            ("bedsToOpenAfterRenovation", "leitos após reformas"),
        ):
            old_value = previous_meta.get(key)
            new_value = meta.get(key)
            if isinstance(old_value, (int, float)) and old_value > 0 and new_value < old_value * 0.8:
                errors.append(f"queda superior a 20% em {label}: {old_value} → {new_value}")

    if errors:
        raise RuntimeError("Validação da nova base falhou: " + "; ".join(errors))


def write_atomically(path: Path, content: str) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.parent.mkdir(parents=True, exist_ok=True)
    temporary.write_text(content, encoding="utf-8")
    os.replace(temporary, path)


def main() -> None:
    sheet_id = os.environ.get("HEALTH_UNITS_GOOGLE_SHEET_ID", DEFAULT_SHEET_ID).strip()
    previous = load_previous_payload()
    with tempfile.TemporaryDirectory(prefix="hospitais-drive-") as temporary_directory:
        downloaded = Path(temporary_directory) / "health-units.xlsx"
        download_sheet(sheet_id, downloaded)
        payload = build_payload(downloaded, DEFAULT_MAP_DATA)
        payload["dataQuality"]["sourceFile"] = f"google-sheet-{sheet_id}.xlsx"
        payload["dataQuality"]["downloadedAt"] = datetime.now(timezone.utc).isoformat()
        payload["dataQuality"]["googleSheetId"] = sheet_id
        validate_payload(payload, previous)

        write_atomically(DEFAULT_OUTPUT, json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
        write_atomically(DEFAULT_QUALITY_OUTPUT, json.dumps(payload["dataQuality"], ensure_ascii=False, indent=2))
        workbook_temporary = DEFAULT_WORKBOOK.with_suffix(".xlsx.tmp")
        workbook_temporary.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(downloaded, workbook_temporary)
        os.replace(workbook_temporary, DEFAULT_WORKBOOK)

    print(json.dumps({
        "sourceSheet": payload["dataQuality"]["sourceSheet"],
        "units": payload["meta"]["totalUnits"],
        "activeUnits": payload["meta"]["activeUnits"],
        "constructionUnits": payload["meta"]["constructionUnits"],
        "credentialedUnits": payload["meta"]["typeCounts"].get("Rede Credenciada", 0),
        "operationalBeds": payload["meta"]["totalBeds"],
        "plannedBeds": payload["meta"]["plannedBeds"],
        "formulaErrorsRecovered": len(payload["dataQuality"].get("formulaErrors", [])),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
