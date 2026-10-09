# Changelog

All notable changes to the F1 Help Desk project. Newest entries first.

---

## 2026-10-09 — Milestone 16: Admin UI

Added the admin vendor, engineer, and assigned-location inventory screens using the existing backend endpoints. No M17 work was started.

### Added or changed
- `frontend/src/app/admin/page.tsx` — replaced the placeholder with links to the admin work areas; no admin summary/count endpoint exists.
- `frontend/src/app/admin/vendors/page.tsx` — added this admin's vendor list with contact fields, status and created date, plus a manual vendor form and link to add engineers under a vendor.
- `frontend/src/app/admin/engineers/page.tsx` and `frontend/src/components/admin/partner-form.tsx` — added direct/vendor-owned engineer creation, owner/type/status labels, active-only skill/category dropdowns, and confirm-before-request activation/deactivation actions.
- `frontend/src/app/admin/inventory/page.tsx` — reused the M15 inventory form/list in assigned-location mode and reads lookup options from the active-only admin master-data endpoint.
- `frontend/src/components/inventory/inventory-list.tsx` and `inventory-form.tsx` — added assigned mode for a location-free, read-only admin inventory list (showing the server-returned location ID) and mapped master-data validation errors to their form fields.
- `frontend/src/components/role-shell.tsx` and `frontend/src/app/globals.css` — enabled admin navigation and added matching responsive directory/form styling.
- `backend/src/scripts/seed-master-data.ts` — extended the existing repeatable seed with active `inventory_type` rows: `Spare part`, `Consumable`, and `Accessory`; the readback now includes these rows.

### Verification and decisions
- Real browser as admin 13 created vendor 18, direct engineer 19, vendor-owned engineer 20, pending deactivation requests 8/9, and inventory item 9. Both confirmation dialogs appeared; engineers 19/20 remained active while requests were pending. Request 9 displayed Pending approval and disabled its action button.
- The inventory screen offered the three active types and had no location input/select. The create response and Neon both confirmed location 14, creator admin 13, type 7, and active state; the read-only list displays `Location #14`.
- A second admin (ID 14) saw no vendor or engineer rows from admin 13. Both admins have location 14, so admin 14 can see item 9 through the existing location-scoped inventory endpoint; inventory is shared at location scope, not isolated by creator.
- Neon confirmed partner ownership/reference data: vendor 18 belongs to admin 13; engineer 19 references admin 13; engineer 20 references vendor 18; requests 8/9 are pending deactivations. Seed IDs 7-9 are active inventory types. All M16 records are listed for demo purge in `docs/completed-checklist.md`.
- Browser console/page-error capture was empty for admin login and the vendor, engineer, request, inventory, and isolation workflows. Frontend lint/build passed; backend build and all 5 backend tests passed. Backend lint reports only the existing unused catch variable warning in `src/auth/auth.service.ts:86`.
- API gaps: there is no admin vendor edit or inventory edit endpoint; there is no admin read endpoint for request outcomes, so the UI displays and disables repeat requests for the returned `pending` request only and cannot refresh it to `approved`/`rejected`; `/admin/inventory` returns `location_id` but no location name, and no admin location lookup exists; no active engineer skill/category rows were configured. No new endpoints or schema changes were made.
- The admin home uses links because no admin overview endpoint exists. Configuration editing remains out of scope.

## 2026-10-09 — Milestone 15: Super-Admin Inventory UI

Added the inventory portion of the super-admin UI. Configuration editors were cut from the demo scope; M16 had not started at this milestone's completion.

### Added or changed
- `frontend/src/app/super-admin/inventory/page.tsx` — added inventory list, location filter, create/edit flows, and lookup/location/admin reads through existing endpoints.
- `frontend/src/components/inventory/inventory-list.tsx` and `inventory-form.tsx` — added reusable inventory list/form components. Form supports selectable location for super admin and assigned-location mode for future admin reuse.
- `frontend/src/components/inventory/types.ts` — added shared inventory item, lookup, location, and creator response shapes.
- `frontend/src/components/role-shell.tsx` and `frontend/src/app/globals.css` — enabled Inventory and added basic inventory form/table styling. Configuration remains disabled.

### Verification and decisions
- Real browser created inventory ID 8 in location 4, edited it, and filtered by location 4; no browser console/page errors.
- Neon confirmed the edited TEST-M15 item, category 5, 11 units, price 23.45, location 4, super-admin creator ID 1, and active state.
- Frontend lint and production build passed. No backend or schema changes.
- API gap: only `/admin/master-data` guarantees active rows, but it is admin-role guarded. Super-admin UI reads `/super-admin/master-data` and client-filters `is_active`. No active inventory types are presently configured. Delete is not exposed by the API and is omitted.
- TEST inventory ID 8 is listed for demo purge in the completed checklist.

---

## 2026-10-09 — Milestone 14: Super-Admin UI (Demo Minimum)

Added the initial super-admin UI using only the existing backend endpoints.

### Added or changed
- `frontend/src/app/super-admin/page.tsx` — replaced the placeholder with counts from existing locations, admins, partner, and status-request GET endpoints.
- `frontend/src/app/super-admin/locations-admins/page.tsx` — added locations/admin lists, location creation, and the API-required admin creation form with assigned location.
- `frontend/src/app/super-admin/partners/page.tsx` — added a read-only all-admin partner overview, resolving opaque master-data partner type codes to readable labels and joining owner/location data.
- `frontend/src/app/super-admin/status-requests/page.tsx` — added deactivation request listing, confirm-before-action approve/reject controls, refreshed results, and graceful HTTP 409 handling.
- `frontend/src/components/role-shell.tsx` and `frontend/src/app/globals.css` — enabled M14 links and added basic directory/form/table/count styling. Configuration and inventory links remain disabled.

### Verification and decisions
- Browser created TEST location 14 and admin 12 assigned to it, and both appeared in their lists. Admin 12 logged in separately and submitted two deactivation requests for engineers 16/17; the super-admin UI approved request 6 and rejected request 7.
- Neon confirmed engineer 16 inactive after approval and engineer 17 still active after rejection; the request statuses persisted as approved/rejected.
- The partners overview displayed 13 rows and readable Vendor/Service engineer labels, with owner admin and location.
- Frontend lint/build passed. No backend changes or new API endpoints were needed. M14 fixtures are recorded for purge in the completed checklist.
- Temporary local development credentials used for browser automation were removed from the final tree; no credentials are included in the change.

---

## 2026-10-09 — Milestone 13: Login UI, Route Protection & Role Shells

Added the initial browser authentication flow and role workspaces.

### Added or changed
- `frontend/src/lib/api.ts` — added the `NEXT_PUBLIC_API_URL` fetch wrapper, auth response/session types, Bearer header, login/logout helpers, and 401 session clearing/navigation.
- `frontend/src/app/login/page.tsx` — added email/password login with loading and generic API error states, then role-based redirects.
- `frontend/src/components/role-shell.tsx` and `auth-navigation.tsx` — added client-side role validation, shared role shell, disabled future-screen navigation, logout, and 401 navigation handling.
- `frontend/src/app/page.tsx`, `admin/page.tsx`, and `super-admin/page.tsx` — replaced static links/placeholders with session redirect and role shell entry pages.
- `frontend/src/app/globals.css` and `frontend/env.local.example` — added basic responsive auth/shell styling and the public API URL setting example.

### Verification and decisions
- Real browser at `http://localhost:3000` against the running Nest API: super-admin/admin logins reached their role homes; wrong password showed a clear generic error; both logout flows cleared session; logged-out direct routes redirected to login; cross-role navigation returned to the matching home; logged-out `/` redirected to login.
- Browser console had no JavaScript/page exceptions. The deliberately wrong password generated the expected failed-resource console entry for the backend's HTTP 401.
- Frontend `npm run lint` and `npm run build` passed.
- The API login contract returns `access_token` and `user: { id, role }`, with roles `admin` and `super_admin`; logout is stateless, so the client discards localStorage. Client-side guards are used because localStorage is not available to Next middleware.
- A local development-only credential fixture used for browser automation was removed before commit; no credential endpoint or credentials are included in this change.

---

## 2026-10-09 — Milestone 12: Backend Full Pass & CORS

Completed the backend user-journey pass and enabled the browser preflight needed by the Next.js origin.

### Added or changed
- `backend/src/main.ts` — configured Nest CORS for `http://localhost:3000`, explicit API methods including `OPTIONS`, and `Authorization`/`Content-Type` headers.
- `docs/completed-checklist.md` — recorded the full HTTP journey, Neon final-state verification, CORS evidence, and all M12 test fixture IDs for purge.

### Verification and decisions
- Full HTTP journey passed without manual database fixture edits: super-admin login; create location/admin; admin login; create vendor and vendor/direct engineers; request and approve deactivation; create super-admin and admin inventory.
- Neon confirmed location 13/admin 11; vendor 13; vendor-owned engineer 14 active; direct engineer 15 inactive; approved request 5; inventory 6/7 both at location 13 with correct creator audit IDs.
- CORS preflight from `http://localhost:3000` to `/admin/inventory` returned 204 and allowed `POST`, `OPTIONS`, `Authorization`, and `Content-Type`. Prior 404 root-caused to missing `app.enableCors()` in bootstrap.
- Full backend tests passed (4 files, 5 tests); `npm run build` passed. No schema or migration changes.

---

## 2026-10-09 — Milestone 11: Admin Inventory & Master Data Read

Added admin-scoped inventory access and active-only master-data reads.

### Added or changed
- `backend/src/inventory/inventory.controller.ts` — added guarded `GET /admin/inventory` and `POST /admin/inventory` routes.
- `backend/src/inventory/inventory.service.ts` — scopes inventory reads to the authenticated admin's assigned location and forces that location/audit identity on create, regardless of client `location_id`.
- `backend/src/inventory/create-inventory.dto.ts` and `inventory.module.ts` — allow the shared create DTO to carry an optional location field (still required by super-admin service validation) and register the admin repository/controller.
- `backend/src/master-data/master-data.controller.ts`, `master-data.service.ts`, and `master-data.module.ts` — added an admin-only GET with active-only filtering and optional type filtering.

### Verification and decisions
- Live HTTP as admin ID 8: inventory GET returned 200 with only location 4 rows; POST with client `location_id=1` returned 201 and the created response used location 4.
- Admin master-data GET returned one active `inventory_category` row and excluded inactive fixture ID 6. Neon confirmed inventory ID 3 has location 4/admin creator 8, and master-data ID 6 is inactive.
- Focused regression suite passed (2 files, 3 tests); backend build passed. No schema or migration changes were needed.
- The inactive lookup row is a named test fixture listed for purge before demo.

---

## 2026-10-09 — Milestone 10: Admin Partner Ownership & Status Requests

Added the admin-scoped partner flow covering direct vendor creation, direct
engineer creation, vendor-scoped engineer onboarding, and admin-submitted
status-change requests for service engineers.

### Added or changed
- `backend/src/partners/partners.controller.ts` — added the guarded
  `@Controller('admin/partners')` routes for `GET /admin/partners`,
  `POST /admin/partners`, `POST /admin/partners/:vendorPartnerId/service-engineers`,
  and `POST /admin/partners/:id/request-status-change`.
- `backend/src/partners/partners.service.ts` — added the admin ownership logic,
  reference-type resolution, partner scoping for the calling admin, and the
  pending status-request creation flow.
- `backend/src/partners/create-partner.dto.ts` and
  `backend/src/partners/request-status-change.dto.ts` — strict DTO validation for
  vendor/engineer creation and activate/deactivate requests.
- `backend/src/partners/partners.module.ts` — registered the admin controller and
  the `StatusChangeRequest` repository used to create pending requests.
- `backend/src/partners/partners.service.spec.ts` — regression covering the admin's
  ownership-scoping behavior across direct and vendor-traced engineer rows.

### Verification and decisions
- The focused M10 regression passed: `npx vitest run src/partners/partners.service.spec.ts`.
- The backend typechecks cleanly: `npx tsc -p tsconfig.json --pretty false --noEmit` exited 0.
- Fresh live HTTP verification on port 7677 created TEST-M10 vendor ID 7, direct engineer ID 8, vendor-owned engineer ID 9, and request ID 3. Admin filters returned the rows; Neon confirmed the expected reference IDs and that engineer ID 8 remained active while its request was pending, then remained active after rejection.
- A second TEST admin (ID 9) was created over HTTP. Its vendor and engineer lists were empty while admin 8 saw vendor IDs 5/7 and engineer IDs 6/8/9. Creating under admin 8's vendor from admin 9 returned 404 and inserted no row.
- All four admin-only endpoints returned 401 without a token and 403 with the super-admin token. M8 resolution/role gates were also rerun: rejecting request 3 returned 200, repeat resolution returned 409, and all six M8 endpoints returned 401 unauthenticated / 403 with the admin token.
- Fresh M8 live recheck on the same build returned 200 for both super-admin partner filters and the status-request list. Neon reconfirmed TEST-M8 vendor ID 5 active, engineer ID 6 inactive, and request IDs 1/2 approved/rejected.
- No schema or migration change was required; the existing `partners` and
  `status_change_requests` tables matched the documented M10 contract.

---

## 2026-10-09 — Milestone 9: Super Admin Inventory

Added the missing super-admin inventory API surface, with the required explicit
`location_id` on create, location filtering, and patchable item updates.

### Added or changed
- `backend/src/inventory/inventory.controller.ts` — guard-protected
  `GET /super-admin/inventory`, `POST /super-admin/inventory`, and
  `PATCH /super-admin/inventory/:id` for the documented M9 contract.
- `backend/src/inventory/inventory.service.ts` — validates location existence and
  activity, enforces `location_id` for creates, filters by `location_id` in GET,
  validates type/category master-data rows, and sets the creator audit from the
  authenticated super-admin JWT.
- `backend/src/inventory/create-inventory.dto.ts` and
  `update-inventory.dto.ts` — strict payload validation for the inventory fields,
  with `location_id` required for create and optional for update.
- `backend/src/inventory/inventory.module.ts` — registered the controller/service
  and the `Location`/`MasterData` repositories needed by the inventory rules.
- `backend/src/inventory/inventory.service.spec.ts` — regression test covering the
  missing `location_id` rejection path that is required by M9.

### Verification and decisions
- The focused M9 regression test passed: `npx vitest run src/inventory/inventory.service.spec.ts`.
- Live HTTP verification on port 7677 created TEST-M9 inventory ID 2 in location 4, confirmed it appeared in `GET /super-admin/inventory?location_id=4`, and patched its name. Neon confirmed the persisted location and `created_by_super_admin_id=1`.
- The required M9 behavior is enforced in the service layer: nonexistent or inactive
  locations throw `400`, and super-admin inventory creation rejects missing
  `location_id` with a clear validation message.
- No schema or migration changes were required; the existing `inventory_items`
  table already matched the docs. This milestone was implemented in the app layer
  only.

## 2026-10-09 — Milestone 8: Super Admin Partners & Status Requests

Added guarded super-admin partner listing/toggles and status-request
resolution. No schema changes or migrations were made.

### Added or changed
- `backend/src/partners/partners.controller.ts` and `partners.service.ts` —
  GET vendor/engineer filters resolved through seeded opaque master-data codes;
  direct activate/deactivate routes return explicit partner columns.
- `backend/src/partners/partners.module.ts` — registered controller/service and
  the partner/master-data repositories.
- `backend/src/status-requests/status-requests.controller.ts` and
  `status-requests.service.ts` — list, approve, and reject operations. Approval
  changes the partner and request in one transaction; repeat resolutions return
  409; resolver ID comes from JWT.
- `backend/src/status-requests/status-requests.module.ts` — registered the
  controller/service and repositories.
- `docs/completed-checklist.md` — recorded M8 HTTP, DB, unit-test, and lint results.

### Tables touched
- Neon `partners`: TEST-M8 vendor ID 5 and engineer ID 6.
- Neon `status_change_requests`: approve fixture ID 1 and reject fixture ID 2.
- No schema changes or migrations.

### Verification and decisions
- Vendor/engineer filters, direct toggles, approve/deactivate, reject/no-toggle,
  unknown IDs, non-numeric IDs, repeat-resolution conflict, and role guards were
  tested over real HTTP; psql confirmed final state and resolver audit ID 1.
- Fresh live recheck on port 7677 returned 200 for vendor/engineer filters and the status-request list; Neon reconfirmed TEST-M8 vendor ID 5 active, engineer ID 6 inactive, approved request ID 1, and rejected request ID 2. Rejecting request ID 3 returned 200 and left partner ID 8 active; resolving it again returned 409.
- All six M8 endpoints returned 401 without a token and 403 with admin ID 8's token.
- Backend build and unit suite passed (1 test file, 1 test); lint has the
  pre-existing unused catch-variable warning in `auth.service.ts`.
- The database had no M4 partner-shaped fixtures, so clearly named TEST-M8 rows
  and pending requests were inserted as test fixtures using opaque master-data
  code lookups. These remain listed for purge.

## 2026-10-09 — Milestone 7 Closeout: Real Admin Login & Config Creation

Completed the real-admin authorization check and the approved config creation
contract. No schema changes or migrations were made.

### Added or changed
- `backend/src/configurations/create-configuration.dto.ts` — POST body accepts
  `{ key, value }`; trims input, validates a lowercase/digit/underscore key,
  and rejects empty values.
- `backend/src/configurations/configurations.service.ts` — maps the new payload
  and sources `updated_by_super_admin_id` from the JWT.
- `backend/src/scripts/seed-configurations.ts` and `backend/package.json` —
  idempotent `seed:configurations` creates `min_service_charge=500` only when
  absent, preserving later edits.
- `docs/development-docs.md` — documents the approved POST route.
- `docs/completed-checklist.md` — records real-admin, config API, seed, and
  psql verification results.
- `backend/.env` — generated local dummy admin credentials only; ignored by Git,
  not committed, and password not printed.

### Tables touched
- Neon `admins`: active standing test admin ID 8 at existing active location 4.
- Neon `configurations`: `min_service_charge` ID 2 with dummy value `500`; test
  key `test_m7_1791504779535` ID 4 with value `TEST-M7-value`.

### Verification and decisions
- Real admin login returned 201; wrong-password and unknown-account responses
  shared the same generic 401 message. Its real token got 403 from all six M7
  operations; no-token requests got 401.
- Config POST returned 201 and updater ID 1; duplicate and padded duplicate
  returned 409; invalid key returned 400; psql confirmed the row.
- Seed ran twice without duplicates. A later value of 501 survived reruns, then
  was restored to dummy value 500.
- POST is an approved deviation from the original docs, which specified only
  config GET/PATCH. The test key uses `test_m7_` because validation allows only
  lowercase letters, digits, and underscores.
- Deleted the confirmed junk cookie-jar file `300` as requested.

## 2026-10-09 — Milestone 7: Super Admin Master Data & Configuration

Added guarded super-admin endpoints for listing, creating, and relabeling
master data, plus listing, creating, and updating configuration values.

### Added
- `backend/src/master-data/create-master-data.dto.ts` and
  `update-master-data.dto.ts` — strict DTO validation, trimming, the approved
  six-type allowlist, and a 255-character label limit.
- `backend/src/master-data/master-data.controller.ts` and
  `master-data.service.ts` — type filtering, stable ordering, duplicate checks,
  label edits, and explicit responses containing only `master_data` columns.
- `backend/src/configurations/create-configuration.dto.ts` and
  `update-configuration.dto.ts` — non-empty string validation and strict
  request whitelisting.
- `backend/src/configurations/configurations.controller.ts` and
  `configurations.service.ts` — GET, approved POST for new keys, and PATCH for
  existing keys; updater IDs come from the JWT.

### Modified
- `backend/src/master-data/master-data.module.ts` and
  `backend/src/configurations/configurations.module.ts` — register controllers,
  services, and their entities with `TypeOrmModule.forFeature`.
- `backend/src/configurations/configurations.entity.ts` — expose the existing
  updater FK ID for explicit API serialization; no database column added.
- `backend/.env.example` — add placeholder names for the standing M6–M11 test
  admin credentials; real values remain local to the ignored `.env`.
- `docs/completed-checklist.md` — Milestone 7 verification, deviations, and
  retained test-data purge list.

### Tables touched
- Neon `master_data`: added test row ID 5, `TEST-M7-1791502495989`.
- Neon `configurations`: added test row ID 1, key `TEST-M7-smoke-config`,
  restored value `100`, updater super admin ID 1.
- No schema changes or migrations; no other tables were modified.

### Decisions
- Used the six documented example master-data types as the allowlist; unknown
  GET filters return `200 []`; duplicate `(type, text)` values are rejected
  case-insensitively.
- Master-data PATCH edits labels only. Its existing schema contains timestamps
  but no actor-ID audit columns. The prompt assumed actor columns; the doc
  defines timestamps only. No schema change was needed or made.
- Configuration keys were absent in the before snapshot. A separate
  `POST /super-admin/config` was approved; its finalized `{ key, value }`
  contract is recorded in the closeout entry above.
- `min_service_charge` was seeded with explicitly approved dummy value `500`
  using `ON CONFLICT DO NOTHING`; reruns preserve later edits.
- Config values are non-empty strings as stored by the documented VARCHAR
  column. DTO limits are 255 characters for keys/values and labels, and 500 for
  descriptions because the schema itself declares unbounded VARCHAR columns.
- Local dummy `TEST_ADMIN_*` values are in ignored `backend/.env`; the password
  is not printed or committed. Standing admin ID 8 is retained for M8–M11.

### Verification
- Backend build passed; oxlint reported no errors and one pre-existing
  `no-unused-vars` warning in `backend/src/auth/auth.service.ts`.
- Live HTTP checks covered master data, configuration, validation, and guards;
  detailed numbered results are in `docs/completed-checklist.md`.
- Final backend restart on port 7676 logged `Database connection established: true`.
- Audit review of §1.4 and the M3 migration confirmed both define only
  `created_at` and `updated_at` on `master_data`.

## 2026-10-08 — Milestone 4: Core Schema (Partners & Supporting Tables) via TypeORM migrations

Scope note: despite an instruction to build "only" partners +
inventory, the checklist's Milestone 4 defines **four** tables
(partners, inventory_items, configurations, status_change_requests) and
its check is "all remaining tables exist". User was asked and confirmed
all four are in scope for M4, so all four were built.

### Added
- **Entities** (integer identity PKs, snake_case columns, all per
  `development-docs.md` §1.5 / §1.7 / §1.8 / §1.9):
  - `backend/src/partners/partners.entity.ts` — merged vendor/engineer
    table. FKs: `partner_type_id`, `skill_id`, `category_id`,
    `reference_type_id` → `master_data.id`; `created_by_admin_id` →
    `admins.id` (NOT NULL). `reference_id` is a plain nullable INTEGER
    with **no FK** (polymorphic admin/partner — validated in app layer,
    per the docs note). Vendor-only fields (`email`, `address`,
    `skill_id`, `category_id`, `reference_type_id`, `reference_id`) are
    nullable.
  - `backend/src/inventory/inventory.entity.ts` — FKs: `type_id`,
    `category_id` → `master_data.id`; `location_id` → `locations.id`
    (NOT NULL); `created_by_admin_id` → `admins.id`;
    `created_by_super_admin_id` → `super_admins.id`.
  - `backend/src/configurations/configurations.entity.ts` — unique
    `config_key`; FK `updated_by_super_admin_id` → `super_admins.id`.
  - `backend/src/status-requests/status-requests.entity.ts` — FKs
    `requested_by_admin_id` → `admins.id` (NOT NULL),
    `resolved_by_super_admin_id` → `super_admins.id`; `status` default
    `'pending'`.
- **Modules** register their entity via
  `TypeOrmModule.forFeature([...])`: `partners.module.ts`,
  `inventory.module.ts`, `configurations.module.ts`,
  `status-requests.module.ts`.
- **Migration**
  `backend/src/migrations/1791479985733-M4PartnerInventory.ts` — creates
  the 4 tables + 13 FKs; `down()` drops them. Generated with
  `synchronize: false`, run via `npm run migration:run`.

### Fixed
- Migration initially emitted a camelCase `referenceId` column on
  `partners`; re-generated so the column is `reference_id` (snake_case),
  matching the docs.

### Tables affected (Neon `neondb`)
- Created: `partners`, `inventory_items`, `configurations`,
  `status_change_requests`. `migrations` gained the M4 record.

### Decisions
- Build all four M4 tables (see scope note) — confirmed with user.
- Keep `synchronize: false`; schema via migrations only (unchanged
  policy).
- No M5+ tables or functionality created (auth, controllers, services
  out of scope here).

---

## 2026-10-09 - Milestone 5: Authentication (JWT) - Completed 2026-10-09

Added the full auth layer with reusable guards (reusable for Milestones 6-11).
Only production files; no M6 endpoints, no frontend changes.

### Added
- backend/src/auth/roles.enum.ts - Role { SUPER_ADMIN='super_admin', ADMIN='admin' }, string values match docs sec 2.
- backend/src/auth/login.dto.ts - class-validator LoginDto (email required+email format, password required non-empty string).
- backend/src/auth/jwt-auth.guard.ts - reusable JwtAuthGuard: Bearer JWT -> attaches { userId, role } to request.user; same generic 401 for missing/invalid/expired token.
- backend/src/auth/roles.guard.ts + roles.decorator.ts - reusable RolesGuard + @Roles(...); 403 Insufficient role.
- backend/src/auth/current-user.decorator.ts - @CurrentUser() parameter decorator.
- backend/src/auth/auth.service.ts - login(email, password): checks super_admins first, then admins; bcryptjs verify; rejects inactive/soft-deleted with the generic error; issueToken builds JWT payload { sub, role } and body { access_token, token_type, expires_in, user: { id, role } }. logout() is a stateless ack (client discards token). Generic error returned for unknown email, wrong password, and inactive admins - response never reveals whether an account exists, never logs passwords/tokens, never returns hashes.
- backend/src/auth/auth.controller.ts - POST /auth/login (PUBLIC — no JWT guard; must be reachable without a token), POST /auth/logout (stateless). FIX (2026-10-09): earlier changelog said /auth/login was auth-guarded; it is public by design and login/logout are intentionally unprotected.
- Temporary verification routes were added (auth-test controller, 3 routes) and REMOVED after checks passed.
- backend/src/auth/auth.module.ts - JwtModule.registerAsync (secret + expiresIn from env, fails fast if unset), TypeOrmModule.forFeature([SuperAdmin, Admin]), exports AuthService, JwtAuthGuard, RolesGuard, JwtModule for reuse.
- backend/src/main.ts - fails fast if DATABASE_URL_UNPOOLED or JWT_SECRET unset; global ValidationPipe (whitelist + forbidNonWhitelisted + transform).
- backend/.env - JWT_SECRET and JWT_EXPIRES_IN=7d set from env.
- backend/.env.example - added JWT_EXPIRES_IN=7d placeholder (real secret stays in .env only).

### Decisions

---

## 2026-10-09 — Milestone 6: Super Admin Backend (Admins & Locations) - Completed 2026-10-09

Super-admin management of admins and locations. Every endpoint is guarded by
`JwtAuthGuard` + `RolesGuard` with `@Roles(Role.SUPER_ADMIN)` at class level.
Only the endpoints in `development-docs.md` §3 were built (no DELETE, no Milestone 7 work).

### FIRST CHECK — `POST /auth/login` is public (M5 "auth-guarded" label corrected)
- The M5 summary said `/auth/login` was "auth-guarded". That was wrong.
- Verified against the live :7676 server: a request with **no token** and a wrong
  password returned the login's own `401 Invalid email or password` (not the guard's
  `Missing authentication token`). A correct password with no token returned `201`
  with `access_token`, `token_type`, `expires_in`, `user`.
- `auth.controller.ts` has no guard on `login`/`logout`. The code was already
  correct; only the M5 changelog wording was wrong, and it is corrected in M5's entry.

### Added
- `backend/src/admins/create-admin.dto.ts` — `CreateAdminDto` (class-validator): email,
  username, password, first_name, last_name, phone_number, address (non-empty strings),
  location_id (integer ≥ 1). Snake_case keys match §1.2 / §3. Unknown keys (including
  audit columns and `is_active`) are rejected by the global ValidationPipe.
- `backend/src/admins/admins.service.ts` — `AdminsService`:
  - `findAll()` — explicit column `select` (no `password_hash`), mapped through `toResponse()`.
  - `create()` — 409 on duplicate email **or** username (both UNIQUE per §1.2); 400 if
    `location_id` does not exist or is not active; bcryptjs hash (10 rounds, same library
    as auth); `created_by_super_admin_id` taken from the JWT, never the body; DB
    unique-violation (23505) caught as a race backstop → 409.
  - `activate()` / `deactivate()` — set `is_active`; already-in-state is a harmless no-op
    (no write, no error); unknown id → 404.
- `backend/src/admins/admins.controller.ts` — `GET /super-admin/admins`,
  `POST /super-admin/admins`, `PATCH /super-admin/admins/:id/activate`,
  `PATCH /super-admin/admins/:id/deactivate`. `:id` via `ParseIntPipe` (non-integer → 400).
- `backend/src/admins/admins.module.ts` — imports `TypeOrmModule.forFeature([Admin, Location])`
  and `AuthModule` (guards). No self/cross-module loops.
- `backend/src/locations/create-location.dto.ts` — `CreateLocationDto`: `name` required.
- `backend/src/locations/update-location.dto.ts` — `UpdateLocationDto`: optional `name`
  (non-empty string) and optional `is_active` (boolean).
- `backend/src/locations/locations.service.ts` — `LocationsService`: `findAll`, `create`
  (is_active = true), `update` (name / is_active, only the fields present in the body);
  unknown id → 404. Explicit `LocationResponse` whitelist.
- `backend/src/locations/locations.controller.ts` — `GET`, `POST /super-admin/locations`,
  `PATCH /super-admin/locations/:id`.
- `backend/src/locations/locations.module.ts` — `TypeOrmModule.forFeature([Location])` + `AuthModule`.

### Fixed (during build, before commit)
- Draft staged earlier in this milestone returned the raw entity (exposing
  `password_hash`) from create/activate/deactivate; replaced with explicit whitelist responses.
- Draft added an undocumented `DELETE /super-admin/admins/:id`; removed (not in §3).
- Draft enforced location-name uniqueness, which §1.3 does not specify; removed.
- `update-location.dto.ts` held a duplicated `CreateLocationDto`; `locations.module.ts`
  imported itself; both fixed.
- `import type` required for `AuthenticatedUser`, `AdminResponse`, `LocationResponse`
  under `isolatedModules` + `emitDecoratorMetadata` (TS1272).
- `jwt-auth.guard.ts`: removed a stray blank line left by an earlier edit.

### Check before moving on (verified with real HTTP against the running :7676 backend, plus psql)
| # | Item | Result |
|---|---|---|
| 1 | POST /auth/login publicly reachable (no JWT guard) | PASSED — no token → login's own 401 for bad password, 201 for correct password |
| 2 | Create admin via API, visible in DB, bcrypt hash stored | PASSED — 201; DB `password_hash` is 60 chars, `$2b$10$…`, no plaintext match |
| 3 | Activate / deactivate toggles is_active; deactivated admin cannot log in, reactivated can | PASSED — DB is_active true→false→true; login 201→401→201 |
| 4 | Admin-role token rejected (403) on all super-admin endpoints | PASSED — 7 routes × 403 |
| 5 | No token rejected (401) on all super-admin endpoints | PASSED — 7 routes × 401 |
| 6 | Duplicate email → 409; duplicate username → 409 | PASSED |
| 7 | Nonexistent location_id → 400; inactive location_id → 400 | PASSED |
| 8 | Unknown id → 404 (admin activate/deactivate, location PATCH) | PASSED |
| 9 | Activate/deactivate already-in-state → 200 no-op | PASSED |
| 10 | No password / hash in any response | PASSED — list bodies and PATCH responses scanned, 0 hits |
| 11 | Audit column from authenticated user, not body | PASSED — `created_by_super_admin_id = 1` from JWT; body attempt with `created_by_super_admin_id` / `is_active` → 400 |
| 12 | Backend starts cleanly on 7676 | PASSED — "successfully started", "listening on port 7676", "Database connection established: true" |
| 13 | Build/type-check | PASSED — `nest build` exit 0; `tsc` clean for `src/` |

### Test data left in the database (deliberately kept; clearly named)
- Admin `m6test1791492882268` (id 7, `…@example.com`), created by this milestone's tests.
- Locations `TEST-M6-m6test1791492882268-R` (ids 10 and 11). Id 11 is a second copy
  created to prove duplicate location names are allowed.
- Earlier M5/M6 test rows (`admin6_test@example.com`, `Loc-1791491006`, `Test Location`,
  `Patch Me`, etc.) are still present from the earlier session, and the M6 draft's
  verification left them in place too. They are not part of this milestone's cleanup.

### Deviations from the docs
- None in endpoints or behaviour. Body and response keys are snake_case
  (`location_id`, `first_name`, `is_active`) to match §1.2/§3 and the M5 response shape.
- Duplicate location names are allowed because §1.3 does not make `name` unique.
  (The earlier draft enforced uniqueness; that was an invented rule and was removed.)
- Duplicate admin **username** also returns 409: §1.2 marks `username` UNIQUE.

### Pending errors or issues
- `npx tsc --noEmit` reports one error in `test/app.e2e-spec.ts`
  (`Cannot find module 'supertest/types'`). Pre-existing, unrelated to M6; not fixed here.
- `oxlint` warns about an unused `error` variable in M5's `auth.service.ts`. Pre-existing; not fixed here.
- pg prints its SSL-mode future-deprecation notice on boot (informational, as before).

## 2026-10-08 — Milestone 3: Core Schema (Auth & Org Structure) via TypeORM migrations

### Added
- **Four entities** (integer identity PKs, snake_case columns, exactly
  per `development-docs.md` §1.1–§1.4): `super_admins`, `locations`,
  `admins` (FKs → `locations.id` NOT NULL, → `super_admins.id` nullable),
  `master_data`. Under `backend/src/{super-admins,locations,admins,master-data}/*.entity.ts`.
- **Migration infrastructure**: `backend/src/data-source.ts` (TypeORM
  `DataSource`, `synchronize: false`, `DATABASE_URL_UNPOOLED`, explicit
  `ssl: { rejectUnauthorized: true }`) + npm scripts
  `migration:generate` / `migration:run` / `migration:revert`.
- **Migration** `backend/src/migrations/1791477876792-InitCoreSchema.ts`
  creating all four tables + both FKs (down() drops them).
- **Idempotent seed scripts**: `backend/src/scripts/seed-master-data.ts`
  (4 opaque `partner_type`/`reference_type` rows) and
  `backend/src/scripts/seed-super-admin.ts` (bcrypt-hashed password).
  npm scripts `seed:master-data`, `seed:super-admin`.
- **`.env.example`**: `SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD`
  placeholders (fake values only).

### Changed
- `backend/src/app.module.ts` — `ssl.rejectUnauthorized` `false → true`
  (approved hardening; still connects). `synchronize` stays `false`.
- The four `*.module.ts` files now register their entity via
  `TypeOrmModule.forFeature([...])`.

### Decisions (with reasons)
- **Schema via migrations, not `synchronize`.** `synchronize` stays
  `false`; tables come from a checked-in TypeORM migration so schema is
  version-controlled and reversible (`revert`/`run` verified). Reason:
  user-approved; migrations are the reliable path through Neon's direct
  (non-pooler) host.
- **Seeds are repeatable scripts**, not one-off inserts, using
  `WHERE NOT EXISTS` (master_data) / email existence check (super admin),
  so re-running never creates duplicates — verified by running each twice.
- **Opaque master_data codes** are generated non-human-readable tokens
  (`q7Kf2mZ9xRw4tB6y`, …). The docs specify the *kind* of codes
  (opaque) but not literal strings; assigned IDs 1–4 recorded in
  `completed-checklist.md`.
- **Super admin password** hashed with bcrypt (cost 10) before storage;
  plaintext only ever in gitignored `backend/.env`.

### Tables affected (Neon `neondb`)
Created: `super_admins`, `locations`, `admins`, `master_data`
(+ TypeORM `migrations`). Deliberately **not** created (Milestone 4):
`partners`, `inventory_items`, `configurations`, `status_change_requests`.

### Files
`backend/src/data-source.ts`, `backend/src/app.module.ts`,
`backend/package.json`, the 4 entity files + 4 module files,
`backend/src/migrations/1791477876792-InitCoreSchema.ts`,
`backend/src/scripts/seed-master-data.ts`,
`backend/src/scripts/seed-super-admin.ts`,
`backend/.env.example`, `docs/completed-checklist.md`.

---


---

## 2026-10-08 — Milestone 2: Connect NestJS to PostgreSQL (TypeORM + Neon)

### Added
- **TypeORM wiring in `AppModule`** (`backend/src/app.module.ts`):
  `TypeOrmModule.forRoot({ type: 'postgres',
  url: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: false }, autoLoadEntities: true,
  synchronize: false })`.
- **Startup DB status log** in `backend/src/main.ts`: fails fast with
  a clear error if `DATABASE_URL_UNPOOLED` is unset, then logs
  `Database connection established: <true|false>` after listen —
  never prints the URL.
- **Dependencies**: `@nestjs/typeorm`, `typeorm`, `pg` (installed
  with `--legacy-peer-deps`).
- `backend/.env.example`: added placeholder-only
  `DATABASE_URL_UNPOOLED` (fake Neon-style URL); pooled
  `DATABASE_URL` comment clarified as Neon-CLI-tooling's.

### Verification (milestone checks)
- **Test phase** (temporary): throwaway entity `M2ThrowawayEntity` →
  table `m2_connection_probe` with `synchronize: true` + query
  logging. Boot log recorded the executed statement against Neon:
  `CREATE TABLE "m2_connection_probe" ("id" SERIAL NOT NULL, "note"
  character varying(64) NOT NULL, CONSTRAINT "PK_…" PRIMARY KEY
  ("id"))`, and `psql` immediately confirmed the table existed
  (count=1). A table was created **from code**, not just configured.
- **Cleanup**: entity deleted (zero references left in `src/`),
  table dropped via psql (probe count=0; public schema has zero
  tables), and a fresh restart after the drop did **not** recreate it.
- **Final fresh boot**: "Found 0 errors" → "Nest application
  successfully started" → "F1 Help Desk backend listening on port
  7676" → "Database connection established: true"; `GET :7676/` →
  HTTP 200; frontend `:3000` still HTTP 200.
- `synchronize: false` is the only synchronize value present in
  `backend/src/` (grep verified).

### Decisions
- **ORM: TypeORM** (`@nestjs/typeorm` + `typeorm` + `pg`) — standard
  NestJS pairing and supports the integer identity PKs
  (SERIAL/IDENTITY) the schema doc requires. Recorded in the
  `development-docs.md` stack line (user-approved doc edit).
- **Connection uses `DATABASE_URL_UNPOOLED`** (Neon direct host), not
  the pooled `DATABASE_URL` — schema creation and migrations don't
  work reliably through the pooler. Read from the environment; never
  printed, never committed.
- **Explicit TLS**: `ssl: { rejectUnauthorized: false }` set on the
  TypeORM connection (Neon requires SSL) rather than relying only on
  `sslmode` in the URL.
- **`synchronize: false` in the final config** — schema is created
  via migrations from Milestone 3 onward; `synchronize: true` was
  enabled only briefly for the throwaway probe, then turned off
  immediately after (per user approval).
- **Backend process replaced**: the previous foreground `nest start`
  (started 2026-10-07 22:48) doesn't reload code changes, so it was
  stopped and replaced with a detached `npm run start:dev` (watch)
  instance on :7676. The foreign project's process on :3001 was not
  touched.

### Changed
- `backend/src/app.module.ts` (TypeORM root config),
  `backend/src/main.ts` (env guard + connection status log),
  `backend/.env.example`, `backend/package.json`,
  `backend/package-lock.json`, `docs/development-docs.md` (stack line
  + ORM, user-approved).

### Pending errors or observations
- Non-blocking `pg` startup warning: "SECURITY WARNING: The SSL
  modes 'prefer', 'require', and 'verify-ca' are treated as aliases
  for 'verify-full'…" — informational notice about a future pg v9
  behavior change; current connections work fine.
- Carried forward from Milestone 0/1: backend full-tree
  `npm install` may need `--legacy-peer-deps`; one M1 diagnostic
  printed the Neon URL password into the terminal transcript only
  (rotate via `neon credentials` if desired).

### Tables affected
- None remaining. Transient: `m2_connection_probe` was created and
  then dropped — full cleanup verified via psql.

---

## 2026-10-08 — Milestone 1 verification vs Neon, port standardization, approved doc updates

### Verified (Milestone 1 re-check against Neon, per user instructions)
- Connected with plain `psql` using `DATABASE_URL` from `backend/.env`
  (read internally by script — never printed, never committed):
  - first attempt succeeded (no suspend-retry needed): role
    `neondb_owner`, database `neondb`,
    `has_database_privilege(current_user, current_database(), 'CREATE') = t`;
  - created throwaway table `f1_helpdesk_m1_probe_tmp` (verified
    exists=1) and dropped it (verified exists=0) — full create/drop
    round-trip passed.
- Local PostgreSQL untouched: no connections attempted against it, no
  superuser use, no `pg_hba.conf`/auth changes, no objects created —
  per user instruction it is ignored entirely.
- Observation (no change made): `DATABASE_URL` currently points at
  Neon's **pooler** host (`-pooler`); the direct/unpooled URL is in
  `DATABASE_URL_UNPOOLED`.
- Services re-tested after stopping the stale process: backend
  `:7676` → HTTP 200 "Hello World!", frontend `:3000` → HTTP 200
  ("/" and "/admin").

### Decisions
- **Port: KEEP 7676** (user-approved decision). `backend/.env` and
  `frontend/.env` already agreed on 7676; `backend/.env.example`,
  `frontend/.env.example`, and the prior CHANGELOG/completed-checklist
  mentions (which said 3001 from Milestone 0) were updated so all
  artifacts now agree. History: the scaffold originally used 3001, the
  `.env` files were switched to 7676 on 2026-10-07, and 7676 is now the
  recorded standard. Side note: port 3001 is currently occupied by a
  different project's app (Ryo Academy), which was left untouched.
- **Stale process stopped**: terminated the leftover
  `npm run start:dev` + `nest start --watch` pair from the Milestone 0
  session (PIDs 216140/216151). Current backend (`:7676`) and frontend
  (`:3000`) left running as instructed.

### Changed (docs edits — approved by user; recorded as a deviation)
- Reason: the database is **hosted on Neon**, so the original
  local-Postgres instructions were obsolete and would mislead future
  contributors; user explicitly approved rewriting them.
- `docs/development-check-list.md` — Milestone 1 rewritten: local
  install step replaced with "Create a Neon project, database and role
  in the Neon console"; goal and remaining steps reworded for Neon;
  both "Check before moving on" items unchanged.
- `docs/development-docs.md` — stack line now reads "PostgreSQL
  (database, hosted on Neon)".
- `backend/.env.example` — still placeholder-only: `PORT=7676` and a
  **fake** Neon-style `DATABASE_URL` (no real host or credential).
- `frontend/.env.example` — `NEXT_PUBLIC_API_BASE_URL` updated to
  port 7676.

### Files affected
- Modified: `docs/development-check-list.md`, `docs/development-docs.md`,
  `docs/CHANGELOG.md`, `docs/completed-checklist.md`,
  `backend/.env.example`, `frontend/.env.example`.
- Unchanged (already correct, gitignored): `backend/.env`,
  `frontend/.env`.

### Tables affected
- None (throwaway probe table created and dropped; Neon database
  otherwise empty pending Milestone 3).

---

## 2026-10-08 — Milestone 1: PostgreSQL Setup (Neon hosted instance)

### Added
- **Neon CLI 8.0.12** installed globally (npm global prefix moved to
  `~/.npm-global` — see Decisions) and authenticated via OAuth
  (`neon login` → `~/.config/neon/credentials.json`, profile DEFAULT).
- **Neon project linked in `backend/`**: project `rapid-bread-25047918`
  ("F1 help desk"), org `org-morning-tree-41644189`, branch
  `production`. Context written to `backend/.neon` (IDs only, no
  secrets).
- **Agent tooling** (per user's prescribed setup steps):
  - `neon skills -y` → 8 Neon skills under `backend/.agents/skills/`
    (+ `backend/skills-lock.json`).
  - `neon mcp -y` → Neon MCP registered in 7 agent configs
    (cline, claude-code, codex, cursor, gemini-cli, github-copilot-cli,
    vscode). A scoped MCP API key was minted
    (`neon-cli-mcp-20261008T084849Z-e172`); it lives only in agent
    config files outside this repo.
- **`backend/neon.ts`** — bare policy: `defineConfig({})` from
  `@neon/config/v1` (replaced the generated starter template).
- **Dependencies**: `@neon/config@^1.8.4`, `@neon/env@^1.5.1`
  (installed by `neon config init`).
- **Connection strings in `backend/.env`** (gitignored, never
  committed): `DATABASE_URL` (pooled), `DATABASE_URL_UNPOOLED`, and
  `NEON_BRANCH=production` — pulled automatically by `neon link` /
  `neon deploy`.

### Changed
- Root `.gitignore`: added `*env` (appended by Neon tooling).
- `backend/.gitignore`: added `.neon` (appended by Neon tooling).

### Decisions
- **Hosted Neon instead of local PostgreSQL** — explicitly allowed by
  Milestone 1 step 1 ("provision a hosted instance … Neon"). The local
  Postgres server remains untouched; the app uses Neon.
- **Database name is `neondb`** (Neon's provisioned default) and role
  is **`neondb_owner`** — a dedicated owner role with a password, not a
  superuser, satisfying M1 step 3. The checklist's `f1_helpdesk_db` was
  an example ("e.g."), not a requirement.
- **npm global installs moved to `~/.npm-global`** — `/usr/local` is
  root-owned and sudo requires a password (EACCES on `npm i -g`).
  Persistent via `npm config set prefix`.
- Kept the tool-added `*env` ignore rule (superset of the existing
  `.env` rules; harmless for this repo).
- Backend port **7676** in `backend/.env` (changed from 3001 on
  2026-10-07 22:48; docs aligned to 7676 on 2026-10-08 — see the
  port-standardization entry above).

### Verified
- `psql` connects outside app code using the `.env` URL:
  `current_user=neondb_owner`, `current_database=neondb`,
  `PostgreSQL 18.6` on Neon; `\\dt` shows no tables yet (schema comes
  in Milestone 3).
- The real Neon endpoint appears in no tracked or committable file
  (`git grep` clean).

### Files affected
- Created: `backend/neon.ts`, `backend/.neon`, `backend/.agents/skills/**`,
  `backend/skills-lock.json`.
- Modified: `backend/package.json`, `backend/package-lock.json`,
  `.gitignore`, `backend/.gitignore`, `backend/.env` (gitignored).
- Not committed (secrets): `backend/.env`.

### Tables affected
- None. (Database provisioned empty; Milestone 3 creates tables.)

---

## 2026-10-07 — Milestone 0: Project Scaffolding

### Added
- **NestJS 12 backend scaffold** in `backend/` (ESM modules, TypeScript,
  Vitest, oxlint, Prettier) with per-module folder structure and empty
  module stubs registered in `AppModule`:
  `auth`, `admins`, `super-admins`, `partners`, `locations`,
  `master-data`, `inventory`, `configurations`, `status-requests`.
  - Key files: `backend/src/<module>/<module>.module.ts` (9 stub files),
    `backend/src/app.module.ts`, `backend/src/main.ts`.
- **Next.js 16 frontend scaffold** in `frontend/` (App Router,
  TypeScript, Tailwind CSS v4, ESLint) with route structure for the two
  role areas:
  - `frontend/src/app/super-admin/page.tsx` (placeholder shell)
  - `frontend/src/app/admin/page.tsx` (placeholder shell)
  - `frontend/src/app/page.tsx` — replaced create-next-app boilerplate
    with a simple "F1 Help Desk" default landing page linking to both
    role areas.
  - `frontend/src/app/layout.tsx` — metadata title/description set to
    "F1 Help Desk".
- **Environment files** (`.env` is gitignored; `.env.example` is
  committed):
  - `backend/.env` — `PORT=7676`, `DATABASE_URL` (placeholder
    credentials until Milestone 1), `JWT_SECRET` (dev value).
  - `backend/.env.example`
  - `frontend/.env` — `NEXT_PUBLIC_API_BASE_URL=http://localhost:7676`.
  - `frontend/.env.example`
- **Git ignore rules**: root `.gitignore`, `backend/.gitignore`, and an
  added `!.env.example` exception in `frontend/.gitignore` (its default
  `.env*` rule would otherwise have hidden `.env.example` too).
- `dotenv` dependency in the backend, loaded via `import 'dotenv/config'`
  at the top of `backend/src/main.ts` so `PORT`/future secrets are read
  from `.env`.

### Decisions
- **Ports**: backend on **7676**, frontend on **3000** — avoids the
  default-port collision between NestJS and Next.js during parallel dev.
- **Backend dependency install uses `npm install --legacy-peer-deps`**:
  npm 10.9.4 crashed with `TypeError: Cannot read properties of null
  (reading 'edgesOut')` inside arborist's `#loadPeerSet` while resolving
  the scaffold's vitest peer-dependency graph. `--legacy-peer-deps`
  bypasses the buggy strict peer resolution; install then completed
  cleanly (343 packages + dotenv). Re-use this flag for backend installs
  unless npm is upgraded.
- **Module stubs are wired into `AppModule` now** (rather than empty
  directories) so the app boots with the documented module layout and
  later milestones only add controllers/services/providers.
- Frontend scaffolded with `create-next-app` using App Router + src
  directory + Tailwind + TypeScript + ESLint (docs specify the stack but
  not styling; Tailwind matches the default modern Next.js setup and the
  later "presentable UI" milestones).

### Files affected
- Created: `.gitignore`, `backend/.gitignore`, `backend/.env`,
  `backend/.env.example`, `backend/src/{auth,admins,super-admins,partners,locations,master-data,inventory,configurations,status-requests}/*.module.ts`,
  `frontend/.env`, `frontend/.env.example`,
  `frontend/src/app/super-admin/page.tsx`, `frontend/src/app/admin/page.tsx`,
  `docs/CHANGELOG.md`, `docs/completed-checklist.md`.
- Modified: `backend/src/main.ts`, `backend/src/app.module.ts`,
  `backend/package.json` (+ `dotenv`), `frontend/src/app/page.tsx`,
  `frontend/src/app/layout.tsx`, `frontend/.gitignore`.

### Tables affected
- None. (No database work in this milestone.)
