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

The product connects a consolidated operational list, an auditable view of missing/enriched fields, a municipal map classified by facility type and a printable technical sheet in one interface.

## Operating Context

The initial source is `Lista de Hospitais de Pernambuco_20260820_Planilha_Saúde.xlsx`, especially the `Consolidado` sheet. The current workflow is a static portal generated from the workbook; future data ownership, update cadence and publishing target are undecided.

## Capabilities and Constraints

- List facilities with municipality, address, beds, profile, type, management type, management body, RD, GERES, maintenance contract, management investment and main advances.
- Search and filter by facility, municipality, RD and GERES.
- Generate a printable technical sheet per facility.
- Show an offline Pernambuco map with markers classified by facility type.
- The source workbook has no latitude/longitude. The first map therefore positions facilities at municipality level and must say so explicitly.
- Source gaps remain visible as `Não informado`; original healthcare data must not be overwritten.
- Enrichment and corrections must be documented in generated data-quality metadata.

## Brand Commitments

Use the institutional layout language of `C:\workspace\ips`: deep-blue navigation, cyan accents, white analytical surfaces, restrained borders, compact data typography and a responsive executive-dashboard shell. Reuse the language and interaction patterns, not IPS-specific content, metrics or branding. No official product name or logo has been confirmed.

## Evidence on Hand

- Source workbook: `C:\Users\newton.cerezini\Downloads\Lista de Hospitais de Pernambuco_20260820_Planilha_Saúde.xlsx`.
- Layout and interaction reference: `C:\workspace\ips`, with `src\main.tsx`, `src\styles.css` and `DESIGN.md` as current visual authority.
- Local municipal code, Development Region and SVG geometry reference: `C:\workspace\ips\public\data\dashboard.json`.
- No coordinates, confirmed official logo, testimonials or external performance claims are available and none should be fabricated.

## Product Principles

- Make the facility and its operational facts easy to find in seconds.
- Distinguish source values, enriched values and missing values.
- Keep dense administrative data readable and printable.
- Use geography honestly: municipal context now, exact coordinates only when reliable data exists.
- Preserve a reproducible path from the source workbook to the interface.

## Accessibility & Inclusion

Target keyboard-operable controls, visible focus, semantic labels, readable contrast, reduced-motion support and a mobile layout. Printed technical sheets must remain legible in grayscale.
