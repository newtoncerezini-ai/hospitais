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

The workbook is the factual source. The published dataset combines `Consolidado` and `UNIDADES EM CONSTRUÇÃO`: 73 records, with 65 operating and 8 under construction, across 25 municipalities. Six municipalities have construction projects. The overview keeps 6,796 operational beds in 50 operating facilities separate from 861 planned beds in 5 projects. Source/enrichment metadata remains available and missing values remain explicit. Filters cover facility, municipality, RD, GERES, type and status.

## Constraints

Inherit the institutional shell and visual language of `C:\workspace\ips`. No coordinates exist, so map markers are municipal-level. Never imply exact address positioning. Markers are grouped by municipality, type and status, packed on a deterministic 52 px grid and connected to a municipal anchor; construction markers use a dashed outline while retaining their source type color. Narrow screens use a horizontally scrollable cartographic stage instead of shrinking the 46 px targets. Preserve print legibility, keyboard operation and mobile access.

## Direction and memorable moment

An executive health-network console: deep-blue navigation opens onto a continuous summary rail, a dense but controlled status-aware list, a symbol-coded Pernambuco map and a document-like technical sheet. The map reads as a municipal constellation: compact symbol bouquets remain legible while fine leader lines make their territorial anchors explicit, and dashed contours distinguish works in progress. The memorable interaction is moving from a municipal type-and-status marker or table row directly into the same printable facility record.

## Unresolved decisions

Final public versus internal audience, official product name/logo, publishing target and update ownership.
