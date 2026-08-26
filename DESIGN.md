---
name: "Institutional Clarity"
description: "A precise executive health-network console built from deep navy, analytical white, and functional cyan."
colors:
  institutional-navy: "#0b1c30"
  institutional-navy-soft: "#122a46"
  functional-cyan: "#0ea5e9"
  action-blue: "#006591"
  analytical-white: "#ffffff"
  canvas-mist: "#f5f7f9"
  muted-surface: "#edf1f4"
  ink: "#191c1e"
  secondary-text: "#5b6572"
  divider: "#d8e0e7"
  divider-soft: "#e9eef2"
  hospital-blue: "#006591"
  upa-terracotta: "#cf5d32"
  upae-violet: "#7154a8"
  upae-r-teal: "#168772"
  status-operating: "#176448"
  status-operating-soft: "#e5f3ec"
  status-construction: "#8a5200"
  status-construction-soft: "#fff1d6"
  focus-blue: "#0284c7"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(30px, 3.4vw, 47px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(27px, 3vw, 36px)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  action:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 800
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 850
    letterSpacing: "0.045em"
rounded:
  control: "6px"
  navigation: "7px"
  compact-surface: "8px"
  callout: "9px"
  content: "10px"
  panel: "12px"
  pill: "999px"
  circle: "50%"
spacing:
  xs: "5px"
  sm: "8px"
  md: "12px"
  control-x: "16px"
  section-gap: "18px"
  panel: "24px"
  page: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-blue}"
    textColor: "{colors.analytical-white}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "#004f73"
    textColor: "{colors.analytical-white}"
    rounded: "{rounded.control}"
  button-secondary:
    backgroundColor: "{colors.analytical-white}"
    textColor: "#16324a"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "#f0f6f9"
    textColor: "#16324a"
    rounded: "{rounded.control}"
  button-icon:
    backgroundColor: "#e5f2f8"
    textColor: "{colors.action-blue}"
    rounded: "{rounded.control}"
    width: "40px"
    height: "40px"
  input-field:
    backgroundColor: "#f8fafb"
    textColor: "#172a3c"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "#b9cbd9"
    typography: "{typography.action}"
    rounded: "{rounded.navigation}"
    padding: "0 13px"
    height: "48px"
  nav-item-active:
    backgroundColor: "#16415f"
    textColor: "#8bddff"
    typography: "{typography.action}"
    rounded: "{rounded.navigation}"
  panel:
    backgroundColor: "{colors.analytical-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "24px"
  chip-type:
    backgroundColor: "#e2e8f0"
    textColor: "#334155"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
    height: "26px"
  chip-status:
    backgroundColor: "{colors.status-operating-soft}"
    textColor: "{colors.status-operating}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 9px"
    height: "26px"
  summary-metric:
    backgroundColor: "{colors.analytical-white}"
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    rounded: "{rounded.panel}"
    padding: "24px 26px"
  technical-document-mark:
    backgroundColor: "{colors.institutional-navy}"
    textColor: "{colors.analytical-white}"
    rounded: "{rounded.callout}"
    padding: "20px"
---

# Design System: Institutional Clarity

## Overview

**Creative North Star: "Institutional Clarity"**

Institutional Clarity turns a large administrative health dataset into a calm, authoritative instrument for territorial consultation. A deep-blue shell establishes public-sector confidence, while white analytical surfaces, fine dividers, compact Inter typography, and controlled cyan affordances keep attention on facts rather than decoration.

The system is deliberately dense but never cramped: hierarchy comes from continuous rails, aligned grids, restrained tonal layers, and strongly differentiated labels, metrics, and prose. Its character is precise, transparent, and operational; the same facility identity travels consistently from filters and tables to the municipal map and printable technical sheet.

**Key Characteristics:**

- Deep-navy institutional chrome around white analytical work surfaces.
- Functional cyan reserved for actions, focus, active states, and quantitative emphasis.
- Compact Inter hierarchy with tracked uppercase labels and tabular numerals.
- Divider-led depth, softly precise corners, and almost no ambient shadow.
- Dense desktop grids that become stacked, touch-ready records on small screens.

## Colors

The palette combines institutional navy and functional cyan with cool paper neutrals; five controlled hues encode facility type, while a separate green-and-ochre pair and a neutral unknown state communicate status without competing with classification.

### Primary

- **Institutional Navy** (`institutional-navy`): persistent navigation, document marks, and the strongest institutional anchor.
- **Soft Institutional Navy** (`institutional-navy-soft`): supporting dark layer inside the shell.
- **Functional Cyan** (`functional-cyan`): luminous accent for icons and active emphasis.
- **Action Blue** (`action-blue`): primary actions, links, bars, and quantitative highlights.
- **Focus Blue** (`focus-blue`): keyboard focus and field-focus feedback.

### Secondary

- **Hospital Blue** (`hospital-blue`): hospital classification in bars, badges, map symbols, and legends.
- **UPA Terracotta** (`upa-terracotta`): UPA classification only.
- **UPAE Violet** (`upae-violet`): UPAE classification only.
- **UPAE-R Teal** (`upae-r-teal`): UPAE-R classification only.
- **Credentialed Slate** (`credentialed-slate` / `credentialed-slate-soft`): Rede Credenciada classification in badges, summaries, legends and map segments.

### Status

- **Operating Green** (`status-operating` / `status-operating-soft`): operating-facility text, borders and quiet badge surfaces.
- **Construction Ochre** (`status-construction` / `status-construction-soft`): construction labels, contextual surfaces and the dashed map-marker contour.
- **Unknown Neutral:** source records without status; never interpreted as operating or under construction.

### Neutral

- **Analytical White** (`analytical-white`): cards, tables, controls, and printable records.
- **Canvas Mist** (`canvas-mist`): application canvas and loading states.
- **Muted Surface** (`muted-surface`): secondary tonal containers.
- **Ink** (`ink`): default high-contrast content.
- **Secondary Text** (`secondary-text`): explanatory copy and metadata.
- **Divider / Soft Divider** (`divider`, `divider-soft`): structural separation at two strengths.

**The Cyan Means Action Rule.** Functional cyan and action blue identify interaction, focus, active state, or meaningful quantitative emphasis; they are not broad decorative fills.

**The Classification Is Semantic Rule.** Facility colors never change by page or chart: blue is Hospital, slate is Rede Credenciada, terracotta is UPA, violet is UPAE, and teal is UPAE-R.

**The Status Is Orthogonal Rule.** Status never replaces facility classification. Green or ochre badges and the municipal marker's dashed contour communicate lifecycle state while its ring continues to encode the local type mix.

## Typography

**Display Font:** Inter with the system sans-serif fallback stack  
**Body Font:** Inter with the system sans-serif fallback stack  
**Label Font:** Inter with the system sans-serif fallback stack

**Character:** One variable sans-serif family carries the entire interface. Tight headlines and metrics provide executive authority; compact, highly weighted labels make dense administrative data easy to scan.

### Hierarchy

- **Display:** responsive, tightly tracked metrics with tabular numerals; used in the summary rail and major technical-sheet values.
- **Headline:** responsive page titles with compact leading and negative tracking.
- **Title:** panel and section headings, visually firm without competing with page titles.
- **Body:** compact explanatory copy, field values, table cells, and long-form record text; reading blocks stop around 64–75 characters.
- **Action:** strongly weighted 14px text for buttons, links, and desktop navigation.
- **Label:** 10–12px, usually uppercase and tracked, for field names, metadata, table headers, and KPI captions.

**The Administrative Scan Rule.** Labels are small, uppercase, tracked, and heavy; values remain mixed case and larger so a user can separate category from fact at a glance.

**The Numbers Align Rule.** Counts, currency, beds, and other comparable quantities use tabular numerals.

## Layout

The desktop shell is a two-column grid with a sticky 280px sidebar and a fluid main region. Main content is capped at 1620px, centered, and padded by 32px; 24px is the dominant space between major analytical regions. Summary information is presented as a continuous four-cell rail, while overview and map pages use asymmetric content/detail grids.

The units table deliberately preserves data density with a 2940px minimum width, a sticky header, a sticky facility-name column, and a viewport-relative scroll area. Its status, operational-bed, planned-bed, compact bed-expansion, management-investment and construction-investment columns keep unlike measures separate. The three expansion fields remain separate in CSV and mobile detail. At 1280px, filters and quality metadata reflow. At 1040px, the sidebar becomes a horizontal header and multi-column panels stack. At 760px, navigation becomes horizontally scrollable, summaries become single-column, the desktop table becomes mobile facility cards, and technical-sheet grids collapse. At 460px, filters and toolbar actions become one column.

Print is a first-class layout: the technical record targets A4 with 10mm page margins, removes application chrome, squares the document container, uses millimeter-based padding, and avoids breaks inside KPI and detail blocks.

**The Executive Shell Rule.** Preserve the 280px institutional navigation anchor on wide screens and the continuous summary rail before introducing page-specific composition.

## Elevation & Depth

The system is flat by default. Depth comes from cool tonal layering, 1px borders, sticky positioning, and divider continuity rather than ambient card shadows. Shadows appear only as state feedback: a two-pixel field focus halo, a three-pixel global focus outline, a one-pixel sticky-column divider, and a small drop shadow on enlarged map markers.

### Shadow Vocabulary

- **Field focus halo:** a 2px mixed focus-blue ring with no offset, used only while a composite search field contains focus.
- **Global focus outline:** a 3px translucent focus-blue outline offset by 2px on keyboard focus.
- **Sticky divider:** a 1px horizontal shadow that keeps the fixed facility-name column distinct while scrolling.
- **Marker lift:** a compact 4px-by-5px drop shadow paired with slight scale on hover or selection.

**The Flat by Default Rule.** Resting analytical surfaces are separated by tone and border; shadow is reserved for focus, stickiness, or direct manipulation.

## Shapes

Geometry is softly precise. Controls use compact 6–7px corners, small metadata surfaces use 8–10px corners, and major panels use 12px corners. Pills are reserved for GERES, facility-type and status labels; true circles are reserved for markers and loading indicators. The print sheet removes outer rounding so it reads as a document rather than an app card.

**The Soft Precision Rule.** Radius communicates scale: controls stay compact, panels soften slightly, and only semantic tags or circular controls become fully rounded.

## Components

### Buttons

- **Shape:** compact controls with a 44px minimum height and 6px corners.
- **Primary:** action-blue fill, white type, 16px horizontal padding, and an 800-weight label; hover deepens the blue without adding shadow.
- **Secondary:** white fill, cool-blue text, and a visible gray-blue border; hover changes only the surface tone.
- **Icon:** a 40px square on a pale cyan surface; hover strengthens the tint.
- **Focus:** all buttons receive the global high-visibility focus outline; disabled buttons retain structure at reduced opacity.

### Inputs / Fields

- **Style:** 44px-tall pale controls with a 1px gray-blue stroke, 6px corners, and 12px horizontal padding.
- **Labels:** compact uppercase metadata placed seven pixels above the control.
- **Focus:** border shifts to focus blue and the search wrapper receives the field focus halo.

### Navigation

Navigation sits directly on institutional navy. Each item is a 48px ghost button with a 7px radius and muted blue-gray text; hover adds a deeper navy tile and white text, while active state uses a medium navy tile with luminous cyan text. Below 1040px it becomes a four-column bar; below 760px it becomes icon-led and horizontally scrollable.

### Cards / Containers

Major panels use analytical white, a 1px divider border, 12px corners, and no resting shadow. Internal padding clusters around 18–25px. Summary cards remain visually connected inside one bordered rail rather than becoming disconnected floating tiles.

### Chips

GERES, facility type and status badges are compact, strongly weighted pills. Facility badges use pale tonal backgrounds paired with darker semantic type colors; the corresponding bars, legends, and map symbols use the saturated classification color. Status badges use green, ochre or neutral gray so status stays visually independent from type and absent status is never mistaken for operation.

### Data Tables

The table is a dense comparison surface: 13px cells, uppercase 11px headers, horizontal dividers, a lightly tinted sticky header, a sticky facility-name column, and a subtle row-hover tint. Construction rows receive a restrained ochre tint. Numeric and currency columns use tabular figures. A compact expansion cell groups the two delivery counts for scanning while preserving the bed-type description; operational values remain separate from planned construction and renovation-expansion values.

### Map Markers

Each municipality uses one circular marker anchored at a verified interior point. Colored ring segments summarize the local mix of Hospital, Rede Credenciada, UPA, UPAE and UPAE-R; the center shows the total number of units. A dashed ochre outer contour indicates that at least one local unit is under construction. The visible glyph adapts to the polygon's internal clearance while retaining a 44px interaction target. The corresponding municipality polygon is also interactive and receives the same selected state; arrival motion is suppressed for reduced-motion users.

### Technical Sheet

The printable record combines a pale identity band, an institutional-navy document mark, a visible status badge, a continuous KPI grid, and divider-separated detail blocks. It labels beds and investment according to operational or construction status. When expansion data exists, a full-width pale analytical block separates beds opened in the administration, their types and beds expected after renovations, with an explicit non-additivity note. On narrow screens the identity, KPIs, and details stack; in print, navigation and toolbars disappear and document geometry becomes square.

**The One Record Everywhere Rule.** Table links, mobile cards, and municipal map results all resolve to the same document-like technical sheet.

## Do's and Don'ts

### Do:

- **Do** use borders and cool tonal shifts before adding shadow.
- **Do** keep cyan scarce and functional: actions, active states, focus, and meaningful data emphasis.
- **Do** preserve the facility-type color mapping across badges, charts, legends, and map-marker segments.
- **Do** keep status orthogonal to type and use the dashed contour consistently when a municipality has construction.
- **Do** use tabular numerals for counts, beds, currency, and aligned comparisons.
- **Do** keep the technical sheet legible as a stacked mobile view and as an A4 print document.

### Don't:

- **Don't** turn the interface into a field of disconnected floating cards.
- **Don't** use facility classification colors as general decoration or status colors.
- **Don't** add operational beds, construction beds, beds opened during the administration or beds expected after renovations to one another; do not add management investment to construction investment.
- **Don't** add ambient shadows to resting panels, tables, or filter groups.
- **Don't** hide source gaps or imply exact map coordinates where only municipality-level placement exists.
- **Don't** preserve the wide desktop table on mobile; use the implemented record-card transformation.
