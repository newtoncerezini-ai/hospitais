# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated from the supplied reference: React, TypeScript and Vite, with a static JSON data pipeline and print CSS for technical sheets. The structural and visual reference is `C:\workspace\ips`.

## Users

Primary audience assumed for this first version: public administrators, health-network managers, researchers and citizens consulting Pernambuco health facilities. Whether the final portal is public or restricted to internal users remains an open decision.

## Product Purpose

Provide a clear, searchable view of Pernambuco health facilities and turn each source row into an individual technical sheet. Success means a user can find a facility by municipality, name, Development Region (RD) or GERES, understand its profile and management information, locate it at municipal level and print or save its technical sheet as PDF.

## Positioning

The product connects an operational and construction-status facility list, an auditable view of missing/enriched fields, a municipal map classified by facility type and status, and a printable technical sheet in one interface.

## Operating Context

The published dataset combines the `Consolidado` and `UNIDADES EM CONSTRUÇÃO` sheets from the supplied workbook. It contains 73 facilities: 65 operating and 8 under construction, across 25 municipalities, with construction present in 6 of them. The current workflow is a static portal generated from the workbook; future data ownership, update cadence and publishing target are undecided.

## Capabilities and Constraints

- List facilities with status, municipality, address, operational or planned beds, profile, type, management type, management body, RD, GERES, maintenance contract, applicable investment and main advances.
- Search by facility, municipality, RD and GERES; filter by those territorial fields, type and status.
- Generate a printable technical sheet per facility.
- Show an offline Pernambuco map with markers classified by facility type, grouped by municipality, type and status. A dashed outline identifies facilities under construction without changing the type color.
- The source workbook has no latitude/longitude. The first map therefore positions facilities at municipality level and must say so explicitly.
- Keep operational capacity separate from planned capacity: 6,796 operational beds in 50 operating facilities and 861 planned beds in 5 construction projects.
- Preserve the source type distribution: Hospital 40, UPA 14, UPAE 15 and UPAE-R 4.
- Source gaps remain visible as `Não informado`; original healthcare data must not be overwritten.
- Enrichment and corrections must be documented in generated data-quality metadata.

## Brand Commitments

Use the institutional layout language of `C:\workspace\ips`: deep-blue navigation, cyan accents, white analytical surfaces, restrained borders, compact data typography and a responsive executive-dashboard shell. Reuse the language and interaction patterns, not IPS-specific content, metrics or branding. No official product name or logo has been confirmed.

## Evidence on Hand

- Source workbook preserved in the project: `data/raw/health-units.xlsx`, supplied as `C:\Users\newton.cerezini\Downloads\Lista de Hospitais de Pernambuco_20260820_Planilha_Saúde (1).xlsx`.
- Layout and interaction reference: `C:\workspace\ips`, with `src\main.tsx`, `src\styles.css` and `DESIGN.md` as current visual authority.
- Local municipal code, Development Region and SVG geometry reference: `C:\workspace\ips\public\data\dashboard.json`.
- No coordinates, confirmed official logo, testimonials or external performance claims are available and none should be fabricated.

## Product Principles

- Make the facility and its operational facts easy to find in seconds.
- Distinguish operating facilities from construction projects and operational beds from planned beds.
- Distinguish source values, enriched values and missing values.
- Keep dense administrative data readable and printable.
- Use geography honestly: municipal context now, exact coordinates only when reliable data exists.
- Preserve a reproducible path from the source workbook to the interface.

## Accessibility & Inclusion

Target keyboard-operable controls, visible focus, semantic labels, readable contrast, reduced-motion support and a mobile layout. Printed technical sheets must remain legible in grayscale.
