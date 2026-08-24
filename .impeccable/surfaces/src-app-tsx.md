---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["src/styles.css","src/views/OverviewView.tsx","src/views/UnitsView.tsx","src/views/MapView.tsx","src/views/TechnicalSheetView.tsx"]
---

## Scope and mode

Single-page web application rooted at `src/App.tsx`. Mode: Operate.

## Audience, job and action

Public administrators, health-network managers, researchers and citizens need to find a Pernambuco health facility quickly, inspect its territorial and management facts, and print or save an individual technical sheet.

## Content and proof

The workbook is the factual source. The first release publishes 65 active records from `Consolidado`, includes source/enrichment metadata, and labels missing values. Filters cover facility, municipality, RD, GERES and type.

## Constraints

Inherit the institutional shell and visual language of `C:\workspace\ips`. No coordinates exist, so map markers are municipal-level. Never imply exact address positioning. Markers are grouped by municipality and type, packed on a deterministic 52 px grid and connected to a municipal anchor; narrow screens use a horizontally scrollable cartographic stage instead of shrinking the 46 px targets. Preserve print legibility, keyboard operation and mobile access.

## Direction and memorable moment

An executive health-network console: deep-blue navigation opens onto a continuous summary rail, a dense but controlled list, a symbol-coded Pernambuco map and a document-like technical sheet. The map reads as a municipal constellation: compact symbol bouquets remain legible while fine leader lines make their territorial anchors explicit. The memorable interaction is moving from a municipal type marker or table row directly into the same printable facility record.

## Unresolved decisions

Final public versus internal audience, official product name/logo, publishing target, update ownership and whether to add the eight construction units.
