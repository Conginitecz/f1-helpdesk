# F1 Help Desk — Stitch Design Reference

Source of truth for the UI restructure (Phase 1 audit → Phase 2 build).
Treat these files as the spec for layout, navigation, spacing, colors and
typography.

## Provenance

Exported from Stitch. The original archive
(`stitch_f1_help_desk_prototype (1).zip`) contains **74 screen folders** —
mostly mobile Customer (`c_*`) and Service Engineer (`se_*`) screens that are
out of scope for the V0 Admin / Super Admin dashboard slice.

Only the screens relevant to this slice are committed here, to keep the repo
small. If a screen is needed that is not in this folder, re-export it from
Stitch and add it rather than inventing it.

## `design-system/DESIGN.md` — read this first

The authoritative design-system spec: the full Material-3 style color token
set, typography scale (Hanken Grotesk / Inter / JetBrains Mono), spacing
scale, 5 elevation tiers, radius distribution, and per-component specs for
buttons, badges, banners, tables, timeline nodes and form inputs.

Every token in the restructured UI comes from this file.

## Screen inventory

| Folder | Screen | Maps to route | Status |
|---|---|---|---|
| `design-system/DESIGN.md` | Design system spec | shared tokens + components | authoritative |
| `super_admin_dashboard_sa_02` | Super Admin Overview & Platform Health | `/super-admin` | partial — see note |
| `admin_operational_dashboard_a_02` | Operations Command Center | `/admin` | partial — see note |
| `request_management_lifecycle_a_12_a_13` | Dispatch & Request Operations | *(out of V0 scope)* | reference for table/filter/pager patterns |
| `po_decisions_ecosystem_architecture` | Product-owner decisions | *(no route)* | context only |
| `app_startup_role_gateway` | Role gateway (Customer / Engineer) | *(no admin route)* | reference only |
| `c_03_customer_login` | Customer login (mobile) | — | reference only; **screenshot missing** |
| `se_02_service_engineer_login` | Engineer login (mobile) | — | reference only; **screenshot missing** |
| `c_30_empty_loading_error_states` | Empty / loading / error states | `ScreenState` component | reference for state styling |
| `splash_screen` | Splash | — | reference only |

## Screenshot caveat

Stitch failed to render several `screen.png` files. Those folders contain a
28-byte placeholder whose entire contents are the literal text
`<FIFE Image failed to fetch>` — not a render of the design. The placeholders
were **not** committed; each affected folder has a `SCREENSHOT-MISSING.md`
explaining it.

Affected: `super_admin_dashboard_sa_02` (the key screen), `c_03_customer_login`,
`se_02_service_engineer_login`.

For every one of these, `code.html` **is** complete and valid and is the
authoritative source — it carries the full Tailwind token config and the whole
page markup. I verified byte counts and that each file ends with
`</div></body></html>`.

All four exported archives were checked; every one has the same 28-byte
placeholder for `super_admin_dashboard_sa_02`, so no valid render exists to
recover. To get real renders, re-export from Stitch and drop the PNGs in.

### Note on the two dashboards

Both `super_admin_dashboard_sa_02` and `admin_operational_dashboard_a_02`
are high-fidelity but design a **larger product than V0**: SLA watch banners,
dispatch-engine latency, Kafka buffer queue, API response budget, Chennai zone
telemetry, immutable audit ledger, live dispatch queue with per-request SLA
timers, and role-elevation approval.

The V0 API does not provide that data. Use these screens for **layout,
navigation, page furniture, metric-tile treatment and table structure only** —
not as a content checklist. Data the design needs but the API does not expose
is listed in the Phase 1 audit; do not build panels for it.

## Missing designs

No Stitch screen exists for: admin/super-admin **web login**, Locations &
admins, Partners, Status requests, Inventory, or Configuration. The
`design-system/DESIGN.md` tokens and the table/filter patterns in
`request_management_lifecycle_a_12_a_13` govern those screens. If the design
and `docs/development-docs.md` conflict, ask the owner instead of guessing.
