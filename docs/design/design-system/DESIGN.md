---
name: F1 Help Desk Enterprise
colors:
  surface: '#f9f9ff'
  surface-dim: '#cadaff'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e8edff'
  surface-container-high: '#e0e8ff'
  surface-container-highest: '#d7e2ff'
  on-surface: '#041b3c'
  on-surface-variant: '#434655'
  inverse-surface: '#1d3052'
  inverse-on-surface: '#edf0ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#006a64'
  on-secondary: '#ffffff'
  secondary-container: '#80f2e9'
  on-secondary-container: '#006f69'
  tertiary: '#3750a0'
  on-tertiary: '#ffffff'
  tertiary-container: '#5069bb'
  on-tertiary-container: '#eff0ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#83f5ec'
  secondary-fixed-dim: '#65d9cf'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#00504b'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b6c4ff'
  on-tertiary-fixed: '#00164e'
  on-tertiary-fixed-variant: '#264191'
  background: '#f9f9ff'
  on-background: '#041b3c'
  surface-variant: '#d7e2ff'
  deep-blue: '#1E3A8A'
  dark-navy: '#102A43'
  accent-teal: '#0F9D95'
  accent-green: '#16A085'
  surface-base: '#F5F9FA'
  surface-card: '#FFFFFF'
  border-subtle: '#D9E3EA'
  text-primary: '#172B4D'
  text-muted: '#64748B'
  success: '#16A085'
  warning-pending: '#F59E0B'
  error-alert: '#EF4444'
  info-blue: '#2563EB'
  po-checkpoint-bg: '#FEF3C7'
  po-checkpoint-border: '#D97706'
  po-checkpoint-text: '#92400E'
typography:
  headline-xl:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-xl-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a high-precision, mission-critical operations environment tailored for technical service marketplaces. Serving an interconnected ecosystem across Super Admins, Operations Managers, Field Service Engineers, Third-Party Vendors, and Retail/B2B Customers, the visual language balances authoritative enterprise reliability with immediate operational legibility.

### Personality & Core Attributes
- **Systematic & Objective:** Visual elements emphasize strict audit trails, zero ambiguity in state transitions, and immediate differentiation between confirmed logic and assumptions awaiting product owner sign-off.
- **Durable & Industrial:** Built to perform reliably under varied field conditions—from direct sunlight in field diagnostic environments to multi-monitor operations dispatch dashboards.
- **Trust-Centric & Accountable:** Every interaction highlights verification states, proof-of-work indicators (before/after media), and stage timestamps without unnecessary decoration.

### Movement & Aesthetics
The design adopts a **Corporate / Modern High-Density** aesthetic infused with structural grid alignment, crisp 1px hairpins, subtle cool-tinted surface elevations, and dedicated callout tokens for policy gates. It avoids frivolous decorative gradients or soft skeuomorphism, prioritizing data density, rapid scanning across tabular layouts, multi-tier state machines, and unmistakable warning indicators.

## Colors

The color palette is engineered for high data clarity, strict status differentiation, and full accessibility compliance across desktop consoles and mobile web dispatch views.

### Architectural Palette Application
- **Primary (`#2563EB`):** Applied to primary actions, active state transitions, key interactive links, and forward progression buttons (e.g., "Accept Job", "Verify Engineer").
- **Secondary (`#0F9D95`):** Reserved for technical credentials, verified certifications, valid SLA indicators, and technician telemetry metrics.
- **Tertiary Deep Blue (`#1E3A8A`):** Used for top-level operational navigation, primary dashboard headers, and table head backgrounds.
- **Dark Navy (`#102A43`):** Anchors high-density sidebar navigation, console frames, and modal headers for elevated admin authority.
- **Neutral Primary Text (`#172B4D`) & Muted (`#64748B`):** Establishes contrast against `#FFFFFF` surfaces and `#F5F9FA` canvas backgrounds, guaranteeing a contrast ratio above 7:1 for critical telemetry.

### Semantic & Checkpoint Tokens
- **Success (`#16A085`):** Used for completed repairs, verified certifications, customer arrival validations, and cleared background checks.
- **Warning / Pending (`#F59E0B`):** Highlights awaiting customer confirmations, near-expiry certifications (within 30 days), and dispatch retry queues.
- **Error (`#EF4444`):** Flags engineer no-shows, disciplinary suspensions, payment failures, and license cancellations.
- **Pending Product Owner Confirmation (`#FEF3C7` background, `#D97706` border, `#92400E` text):** A non-negotiable operational token set dedicated to fencing features, UI sections, and state actions that require explicit business sign-off before production enforcement.

## Typography

The typographic hierarchy is designed around fast cognitive processing of operational datasets, dense administrative tables, and transactional tracking.

### Font Selections & Pairing
- **Headings (Hanken Grotesk):** Provides structured, contemporary geometric sharpness suitable for administrative portals and service order summaries.
- **Body & Controls (Inter):** Maximizes readability at 12px–14px sizes within multi-column tables, state timelines, forms, and technician detail panels.
- **Telemetry & Identity Codes (JetBrains Mono):** Reserved for technical data strings, including Request IDs (`#REQ-CH-9812`), Engineer IDs (`#ENG-4029`), verification hashes, diagnostic checklists, and timestamp logs.

### Application Rules
1. **Request Tracking IDs & Status Codes:** Must always use `data-mono-md` or `data-mono-sm` to prevent misreading during phone-based customer escalations.
2. **Table Numeric Figures:** Monospace font variants or tabular figures (`tnum`) must be enforced for fee columns, 80/20 split calculations, and diagnostic pricing tiers.
3. **Line Height Discipline:** Enterprise compact components (table rows, compact chips) strictly utilize tight line heights (14px–20px) to maximize above-the-fold screen capacity.

## Layout & Spacing

The layout utilizes a structured 12-column fluid grid system pinned to minimum margins to balance comprehensive administrative oversight with field mobile workflows.

### Grid & Density Profiles
- **Desktop (>= 1280px):** 12-column layout with 24px (`gutter-desktop`) gutters and 32px (`margin-desktop`) outer canvas padding. Left-hand navigation is fixed at 260px; right-hand contextual drawer opens at 420px for engineer dossier reviews.
- **Tablet (768px - 1279px):** 8-column layout with 16px (`gutter`) gutters and 24px margins. Navigation collapses to an icon dock (64px).
- **Mobile (< 768px):** 4-column layout with 12px gutters and 16px outer margins. Modals transform into bottom sheets with unified action bars pinned above mobile viewports.

### Spacing Scale Guidelines
- `space-xs` (4px): Inner badge padding, icon-to-label inline offsets, table row micro-spacers.
- `space-sm` (8px): Stack spacing between metadata items, input field interior vertical padding.
- `space-md` (16px): Default padding for standard data table cells, list item splits, card header-to-body spacing.
- `space-lg` (24px): Dashboard metric card internal padding, timeline node intervals.
- `space-xl` (32px): Primary section stack dividers, lifecycle progression milestone blocks.

## Elevation & Depth

Visual hierarchy relies on clean structural outlines, low-contrast panel separation, and subtle directional shadows rather than heavy blurs or saturated colored glows.

### Tiers of Elevation
- **Level 0 (Base Canvas):** `#F5F9FA` background with 0 elevation. Hosts all layout scaffolding, table regions, and secondary dashboard surfaces.
- **Level 1 (Card & Section Surfaces):** `#FFFFFF` background with a crisp 1px border (`#D9E3EA`) and an ultra-subtle ambient shadow: `0 1px 3px 0 rgba(16, 42, 67, 0.05)`. Used for tables, filter panels, and engineer record sheets.
- **Level 2 (Hovered Cards & Dropdowns):** `#FFFFFF` surface accompanied by `0 4px 6px -1px rgba(16, 42, 67, 0.08), 0 2px 4px -2px rgba(16, 42, 67, 0.04)`. Applied to active job assignment cards, action dropdowns, and date-range pickers.
- **Level 3 (Slide-in Panels & Side Drawers):** `#FFFFFF` with `0 10px 15px -3px rgba(16, 42, 67, 0.10), 0 4px 6px -4px rgba(16, 42, 67, 0.05)`. Used for Engineer Verification Dossiers and Dispute Audit Log drawers.
- **Level 4 (System Modals & Critical Overlays):** `#FFFFFF` surface with `0 20px 25px -5px rgba(16, 42, 67, 0.12), 0 8px 10px -6px rgba(16, 42, 67, 0.06)`, framed over a 50% opacity backdrop `#102A43` overlay. Used for License Revocation and Disciplinary Suspension dialogs.

## Shapes

The design system enforces a **Soft (Level 1)** geometric standard (`0.25rem` / 4px base border radius). This compact, architectural rounding conveys institutional rigor and allows compact data alignment across high-density administrative dashboards.

### Radius Distribution
- **Buttons, Form Inputs, Badges, Tabs:** `4px` (`rounded-sm`). Maintains structured tabular alignment with minimal visual drift.
- **Cards, Modals, Action Drawers:** `8px` (`rounded-lg`). Softens macroscopic structural containers without appearing informal or consumer-oriented.
- **Pill Badges (Exclusive to Status Indicators):** `9999px` (`rounded-full`). Strictly reserved for circular state chips (e.g., "Active", "Suspended", "In Progress") and count avatars.

## Components

### Buttons
- **Primary:** Background `#2563EB`, text `#FFFFFF`, 4px radius, 8px 16px padding (height: 36px enterprise standard). Hover: `#1E3A8A`. Disabled: Background `#D9E3EA`, text `#64748B`.
- **Secondary:** Surface `#FFFFFF`, border 1px solid `#D9E3EA`, text `#172B4D`. Hover: Background `#F5F9FA`, border `#172B4D`.
- **Destructive:** Background `#EF4444`, text `#FFFFFF`. Hover: `#DC2626`. Used strictly for "Suspend License", "Reject Verification", or "Cancel Request".
- **Compact Table Action:** Height 28px, font size 12px, 4px radius, 4px 8px padding.

### Chips & Badges
- **Status Badges:** Height 22px, font size 11px, font-family `Inter`, font-weight 600, rounded-full.
  - *Verified / Eligible:* Background `#E6F7F5`, text `#16A085`, border 1px solid `#16A085`.
  - *Suspended / Cancelled:* Background `#FEE2E2`, text `#EF4444`, border 1px solid `#EF4444`.
  - *Certification Pending / Expired:* Background `#FEF3C7`, text `#F59E0B`, border 1px solid `#F59E0B`.
- **Pending Product Owner Confirmation Badge:** Height 24px, uppercase, monospace tracking, font-family `JetBrains Mono`, background `#FEF3C7`, text `#92400E`, border 1px dashed `#D97706`.

### Operational Banners
- **PO Checkpoint Banner:** Full-width container with a `#FEF3C7` background, a 1px solid `#D97706` border, and a 4px left-accent border of `#D97706`. Displays the Checkpoint ID (e.g., `[PO-09: Incorrect Diagnosis Liability]`), description of unconfirmed business rules, and a tag warning developers that the logic below is provisional.

### Tables & Data Grids
- **Header:** Background `#F5F9FA`, border-bottom 2px solid `#D9E3EA`, text `#172B4D`, uppercase, font size 11px, weight 700.
- **Row:** Height 44px, border-bottom 1px solid `#D9E3EA`, alternating zebra pattern optional (hover state: background `#F0F4F8`).
- **Cells:** Padding 8px 16px. Numerical data and IDs rendered using `JetBrains Mono`.

### Timeline & State Progression Indicators
- Linear sequence representing the service lifecycle: `Requested` → `Engineers Notified` → `Accepted` → `Time Confirmed` → `Address Revealed` → `En Route` → `Reached` → `In Progress` → `Repair Completed` → `Payment Pending` → `Order Completed`.
- **Active Node:** Circle with a 2px `#2563EB` ring and `#FFFFFF` fill with an internal `#2563EB` pulse dot.
- **Completed Node:** Solid `#16A085` background with an inline white checkmark.
- **Connecting Track:** 2px solid `#D9E3EA` for pending legs, 2px solid `#16A085` for completed legs.

### Form Inputs & Checkboxes
- **Input Fields:** Height 36px, background `#FFFFFF`, border 1px solid `#D9E3EA`, text `#172B4D`, radius 4px. Focus: border 1px solid `#2563EB`, box-shadow `0 0 0 2px rgba(37, 99, 235, 0.15)`.
- **Checkboxes & Radios:** 16px × 16px, border 1px solid `#D9E3EA`, active background `#2563EB`, radius 2px (checkbox) or circular (radio).

### Evidence & Diagnostic Photo Upload Card
- Dedicated pre-service and post-service dual-pane media module. Framed with a 1px dashed `#D9E3EA` border, light gray `#F5F9FA` thumbnail background, status pill ("Pre-Service Verification Captured"), and an immutable timestamp overlay anchored in `JetBrains Mono`.