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

The workbook is the factual source. The published dataset combines `Consolidado` and `UNIDADES EM CONSTRUÇÃO`: 98 records across 31 municipalities, with 65 operating, 8 under construction and 25 credentialed-network records whose status is not supplied. Six municipalities have construction projects; the credentialed network appears in 15. The overview keeps 6,796 operational beds in 50 operating facilities separate from 861 planned beds in 5 projects, 726 beds opened in the current administration across 27 records (696 in the credentialed network and 30 in hospitals), and 543 beds to open after renovations in 4 facilities. Source/enrichment metadata and possible duplicates remain available, and missing values remain explicit. Filters cover facility, municipality, RD, GERES, type and status, including the unknown-status state.

## Constraints

Inherit the institutional shell and visual language of `C:\workspace\ips`. No coordinates exist, so every facility symbol is distributed illustratively inside its municipal polygon and must never imply exact address positioning. Keep symbol positions stable while filters change. Hospitals use the amplified blue healthcare-cross symbol; other facilities use neutral dots; a dashed ochre contour identifies construction. Combinable controls expose multiple types, statuses and evidence signals, and both symbols and polygons resolve to the same filtered municipal detail. Preserve keyboard operation, horizontal mobile exploration and explicit geographic disclosure.

## Direction and memorable moment

An executive health-network console: deep-blue navigation opens onto a continuous summary rail, a dedicated bed-expansion analysis, a dense but controlled status-aware list, a unit-level Pernambuco map and a document-like technical sheet. Expansion reads as a separate evidence block, never as an addition to operational or construction totals. A slate credentialed-network treatment keeps classification visible without implying operational status; missing status uses a neutral badge and explicit copy. The map reads as a field of interventions over one quiet territorial color: amplified hospital crosses lead the composition, neutral points preserve the full network and ochre contours flag works in progress. The memorable interaction is combining filters and seeing symbols, municipal emphasis, counts and the technical-sheet list respond together.

## Unresolved decisions

Final public versus internal audience, official product name/logo, publishing target and update ownership.
