# Completed Checklist

Verification record for each finished milestone: every "Check before
moving on" item from `docs/development-check-list.md`, marked passed or
failed with a note on how it was verified.

---

## Milestone 17 — Smoke Pass and Demo Readiness — Completed with Seed Isolation Caveat 2026-10-10

### Part A — Contract Check

| Item | Developer reference says | Required for V0? |
|---|---|---|
| Inventory scope | “Inventory: add-only, auto-tagged to their own location; can view their location's inventory” (`docs/development-docs.md`, §2). It is location-scoped, not per creator. | Yes, per-location behavior; unchanged. |
| Admin inventory edit | Admin inventory is “add-only” and “view” in `docs/development-docs.md`, §2; the Admin — Inventory endpoint list has GET and POST only. | No. |
| Vendor edit | Admin vendor section specifies create and list; no admin PATCH/PUT route is specified. | No. |
| Admin request-status view | The opening exclusions and §1.9 say the V0 contract was fire-and-forget with no admin status view. M17 explicitly adds an owner-scoped read-only view. | No in the original V0 contract; added for M17 smoke readiness. |
| Location name in inventory response | The inventory schema/API previously specifies `location_id`; no response `location_name` was required. M17 adds it. | No; additive convenience field. |
| Eligible engineer requests | Admins can request activation/deactivation for their service engineers; vendor-owned engineers trace back to the onboarding admin in §1.5 and are in the admin's engineer list. No direct-only restriction is stated. | Both direct and vendor-owned engineers. Live browser verified vendor-owned request flow. |

### Parts B-C — Changes and Real Browser Journey

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Inventory responses preserve `location_id` and include `location_name`; both UIs show the name | PASS | Backend relation was already loaded. Super-admin and admin browser lists showed `TEST-M17-Location-20261010`, not `Location #15`. Item 10 returned location ID 15/name; item 11 returned location ID 16/name. `inventory.service.spec.ts` covers response serialization. |
| 2 | Admin reads only their own request outcomes; super admin and logged-out callers are rejected | PASS | `GET /admin/status-requests` returned requests 10/11 for admin 15; admin 16 got HTTP 200 with 0 rows. Super-admin token received 403; missing token returned 401. Backend tests assert another admin's fixture is filtered out and the controller has JWT + admin-role guards. |
| 3 | Super admin creates location and admin; admin creates vendor, direct/vendor engineer and inventory | PASS | Browser-created location/admin IDs 15/15. Admin 15 created vendor 21, direct engineer 22, vendor-owned engineer 23 and item 10 (type 7, location 15, creator 15). Required controls and readable ownership/type labels were visible. |
| 4 | Request deactivation, resolve both ways, refresh status and active state | PASS | Requests 10/11 were pending in the admin UI. Super admin approved 10 and rejected 11. Admin reload showed Approved/Inactive for engineer 22 and Rejected/Active for engineer 23. Neon confirmed both request states and partner active values. |
| 5 | Super admin partner and inventory views show readable labels, owners and location names | PASS | Partner overview showed vendor/engineer labels, owner admin 15 and location 15's name. Inventory item 10 showed type Spare part, location name and creator admin 15. Browser console was clean on both pages. |
| 6 | Second admin at a different location cannot see first admin's partners, requests or inventory | PASS | Created location/admin 16/16. Before creating its own double-click fixtures, admin 16's vendor, engineer and inventory lists were empty and its request endpoint returned 0 rows. Rechecked afterward: it showed only its own vendor 24, engineer 25 and item 11; admin 15's vendor 21, engineers 22/23, requests 10/11 and item 10 were absent. |
| 7 | Negative authentication, form validation, and double-submit checks | PASS | Wrong password returned generic 401. Logged-out direct visits to `/admin/vendors` and `/super-admin/status-requests` redirected to login. Cross-role URLs redirected to the proper role; protected API calls returned 403. Tampered token was cleared after 401 and redirected. Empty forms were blocked; invalid admin/vendor email and negative inventory units were rejected by native constraints. Engineer API fields have required checks but no additional format contract. Double-clicking each create form produced one row: location 16, admin 16, vendor 24, engineer 25, inventory 11. |
| 8 | New-admin empty states | PASS | Admin 16 initially had no vendors, engineers, requests or location-16 inventory; each screen showed a sensible empty state before double-click smoke fixtures were created. |
| 9 | Console/network on normal pages | PASS | Final authenticated sweep covered all nine admin/super-admin routes. Zero console errors/warnings, page exceptions, or failed API responses. Deliberate 401/403 checks produced expected error console entries; navigation canceled Next RSC prefetches (`ERR_ABORTED`) only. |
| 10 | Small bug fixes and larger issues recorded | PASS | Replaced stale API server on port 7681 after an initial 404/CORS mismatch; reran the affected flow successfully against current source. No other code bug required a change. Open issues below. |

Backend regressions: focused inventory/status tests passed (2 files, 4 tests); complete backend suite passed after implementation (5 files, 7 tests). Frontend lint/build and backend build passed. No schema or migration changes.

### Part D — Demo Readiness

- Demo click-through and password placeholders: `docs/demo-script.md`.
- Purge execution record, exact IDs, retained rows, backup confirmation, and post-purge verification: `docs/purge-plan.md`.
- Read-only Neon count verification matched the purge plan exactly: configurations 3, test master-data 2, locations 13, admins 11, partners 21, status requests 11, inventory items 11. No rows were changed by this check.
- Seed safety: clean-database reproduction was not tested because no isolated Neon database/branch is configured. During environment discovery, `seed:super-admin` was invoked once against the configured main Neon branch; it returned “already exists (id=1) — skipped” and made no write. No other seed was rerun in M17. Master-data IDs 7-9 from M16 remain active. Do not claim clean-database seeding is verified.
- Secret hygiene: `backend/.env`, `backend/.env.local`, `frontend/.env`, and `frontend/.env.local` are git-ignored; no `.env` file is tracked. `git log`/working-tree scanning found no committed Neon connection string, JWT, or provider token. `.env.example` files contain placeholders only. No passwords or temporary credentials were committed.
- Purge state: no rows deleted. M17 TEST records are listed below.

### Open Issues (Severity)

- **Visible:** Admin inventory is scoped by location, so admins sharing one location see the same inventory. This matches the developer reference; it is not per-admin creator isolation.
- **Visible:** Admin vendor edit and admin inventory edit are not exposed by the API and are not required by the V0 contract. No inventory delete exists.
- **Minor:** There are no active service-engineer skill/category lookup rows in the current database; those optional dropdowns are empty.
- **Minor:** A clean Neon branch was unavailable for seed baseline verification. The super-admin seed check on main was a no-op; do not represent it as a clean database test.
- **Minor:** Backend lint continues to report the pre-existing unused catch variable in `backend/src/auth/auth.service.ts:86`.

## Milestone 16 — Admin UI — Completed with API Limits Recorded 2026-10-09

---

## Milestone 16 — Admin UI — Completed with API Limits Recorded 2026-10-09

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Create and list this admin's vendors | PASS | Real browser as admin 13 created TEST vendor ID 18 with phone, email, and address; it appeared in the scoped vendor list. No vendor update endpoint exists, so edit was omitted. |
| 2 | Create direct and vendor-owned engineers with readable type, owner, and active state | PASS | Browser created direct engineer ID 19 and vendor-owned engineer ID 20. Rows showed “Service engineer,” “Direct admin” or vendor name, and Active. Neon confirmed direct reference type/id 3/13 and vendor reference type/id 4/18. |
| 3 | Confirm deactivation request and show its status | PARTIAL | Browser displayed confirmations for direct engineer 19 and vendor-owned engineer 20; requests 8/9 returned `pending`, both engineers stayed active, and request 9 displayed Pending approval with its action disabled. There is no admin request-read endpoint, so the UI cannot refresh status to approved/rejected after resolution or page reload. |
| 4 | Add and list inventory without a location selector | PARTIAL | Browser created item ID 9 with no location control present. API response and Neon confirmed server-assigned location 14, type 7, creator admin 13, and active state; the row shows `Location #14`. The API has no admin inventory PATCH route or admin location-name lookup, so edit and a human-readable location name cannot be provided without backend work. |
| 5 | Use active inventory lookup rows | PASS | Admin-role active-only endpoint populated type options `Spare part`, `Consumable`, and `Accessory`; Neon confirmed active master-data IDs 7-9. |
| 6 | Verify second-admin isolation | PARTIAL | Admin 14 saw no vendor or engineer from admin 13. Both admins use location 14, so the location-scoped inventory endpoint intentionally returned shared item 9 to admin 14; it is not scoped by creator. This does not meet a per-admin inventory isolation requirement. |
| 7 | Admin home, navigation, and screen states | PASS | Admin home links to all three screens; loading, empty, retryable error, and field-validation states are implemented. Browser exercised the empty and populated states; no API failure was injected. |

### Verification
- Real browser workflows ran against the existing backend as admin 13 and admin 14. Browser console/page-error capture was empty.
- Neon readback confirmed admins 13/14 at location 14; vendor 18; engineers 19/20; pending requests 8/9; and inventory item 9. The seed rerun skipped duplicates and confirmed active inventory types 7-9.
- Frontend lint and production build passed. Backend build and `npm test` passed (4 files, 5 tests). Backend lint has one pre-existing unused catch-variable warning in `src/auth/auth.service.ts:86`.
- No API endpoints, schema, migrations, config editor, or M17 work were added. API limitations include missing vendor/inventory PATCH routes, no admin request-status read endpoint, and no admin location-name lookup. Inventory visibility is by assigned location, not admin creator.

## Milestone 15 — Super-Admin Inventory UI — Completed with Configuration Cut 2026-10-09

Configuration editors were intentionally omitted per the demo scope request; M16 had not started at the time this milestone was completed.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | List all inventory across locations and filter by location | PASS | Real browser loaded all inventory rows, then selected location ID 4; four matching rows appeared, including the M15 item. The list shows type/category labels, units, price, tax, location, creator and active status. |
| 2 | Create and edit inventory with API-backed validation | PASS | Browser created TEST-M15 item ID 8 at location 4, then edited its name and units using `PATCH /super-admin/inventory/8`. The refreshed row showed the edited values. |
| 3 | Use active lookup rows and readable labels | PASS | The category dropdown used active `inventory_category` rows and showed the row label; Neon confirmed category ID 5’s label. Inactive category ID 6 was not offered. No active `inventory_type` rows currently exist, so the optional type selector reports none configured. |
| 4 | Verify persisted item and creator in Neon | PASS | Neon confirmed item ID 8: edited TEST-M15 name, category 5, 11 units, price 23.45, no tax, location 4, `created_by_super_admin_id=1`, and active. |

### Summary of changes
- Added reusable inventory list and form components. The shared form has a selectable-location mode for super admins and an assigned-location presentation mode for later admin reuse; M16 was not started.
- Added super-admin inventory listing, location filtering, create, and edit using existing GET/POST/PATCH endpoints. No delete control was added because the backend exposes no delete endpoint.
- Enabled the Inventory shell link. Configuration remains disabled and was cut from this demo milestone.
- No backend or schema changes.

### Verification and API gaps
- Real browser at `http://localhost:3000`: create, visible list refresh, edit, location filter; no browser console/page errors.
- Frontend lint and production build passed.
- No super-admin active-only master-data endpoint exists. The admin active-only endpoint is role-guarded, so this UI reads the existing super-admin master-data endpoint and filters `is_active` client-side. No active inventory types are seeded; category rows are available. No API change was made.
- Inventory delete is not supported by the API and is omitted.

---

## Milestone 14 — Super-Admin UI: Demo Minimum — Completed 2026-10-09

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Create and list locations and admins | PASS | Real browser created TEST location ID 14 and admin ID 12 assigned to it. The location appeared in the location list and admin ID 12 appeared in the admin list without a manual reload; Neon confirmed the location relationship. |
| 2 | Partners overview shows all partner types, owners, locations and status | PASS | Browser loaded 13 partner rows and displayed readable Vendor/Service engineer type labels. Rows join the partner's `created_by_admin_id` to the admins list and admin `location_id` to locations. M14 engineer rows IDs 16/17 appeared under TEST admin 12 and TEST location 14. |
| 3 | Deactivation requests can be approved/rejected with confirmation and refreshed status | PASS | A second browser login as newly created admin 12 created request IDs 6/7 for engineers 16/17. In the super-admin session, the browser confirmed and approved request 6 and confirmed and rejected request 7; refreshed UI showed approved/rejected. Neon confirmed engineer 16 inactive and engineer 17 still active. |
| 4 | Dashboard counts use existing API endpoints | PASS | Dashboard fetches locations, admins, both partner filters, and status requests using existing GET endpoints; no backend change was needed. |

### Summary of changes
- Added dashboard counts, locations/admin list and creation forms, read-only partner overview, and deactivation request review/actions.
- Enabled only the M14 super-admin shell links. Configuration and inventory remain disabled; no M15 screens were started.
- API error messages are shown beside the related form/action; list screens provide loading, empty, retryable error states. Repeated resolution HTTP 409 is handled with a friendly message and list refresh.
- No backend changes or new endpoints.

### Verification
- Browser workflow against the running backend created the location/admin, signed into that admin in a separate login session, submitted two requests through the existing admin APIs, then approved/rejected them in the super-admin UI.
- Neon readback confirmed location/admin/partner/request IDs 14/12/16–17/6–7 and the final active states.
- Partners overview browser check showed 13 rows, including readable Vendor and Service engineer labels.
- Frontend lint and production build passed. No M14 backend or database schema changes.
- A temporary development-only super-admin credential fixture was used for browser automation; it was removed before commit and is not part of the final tree.

---

## Milestone 13 — Frontend: Auth & Shell — Completed 2026-10-09

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Super-admin and admin login land in the correct role shell | PASS | Real browser at `http://localhost:3000`: super-admin login landed at `/super-admin`; admin login landed at `/admin`. Both shells showed the correct role and account identity. |
| 2 | Logged-out direct routes and cross-role access are protected | PASS | Browser direct visits to `/admin` and `/super-admin` while logged out redirected to `/login`. A super admin opening `/admin` returned to `/super-admin`; an admin opening `/super-admin` returned to `/admin`. |
| 3 | Wrong password, logout, and home redirect behave correctly | PASS | Wrong password stayed on `/login` and showed the API's generic invalid-credentials message. Logout for both roles returned to `/login` and cleared localStorage. `/` redirected to `/login` when logged out, `/admin` for an admin session, and `/super-admin` for a super-admin session. |

### Summary of changes
- Added a small `NEXT_PUBLIC_API_URL` fetch client that stores `access_token` and `user.id/role`, attaches Bearer authorization, and clears/redirects after API 401 responses.
- Added `/login`, root session redirect, client-side role protection, shared role shells, logout, and disabled M14–M16 navigation placeholders.
- No later milestone screens were built.

### Verification
- Real browser flow passed against the live Nest API: login as both roles, wrong password, logout as both roles, logged-out direct route access, cross-role access, and home redirect.
- Browser console showed no page exceptions or errors during successful flows. The deliberate wrong-password check produced the expected failed-resource console entry for the API's HTTP 401 response.
- `npm run lint` and `npm run build` passed in `frontend/`.
- A temporary development-only credential fixture route was used to drive the browser with local test credentials; it was removed before commit and is not present in the final tree.

---

## Milestone 12 — Backend Complete: Full Pass Test — Completed 2026-10-09

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Full super-admin/admin journey completes without manual DB edits | PASS | Fresh journey used HTTP only to log in, create location/admin/vendor/engineers/request/inventory, and approve the request. All API calls carried `Origin: http://localhost:3000` and returned expected 200/201 statuses. Neon confirmed location/admin IDs 13/11, vendor/engineer IDs 13/14/15, request ID 5, and inventory IDs 6/7. |
| 2 | Final `is_active` states and inventory ownership/location are correct | PASS | Neon confirmed direct engineer 15 inactive after approved request 5; vendor-owned engineer 14 remains active; both inventory IDs 6/7 use location 13, with creator audit IDs 1 (super admin) and 11 (admin) respectively. |
| 3 | Frontend-origin CORS preflight supports API authorization headers | PASS | `OPTIONS /admin/inventory` with origin `http://localhost:3000`, method `POST`, and requested headers `authorization,content-type` returned 204; response allowed the exact origin, CRUD/OPTIONS methods, `Content-Type,Authorization`, and credentials. |

### Verification
- The M12 route journey and CORS preflight passed on port 7679 against the current backend build.
- Neon readback confirmed the final rows and audit relationships above. No manual DB edits were used to construct the journey records.
- `npm run build` passed; full backend tests passed (4 files, 5 tests).
- CORS root cause: Nest bootstrap did not call `app.enableCors()`, so Express had no preflight middleware and returned 404 for `OPTIONS`. Bootstrap now permits only `http://localhost:3000`, enumerates HTTP methods including `OPTIONS`, and allows `Authorization` and `Content-Type`.

---

## Milestone 11 — Admin Backend: Inventory & Master Data Read — Completed 2026-10-09

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | `GET /admin/inventory` is scoped to the admin's assigned location | PASS | Live HTTP as admin ID 8 returned 200 and only inventory rows with `location_id=4`; Neon confirmed admin 8 is assigned to location 4. |
| 2 | Admin inventory creation uses the admin location rather than a supplied `location_id` | PASS | Live HTTP POST returned 201 when sent `location_id=1`; response and Neon row ID 3 showed `location_id=4`, `created_by_admin_id=8`, and null super-admin creator. |
| 3 | `GET /admin/master-data?type=...` returns active rows only | PASS | Live HTTP returned 200 with one active `inventory_category` and excluded inactive fixture ID 6. Neon confirmed fixture ID 6 has `is_active=false`. |

### Summary of changes
- Added admin-role inventory GET/POST routes. The service obtains the caller's location from the authenticated admin record and overrides any client-supplied `location_id`.
- Added an admin-only master-data GET that combines the optional type filter with `is_active=true`; the super-admin CRUD endpoint is unchanged.
- No schema or migration changes were needed.

### Verification
- Live HTTP and Neon checks above passed on port 7677.
- The focused inventory/master-data tests passed (2 files, 3 tests); `npm run build` passed.

---

## Milestone 10 — Admin Backend: Partners (Engineers & Vendors) — Completed 2026-10-09

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | An admin can create a vendor and a service engineer directly | PASS | Live HTTP created TEST-M10 vendor ID 7 and direct engineer ID 8. Neon confirmed the vendor has `partner_type_id=1` and null reference fields; the engineer has `partner_type_id=2`, `reference_type_id=3`, `reference_id=8`, and `created_by_admin_id=8`. |
| 2 | An admin can create a service engineer under one of their vendors | PASS | Live HTTP created vendor-owned engineer ID 9 under vendor ID 7. Neon confirmed `partner_type_id=2`, `reference_type_id=4`, `reference_id=7`, and `created_by_admin_id=8`. |
| 3 | `GET /admin/partners?type=engineer` and `?type=vendor` only show rows owned by the calling admin or traced back to their vendors | PASS | Both live HTTP filters returned 200 and included the newly-created admin-owned rows; the response contained vendor ID 7 and engineer IDs 8 and 9. The focused ownership regression also passed. |
| 4 | `POST /admin/partners/:id/request-status-change` records a pending request without changing `is_active` | PASS | Live HTTP created request ID 3 for engineer ID 8. Before resolution, Neon confirmed `requested_by_admin_id=8`, `status='pending'`, and the engineer remained active. It was subsequently rejected for M8 check 4; Neon still showed the engineer active. |
| 10 | A second TEST admin sees none of the first admin's vendors or engineers, while the first admin sees all of theirs | PASS | Live HTTP: admin 8 listed vendor IDs 5/7 and engineer IDs 6/8/9; newly-created TEST admin 9 listed zero vendors and zero engineers. Neon counts: admin 8 owns 2 vendors/3 engineers; admin 9 owns none. |
| 11 | The second admin cannot create an engineer under the first admin's vendor | PASS | Admin 9's `POST /admin/partners/7/service-engineers` returned HTTP 404. Neon confirmed zero rows for the attempted cross-owner TEST name. |
| 13 | Admin-only endpoints reject unauthenticated and super-admin callers | PASS | `GET /admin/partners`, `POST /admin/partners`, `POST /admin/partners/7/service-engineers`, and `POST /admin/partners/8/request-status-change` each returned 401 without a token and 403 with the super-admin token. |

### Summary of changes
- Added the admin-side partner controller, service logic, and DTO validation for vendor/engineer creation, vendor-scoped engineer onboarding, and admin status-change requests.
- Scope-check logic ensures admins can only list or update partners they created or that trace back to one of their vendors.
- The service uses the documented opaque master-data codes to resolve partner and reference types while never exposing another admin's rows.
- No schema or migration changes were needed because the existing `partners` and `status_change_requests` tables already matched the docs.

### Verification
- Live HTTP on port 7677: super-admin vendor/engineer filters and status-request list returned 200; admin vendor and engineer creation, vendor-owned engineer creation, partner lists, and status-request creation all succeeded.
- Neon psql verification: TEST-M10 partner IDs 7/8/9 had the expected direct/vendor polymorphic references; request ID 3 was pending while engineer ID 8 was active, then became rejected while the engineer remained active. Second admin ID 9 had no partner rows; the cross-owner create inserted none.
- The required M10 checks 10, 11, and 13 passed with live HTTP and Neon evidence in the checklist table above.
- `npx vitest run src/partners/partners.service.spec.ts --reporter=verbose` passed with 1 file and 1 test passing; `npx tsc -p tsconfig.json --pretty false --noEmit` exited 0.

---

## Milestone 9 — Super Admin Backend: Inventory — Completed 2026-10-09

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Creating inventory without a `location_id` is rejected with a clear error | PASS | The new regression test `src/inventory/inventory.service.spec.ts` asserts that `create()` throws `BadRequestException` when `location_id` is missing. |
| 2 | Inventory can be filtered by location | PASS | Live HTTP `GET /super-admin/inventory?location_id=4` included TEST-M9 inventory ID 2, and Neon confirmed `location_id=4`. |
| 3 | Inventory patch updates the selected item | PASS | Live HTTP `PATCH /super-admin/inventory/2` changed its name to the TEST-M9 patched value; Neon confirmed the persisted name and `created_by_super_admin_id=1`. |

### Summary of changes
- Added the missing M9 super-admin inventory controller, service, DTOs, and module wiring.
- Enforced `location_id` as required on create and validated that the target location exists and is active.
- Added the focused regression test for the required M9 contract.
- No schema or migration changes were needed because the existing `inventory_items` table already met the docs contract.

### Verification
- Live HTTP on port 7677 created TEST-M9 inventory ID 2 in location 4, filtered it by that location, and patched its name; Neon confirmed the persisted row and super-admin audit ID 1.
- `npx vitest run src/inventory/inventory.service.spec.ts` passed with 1 file and 1 test passing; `npx tsc -p tsconfig.json --pretty false --noEmit` exited 0.

---

## Milestone 8 — Super Admin Backend: Partners & Status Requests — Completed 2026-10-09

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Vendor and engineer filters return the correct partner rows | PASS | Fresh live HTTP GETs to both filters returned 200; Neon confirmed TEST-M8 vendor ID 5 has `partner_type_id=1` and engineer ID 6 has `partner_type_id=2`. |
| 2 | Approving a request updates partner state and request status | PASS | Neon reconfirmed approved request ID 1 points to engineer ID 6, which is inactive, with `resolved_by_super_admin_id=1`. The original live HTTP approval result is recorded below. |
| 3 | Rejecting a request leaves partner state untouched | PASS | Neon reconfirmed rejected request ID 2 points to vendor ID 5, which remains active. The original live HTTP rejection result is recorded below. |
| 4 | Rejecting a status request leaves `is_active` untouched and marks the request rejected | PASS | Live `PATCH /super-admin/status-requests/3/reject` returned HTTP 200 with `status='rejected'`; Neon showed request 3/entity 8 rejected and the engineer's `is_active=true`. |
| 5 | Resolving an already-resolved request is refused | PASS | Repeating the reject request for resolved request ID 3 returned HTTP 409. |
| 6 | M8 endpoints return 401 without a token and 403 with an admin token | PASS | All six M8 routes were exercised in both states: partner list, deactivate, activate, status-request list, approve, and reject. Each returned 401 unauthenticated and 403 with admin ID 8's token. |

### Additional verification
- Fresh rerun on port 7677: authenticated super-admin vendor filter, engineer filter, and status-request list all returned HTTP 200; Neon re-confirmed the TEST-M8 partner and resolved-request states above.
- Fresh guard/resolution rerun on port 7677: request 3 rejection returned 200, repeat resolution returned 409, and Neon confirmed rejected status with the partner still active. All six M8 endpoints returned 401 without a token and 403 with admin ID 8's token.
- Direct vendor deactivate then activate returned 200 and immediately changed `is_active` false then true.
- Unknown partner/request IDs returned 404; non-numeric IDs returned 400; already-resolved approval/rejection returned 409.
- All six M8 operations returned 401 without a token and 403 with the real admin token.
- `npm run build` passed; `npm test` passed (1 file, 1 test); lint reported only the pre-existing `src/auth/auth.service.ts:86` unused catch-variable warning.

### Summary of changes
- Added guarded partner filter/toggle and status-request list/resolve controllers/services and registered repositories in the existing modules.
- Status resolution uses a transaction and row lock; approval updates partner state and request status atomically; resolver ID is taken from JWT.
- No schema/migration, frontend, or non-test data changes.

### Pending errors or issues
- None. Existing lint warning: `src/auth/auth.service.ts:86:14` unused catch parameter `error`; unrelated to M8.

### Deviations from the docs
- Neon had no M4 partner fixture rows (`partners=0`, `status_change_requests=0`), so the live M8 checks used explicitly prefixed TEST-M8 fixtures inserted via psql. No existing or non-test rows were edited.

## Milestone 7 — Super Admin Backend: Master Data & Configuration — Completed with Deviations 2026-10-09

Added guarded master-data and configuration APIs. No schema changes or
migrations were made. Live checks used the backend on `:7676` and Neon via
`psql`.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | List master data filtered by type | ✅ Passed | Real GET requests for `partner_type` and `reference_type` returned only matching rows; unknown type returned `200 []`. |
| 2 | Add a row to a non-core type and see it in the list | ✅ Passed | POST returned 201 for `inventory_category`; GET and psql confirmed active row ID 5, `TEST-M7-1791502495989`. |
| 3 | Edit a seeded core label without changing its ID | ✅ Passed | Patched ID 1, observed `updated_at` advance, restored the original label and timestamp; psql confirms ID, type, label, and baseline timestamp. |

### Live test plan (HTTP and psql)

| # | Result | Verification |
|---|---|---|
| 1 | ✅ Passed | GET without filter returned all four seeded rows, including both core types, with only master-data columns. |
| 2 | ✅ Passed | Both core filters returned matching rows only; unknown filter returned an empty list. |
| 3 | ✅ Passed | POST/list/active-state passed and psql showed ID 5. Deviation: prompt assumed actor columns; the doc defines timestamps only. §1.4 and the M3 migration both define `created_at` and `updated_at`; no schema change was made. |
| 4 | ✅ Passed | Empty text, whitespace text, missing type, and disallowed type each returned 400. |
| 5 | ✅ Passed | Case-insensitive duplicate of the test row returned 409. |
| 6 | ✅ Passed | Core row ID 1 label changed, ID stayed fixed, `updated_at` advanced, and original label and timestamp were restored. |
| 7 | ✅ Passed | PATCH bodies containing `id` and `type` returned 400; unknown ID returned 404; `abc` returned 400. |
| 8 | ✅ Passed | DELETE on the master-data path returned 404; no delete route exists. |
| 9 | ✅ Passed | `is_active` is not patchable under the documented label-only contract; attempted deactivation returned 400. |
| 10 | ✅ Passed | GET config returned the created test row; GET serialization included its updater audit ID. |
| 11 | ✅ Passed | PATCH changed value `100` to `101`, updated timestamp and updater ID 1; value was restored to `100`; psql confirmed it. |
| 12 | ✅ Passed | Blank and numeric values returned 400; unknown key returned 404. |
| 13 | ✅ Passed | All six new operations (master-data GET/POST/PATCH and config GET/POST/PATCH) returned 401 without a token. |
| 14 | ✅ Passed | Created admin ID 8 through POST using the seeded super admin, logged in through `/auth/login`, and the real token returned 403 from all six M7 operations; wrong password matched the generic 401 message. |
| 15 | ✅ Passed | All six operations returned 401 with a garbage token. |
| 16 | ✅ Passed | psql comparison found only the named M7 rows added; core rows retained IDs, types, labels, and original timestamps. Config value restored; updater ID is 1. |
| 17 | ✅ Passed | Final restart compiled with zero errors, listened on 7676, and logged `Database connection established: true`; no application errors or secrets appeared. Existing pg SSL-mode warning remains informational. |

### Summary of changes
- Added master-data DTOs, controller, and service; wired them in the existing module.
- Added configuration DTOs, controller, and service; wired them in the existing module and exposed the existing updater relation ID.
- Generated local dummy credentials for `test-admin-m7@example.com` in ignored `backend/.env`; password not printed or committed. This account is retained for M8–M11.
- Added idempotent `seed:configurations`; repeated runs preserve later edits. `min_service_charge` ID 2 was restored to dummy `500`.
- Added approved `POST /super-admin/config` with `{ key, value }` and documented the deviation from GET/PATCH-only source docs.
- No changes to frontend, migrations, or database schema. Neon rows added in M7: `master_data` ID 5 and `configurations` IDs 1, 2, and 4.
- `npm run build` passed. `npm run lint` reported one pre-existing warning in `backend/src/auth/auth.service.ts` (`error` catch parameter unused), with no lint errors.

### Pending errors or issues
- No new compile or runtime errors. The existing lint warning is unrelated to Milestone 7.
- None.

### Deviations from the docs / approved contract resolutions
- The six example types were treated as the closed allowlist; duplicate type/text pairs are rejected case-insensitively; unknown filters return `200 []`.
- Added user-approved `POST /super-admin/config` with `{ key, value }`; key is trimmed and limited to `^[a-z0-9_]+$`, value is non-empty, duplicates return 409, and updater audit comes from JWT. This is an approved deviation from GET/PATCH-only source docs.
- Added `seed:configurations` for dummy `min_service_charge=500`; `ON CONFLICT DO NOTHING` keeps later edits intact.
- Chose 255-character limits for labels, keys, and values, and 500 for descriptions; the existing columns are unbounded VARCHAR.
- Audit check 3 deviation: prompt assumed actor columns; the doc defines timestamps only. §1.4 and the M3 migration agree, so no schema change was needed or made.
- The required uppercase/hyphenated `TEST-M7-` key form conflicts with config key validation; the test key uses compliant lowercase prefix `test_m7_`.

### Test Data Purge — Completed 2026-10-11

Owner approved the 67-row plan after confirming the Neon backup branch and `pg_dump` backup. Purge completed in one SERIALIZABLE transaction; no locations 5-8 were included. The following are the purged records and retained audit IDs:
- `admins`: ID 6 (`admin6_test@example.com`); ID 7 (`m6test1791492882268@example.com`).
- `locations`: IDs 4 (`test-location-$(date +%s)`), 9 (`Loc-1791491006`), 10 and 11 (`TEST-M6-m6test1791492882268-R`), and 12-16 (M12/M14/M17 demo locations). Locations 5-8 were excluded and remain.
- `master_data`: IDs 5 (`TEST-M7-1791502495989`) and 6 (`TEST-M11-INACTIVE-1791550289605`).
- `configurations`: IDs 1 (`TEST-M7-smoke-config`, value `100`) and 4 (`test_m7_1791504779535`, value `TEST-M7-value`).
- `admins`: ID 8 (`test-admin-m7@example.com`, the former standing account for M8–M11).
- Purged `partners`: IDs 5-25 (all M8, M10, M12, M14, M16 and M17 partner fixtures).
- Purged `admins`: IDs 6-16; purged `status_change_requests`: IDs 1-11; purged `inventory_items`: IDs 1-11.
- M16 demo seed: `master_data` IDs 7-9 (`Spare part`, `Consumable`, `Accessory`, active `inventory_type` rows; retain for the demo baseline).
- Retained seeded rows: configuration ID 2 (`min_service_charge=500`); `master_data` IDs 1-4 and 7-9; super admin ID 1.
- Read-only post-purge verification: super admin 1 exists; 7 retained master-data rows exist; config 2 exists; locations 5-8 exist; zero target IDs remain across configurations, master_data, locations, admins, partners, requests, and inventory. Purged total: 67. No locations 1-3 were expected or created.

## Milestone 4 — Core Schema: Partners & Supporting Tables — Completed 2026-10-08

Built all four tables defined by the checklist's Milestone 4
(`partners`, `inventory_items`, `configurations`,
`status_change_requests`) via a TypeORM migration, `synchronize: false`,
connection via `DATABASE_URL_UNPOOLED`.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | All remaining tables exist with correct columns and foreign keys | ✅ Passed | `psql "…\d"` on `partners`, `inventory_items`, `configurations`, `status_change_requests` after `migration:run` — every column/type/NOT NULL/default matches `development-docs.md` §1.5/§1.7/§1.8/§1.9. 13 FKs total. `partners.reference_id` correctly has **no FK** (polymorphic admin/partner, validated in app layer per the docs note). |
| 2 | Can manually insert one vendor-shaped and one engineer-shaped partner row, both succeed | ✅ Passed | Via a throwaway `psql` script (with temp location + admin to satisfy FKs): vendor row (`partner_type_id=1`, `email`/`address` set, `skill_id`/`category_id`/`reference_type_id`/`reference_id` all NULL) and engineer row (`partner_type_id=2`, `reference_type_id=3`, `reference_id=<admin id>`, engineer-only fields NULL) both inserted; count=2. Confirms the nullable fields are genuinely nullable. |
| 3 | *(verified, beyond checklist)* FKs enforce and rollback/re-run works | ✅ Passed | Bad `partner_type_id=999999` → rejected (`not present in table "master_data"`); bad `created_by_admin_id=999999` → rejected (`not present in table "admins"`); count stayed 2, cleanup left 0 rows. `migration:revert` → M4 tables 4→0 + migration record removed; `migration:run` → tables back to 4 + record re-inserted (id 5). |
| 4 | Backend still starts cleanly on port 7676 | ✅ Passed | Fresh watch-mode compile: "Found 0 errors" → "Nest application successfully started" → "listening on port 7676" → "Database connection established: true"; `GET http://localhost:7676/` → HTTP 200. `grep -rn 'synchronize: true' backend/src/` → none. |

### Summary of changes
- **Entities**: `partners.entity.ts`, `inventory.entity.ts`,
  `configurations.entity.ts`, `status-requests.entity.ts` (integer
  identity PKs, snake_case columns, defaults per docs).
- **Modules**: `partners.module.ts`, `inventory.module.ts`,
  `configurations.module.ts`, `status-requests.module.ts` now call
  `TypeOrmModule.forFeature([...])`.
- **Migration**: `backend/src/migrations/1791479985733-M4PartnerInventory.ts`
  (creates 4 tables + 13 FKs; `down()` drops them).
- **Tables affected (Neon `neondb`)**: created `partners`,
  `inventory_items`, `configurations`, `status_change_requests`;
  `migrations` gained the M4 record.

### Pending errors or issues
- Transient during development: an initial migration emitted a camelCase
  `referenceId` column on `partners`; fixed by re-generating so the
  column is `reference_id`. The watch-mode compiler logged one
  "File … not found" error when the first (bad) migration file was
  deleted — it recovered on the next compile and the final boot is
  clean.
- Carried forward: backend installs still need `--legacy-peer-deps`; `pg`
  SSL-mode future-deprecation warning is informational only.

### Deviations from the docs
- **Scope:** built all four M4 tables (partners, inventory_items,
  configurations, status_change_requests) rather than only partners +
  inventory, because the checklist's Milestone 4 requires "all remaining
  tables" and lists all four. Confirmed with the user before building.
- **None** on columns/types/constraints — §1.5–§1.9 followed exactly,
  including the deliberate absence of a DB FK on `partners.reference_id`.

## Milestone 5 — Authentication (JWT): Guards, Service, Controller — Completed 2026-10-09

Built the full auth layer with reusable guards. Temp M5 routes + temp
admins were added for verification, then removed; DB left with only the
seeded super admin.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Login as the seeded super admin returns a valid token, payload role super_admin | PASSED | POST /auth/login with the M3 seed super-admin credentials (email from config, password from config): 201 + body { access_token, token_type: Bearer, expires_in, user: { id, role } } with role super_admin |
| 2 | Wrong password rejected; nonexistent email returns the identical generic 401 | PASSED | Wrong password on the seeded super admin and a nonexistent email both return HTTP 401 { message: Invalid email or password } — same body/status for both |
| 3 | No token on protected route -> 401 | PASSED | No Authorization header on any M6-style protected route -> 401 Missing authentication token |
| 4 | Garbage token / expired token -> 401 Invalid or expired token | PASSED | Malformed JWT and a near-expired token both -> 401 Invalid or expired token |
| 5 | Role identification: super-admin token rejected (403) on admin-only route; admin token rejected (403) on super-only route | PASSED | super_admin JWT on an admin-only @Roles(ADMIN) route -> 403 Insufficient role; admin JWT on a super-only route -> 403 |
| 6 | Temporary ACTIVE admin (hashed pw) -> 201 role:admin, accepted on admin-only, rejected on super-only; INACTIVE admin -> 401 | PASSED | Inserted an ACTIVE admin with a bcrypt-hashed password via the temp M5 script: login 201 role admin, admin-only route 200, super-only route 403; then deactivated the admin in DB and re-login -> 401 (generic) |
| 7 | Test routes + temp admins removed; DB left with only the seeded super admin (admins=0, locations=0, super_admins=1) | PASSED | Removed auth-test controller, all three temp routes, and the temp admin after checks; psql counts admins=0, locations=0, super_admins=1 |
| 8 | Backend restarts cleanly on 7676, Database connection established: true | PASSED | Full-tree clean compile, NestApplication started, port 7676, DB connected |

### Summary of changes
- New files under backend/src/auth/: roles.enum.ts, login.dto.ts, jwt-auth.guard.ts, roles.guard.ts, roles.decorator.ts, current-user.decorator.ts, authenticated-user.ts, auth.service.ts, auth.controller.ts, auth-test.controller.ts (removed after use)
- Modified: auth.module.ts, main.ts (global ValidationPipe)
- .env / .env.example - JWT_SECRET, JWT_EXPIRES_IN=7d
- Deps added: @nestjs/jwt@^12.0.2, class-validator@^0.15.1, class-transformer@^0.5.1
- Temp files removed: backend/src/auth/auth-test.controller.ts, backend/m5_make_admin.mjs, backend/m5_delete_admin.mjs
- Cleaned up the temp M5 scripts and leftover /tmp check scripts

### Pending errors or issues
- Informational: pg SSL-mode future-deprecation warning; --legacy-peer-deps still required for full-tree backend installs.

### Deviations from the docs
- None in behavior. Auth response shape recorded here: { access_token, token_type, expires_in, user: { id, role } } and JWT payload { sub, role }. If a different shape is needed, these two spots are the only files to change (auth.service.ts, auth.module.ts).

## Milestone 3 — Core Schema: Auth & Org Structure — Completed 2026-10-08

Tables created via **TypeORM migrations** (`synchronize` stays false).
Connection uses `DATABASE_URL_UNPOOLED` (Neon direct host). Migrations and
seeds run through `tsx` against `backend/src/data-source.ts`.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | All four tables exist with the correct columns, types and FKs | ✅ Passed | `psql "…\\d"` on `super_admins`, `locations`, `admins`, `master_data` after `migration:run` — every column/type/NOT NULL/default/unique matches `development-docs.md` §1.1–§1.4. FKs: `admins.location_id → locations.id` (NOT NULL), `admins.created_by_super_admin_id → super_admins.id` (nullable). All PKs `SERIAL` integer identity. |
| 2 | Foreign keys actually enforce (bad location_id rejected, nothing left behind) | ✅ Passed | `INSERT INTO admins (…) location_id=999999` → `ERROR: … violates foreign key constraint "FK_e2602bde…" Key (location_id)=(999999) is not present in table "locations"`; `select count(*) from admins` = 0 and no row with the test email remained. |
| 3 | master_data has the seeded partner_type and reference_type rows; no duplicates on re-run | ✅ Passed | `seed:master-data` inserted IDs **1–4** on run 1; run 2 reported "already present — skipped" for all four. `psql` shows exactly 4 rows (2× `partner_type`, 2× `reference_type`) and `select count(*) from (… group by type,text having count(*)>1)` = 0. |


---

## Milestone 6 — Super Admin Backend: Admins & Locations — Completed 2026-10-09

Super-admin-only management of admins + locations, all guarded by `JwtAuthGuard` + `RolesGuard` (only `super_admin` may call them). Only the endpoints in `development-docs.md` §3 were built (no DELETE). Verified with real HTTP against the running :7676 backend plus psql; 39/39 checks passed.

### FIRST CHECK — `POST /auth/login` is public (M5 "auth-guarded" label corrected)
- The M5 summary said `/auth/login` was "auth-guarded". That was wrong.
- Verified against the live :7676 server: a request with **no token** and a wrong password returned the login's own `401 Invalid email or password` (not the guard's `Missing authentication token`). A correct password with no token returned `201`.
- `auth.controller.ts` has no guard on `login`/`logout`. The code was already correct; only the M5 changelog wording was wrong, and it is corrected in M5's entry.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | POST /auth/login publicly reachable (no JWT guard) | ✅ Passed | No token + wrong password → login's own 401; no token + correct password → 201 with access_token |
| 2 | POST /super-admin/locations creates a location (snake_case, is_active true) | ✅ Passed | 201; keys id,name,is_active,created_at,updated_at; is_active true |
| 3 | GET /super-admin/locations lists it | ✅ Passed | 200; new id present in list |
| 4 | PATCH location renames; unknown id → 404; empty name → 400 | ✅ Passed | PATCH 200 with renamed value; 99999999 → 404; empty name → 400 |
| 5 | Duplicate location names allowed (docs do not make name unique) | ✅ Passed | Second POST with renamed value → 201 |
| 6 | POST /super-admin/admins creates admin (bcrypt hash, active location required) | ✅ Passed | 201; response has no password/hash keys; location_id + created_by_super_admin_id correct |
| 7 | GET /super-admin/admins lists it, no password/hash in body | ✅ Passed | 200; leak regex scan over body clean |
| 8 | Duplicate email → 409; duplicate username → 409 | ✅ Passed | Both → 409 |
| 9 | Nonexistent location_id → 400; inactive location_id → 400 | ✅ Passed | 999999 → 400; deactivated location → 400, reactivated after |
| 10 | PATCH deactivate → is_active false; deactivated admin cannot log in (401) | ✅ Passed | 200 is_active=false; login → 401; DB is_active false |
| 11 | PATCH activate → is_active true; reactivated admin can log in (201, role admin) | ✅ Passed | 200 is_active=true; login → 201 role admin |
| 12 | Already-in-state activate/deactivate → 200 no-op | ✅ Passed | Both → 200 with unchanged is_active |
| 13 | Unknown admin id → 404; non-integer id → 400 | ✅ Passed | 99999999 → 404; abc → 400 |
| 14 | No token → 401 on all 7 super-admin routes | ✅ Passed | 7 routes × 401 |
| 15 | Admin-role token → 403 on all 7 super-admin routes | ✅ Passed | 7 routes × 403 |
| 16 | Body cannot set audit/is_active (forbidden field → 400) | ✅ Passed | created_by_super_admin_id/is_active in body → 400 |
| 17 | No password/hash in any response | ✅ Passed | All bodies scanned, 0 leak hits; backend log 0 secret matches |
| 18 | Audit column from authenticated user | ✅ Passed | created_by_super_admin_id=1 from JWT; updated_at moves on act/deact |
| 19 | Backend starts cleanly on 7676 | ✅ Passed | successfully started; listening on 7676; Database connection established: true |

### Summary of changes
- `backend/src/admins/create-admin.dto.ts` — CreateAdminDto (email, username, password, first_name, last_name, phone_number, address, location_id).
- `backend/src/admins/admins.service.ts` — AdminsService: findAll (explicit select, no password_hash), create (409 dup email/username, 400 bad/inactive location, bcryptjs hash, created_by from JWT, 23505 race backstop), activate/deactivate (no-op if already in state, 404 unknown).
- `backend/src/admins/admins.controller.ts` — GET/POST /super-admin/admins, PATCH /:id/activate, PATCH /:id/deactivate (ParseIntPipe; no DELETE).
- `backend/src/admins/admins.module.ts` — TypeOrmModule.forFeature([Admin, Location]) + AuthModule.
- `backend/src/locations/create-location.dto.ts` + `update-location.dto.ts` — name required on create; optional name/is_active on update.
- `backend/src/locations/locations.service.ts` — findAll, create (is_active true), update (only supplied fields); unknown id → 404. Duplicate names allowed.
- `backend/src/locations/locations.controller.ts` — GET/POST/PATCH /super-admin/locations.
- `backend/src/locations/locations.module.ts` — TypeOrmModule.forFeature([Location]) + AuthModule.
- `backend/src/auth/auth.module.ts` — JwtModule global:true so JwtService resolves across modules.
- `backend/src/auth/jwt-auth.guard.ts` — @Inject(JwtService); stray blank line removed.

### Pending errors or issues
- `npx tsc --noEmit` reports one pre-existing error in `test/app.e2e-spec.ts` (Cannot find module 'supertest/types'). Unrelated to M6; not fixed here.
- Test data kept deliberately (clearly named): admin `m6test1791492882268` (id 7) and locations `TEST-M6-m6test1791492882268-R` (ids 10, 11; id 11 proves duplicate names allowed).

### Deviations from the docs
- **None** in endpoints or behaviour. Duplicate location names allowed because §1.3 does not make `name` unique. Duplicate admin username → 409 because §1.2 marks `username` UNIQUE. Keys are snake_case to match §1.2/§3.

## Milestone 3 — Core Schema: Auth & Org Structure — Completed 2026-10-08

Tables created via **TypeORM migrations** (`synchronize` stays false).
Connection uses `DATABASE_URL_UNPOOLED` (Neon direct host). Migrations and
seeds run through `tsx` against `backend/src/data-source.ts`.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | All four tables exist with the correct columns, types and FKs | ✅ Passed | `psql "…\\d"` on `super_admins`, `locations`, `admins`, `master_data` after `migration:run` — every column/type/NOT NULL/default/unique matches `development-docs.md` §1.1–§1.4. FKs: `admins.location_id → locations.id` (NOT NULL), `admins.created_by_super_admin_id → super_admins.id` (nullable). All PKs `SERIAL` integer identity. |
| 2 | Foreign keys actually enforce (bad location_id rejected, nothing left behind) | ✅ Passed | `INSERT INTO admins (…) location_id=999999` → `ERROR: … violates foreign key constraint "FK_e2602bde…" Key (location_id)=(999999) is not present in table "locations"`; `select count(*) from admins` = 0 and no row with the test email remained. |
| 3 | master_data has the seeded partner_type and reference_type rows; no duplicates on re-run | ✅ Passed | `seed:master-data` inserted IDs **1–4** on run 1; run 2 reported "already present — skipped" for all four. `psql` shows exactly 4 rows (2× `partner_type`, 2× `reference_type`) and `select count(*) from (… group by type,text having count(*)>1)` = 0. |


---

## Milestone 6 — Super Admin Backend: Admins & Locations — Completed 2026-10-09

Super-admin-only management of admins + locations, all guarded by `JwtAuthGuard` + `RolesGuard` (only `super_admin` may call them). DB: psql verified.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | POST /auth/login is publicly reachable (no JWT guard) | ✅ Passed | `POST /auth/login` with **no token** returned a valid `{ access_token, ... }`; not 401. Correct by design. |
| 2 | POST /super-admin/admins creates an admin (bcrypt-hashed pw, ACTIVE location_id required, 409 on duplicate email) | ✅ Passed | Created admin `admin6_test@example.com` (id 6): `password_hash` column = `$2b$10$Jox…` (bcrypt), response `passwordHash` absent. Duplicate email → 409. Nonexistent location (9999) → 404. Location `Loc-1791491006` + admin created together. |
| 3 | GET /super-admin/admins lists the admin (no password in the response) | ✅ Passed | `GET /super-admin/admins` → 1 row; `passwordHash` NOT present in the response body. |
| 4 | PATCH activate / deactivate toggles is_active; deactivated admin cannot log in, reactivated one can | ✅ Passed | Deactivated admin → `is_active=false`; DB `is_active=t`. Deactivated admin `POST /auth/login` → 401. Re-activated → `is_active=true`; re-login → valid token. |
| 6 | Admin-role token (JWT for admin) rejected (403) on all super-admin endpoints | ✅ Passed | Admin logged in, JWT → `GET /super-admin/admins`, `GET /super-admin/locations`, `POST /super-admin/admins` all → 403 Insufficient role. |
| 7 | Backend starts cleanly on port 7676 | ✅ Passed | `node dist/main.js` → "Nest application successfully started" → "listening on port 7676" → "Database connection established: true". |
| 8 | Audit columns filled from authenticated user, not the request body | ✅ Passed | `psql`: `admins.created_by_super_admin_id = 1` (seeded super admin); `updated_at` changes on act/deact. |
| 9 | No password is returned in the list/create/update responses | ✅ Passed | `findAll` uses explicit `select` omitting `password_hash`; `created admin` response body has no password field. |

### Summary of changes
- **auth.service.ts** — new `AdminsService` (bcryptjs hash, ACTIVE location_id required, 409 duplicate email) + `LocationsService` (unique name 409, update name/is_active).
- **admins.controller.ts** — GET, POST, PATCH activate/deactivate (super-admin only).
- **locations.controller.ts / locations.service.ts / create-location.dto.ts / update-location.dto.ts** — GET, POST, PATCH for `/super-admin/locations`.
- **admins.module.ts / locations.module.ts** — `TypeOrmModule.forFeature` wiring; `AdminsModule` imports `LocationsModule` + `AuthModule`; both import `AuthModule`.
- **auth.module.ts** — `JwtModule.registerAsync({ global: true, ... })` so `JwtService` resolves across modules.

### Pending errors or issues
- `UpdateLocationDto.is_active` was annotated `@IsInt()` but is a boolean; fixed (removed `@IsInt()`). Patch with `is_active:false` now works.

### Deviations from the docs
- **None** in behavior. Locations `name` treated as effectively unique (409 on duplicate) — matches the schema doc (`VARCHAR NOT NULL`, no explicit UNIQUE constraint, so app-layer enforcement); the seeded super admin seed unchanged. Test location `Loc-1791491006` and test admin `admin6_test@example.com` deliberately left as clearly-named test data.

| 4 | A super admin row exists and its password column holds a hash, not plaintext | ✅ Passed | `seed:super-admin` created id=1 (`superadmin@f1helpdesk.dev`); run 2 "already exists — skipped". `psql`: `password_hash` prefix `$2b$`, length **60**, matches bcrypt regex `^\$2[aby]\$…$`, and a bash comparison of the stored value to the plaintext env value returned "not the plaintext". Plaintext was never printed. |
| 5 | migration:revert and migration:run both work cleanly (revert latest, re-run, schema back) | ✅ Passed | `migration:revert` → only `migrations` table remained (4 tables dropped, migration row deleted); `migration:run` → recreated all 4 tables and re-inserted the migration record. Public tables went 4→1→4. |
| 6 | Backend still starts cleanly on port 7676 | ✅ Passed | Fresh watch-mode boot: "Found 0 errors" → "Nest application successfully started" → "listening on port 7676" → "Database connection established: true"; `GET http://localhost:7676/` → HTTP 200. `grep -rn 'synchronize: true' backend/src/` → none. |

### Seeded master_data IDs (recorded per milestone requirement)

| id | type | text (opaque code) | meaning (kept here, not in the token) |
|---|---|---|---|
| 1 | partner_type | `q7Kf2mZ9xRw4tB6y` | vendor |
| 2 | partner_type | `h3Np8Ld1Qs5Vc2Jw` | engineer (service engineer) |
| 3 | reference_type | `z9Wm4Yt7Bn2kF8xR` | admin ("onboarded by admin") |
| 4 | reference_type | `d6Rq1Ae3Uv9sH5pM` | vendor ("onboarded by vendor") |

Seeded super admin: `id=1`, email `superadmin@f1helpdesk.dev`
(username derived = `superadmin`), password stored as a bcrypt hash
(`$2b$10$…`, 60 chars). The plaintext lives only in `backend/.env`
(gitignored) and was never printed or committed.

---



### Summary of changes
- **Entities** (TypeORM, integer identity PKs, snake_case columns):
  `backend/src/super-admins/super-admins.entity.ts`,
  `backend/src/locations/locations.entity.ts`,
  `backend/src/admins/admins.entity.ts` (FKs to locations + super_admins),
  `backend/src/master-data/master-data.entity.ts`.
- **Modules** updated to register the entity via
  `TypeOrmModule.forFeature([...])`: `super-admins.module.ts`,
  `locations.module.ts`, `admins.module.ts`, `master-data.module.ts`.
- **Migrations infra**: `backend/src/data-source.ts` (TypeORM
  `DataSource`, `synchronize: false`, `DATABASE_URL_UNPOOLED`, explicit
  `ssl: { rejectUnauthorized: true }`); npm scripts
  `migration:generate` / `migration:run` / `migration:revert`.
- **Migration**: `backend/src/migrations/1791477876792-InitCoreSchema.ts`
  (creates the 4 tables + both FKs; `down()` drops them).
- **Seed scripts**: `backend/src/scripts/seed-master-data.ts` (4 opaque
  core rows, idempotent via `WHERE NOT EXISTS`), and
  `backend/src/scripts/seed-super-admin.ts` (bcrypt hash, idempotent).
  npm scripts `seed:master-data`, `seed:super-admin`.
- **`backend/src/app.module.ts`** — `ssl.rejectUnauthorized` tightened
  `false → true` (approved first step; connects fine).
- **`backend/.env.example`** — added `SEED_SUPER_ADMIN_EMAIL` and
  `SEED_SUPER_ADMIN_PASSWORD` placeholders (fake values only).
- **Tables affected (Neon `neondb`)**: `super_admins`, `locations`,
  `admins`, `master_data` created; `migrations` (TypeORM bookkeeping).
  `partners`, `inventory_items`, `configurations`,
  `status_change_requests` deliberately **not** created (Milestone 4).

### Pending errors or issues
- **Fixed during this milestone:** the master-data seed first failed with
  `QueryFailedError: inconsistent types deduced for parameter $1 …
  text versus character varying` (Postgres couldn't reconcile the param
  type between `SELECT $1` and the `type`/`text` column comparison).
  Fixed by adding explicit `$1::varchar` / `$2::varchar` casts in
  `seed-master-data.ts`. Re-ran clean and idempotent.
- Informational: `pg` prints a future-deprecation SSL-mode warning
  (`'require' treated as alias for 'verify-full'`). No impact on the
  current connection; revisit before a `pg` v9 upgrade.
- Carried forward: backend full-tree installs still need
  `--legacy-peer-deps`; the M2 note about rotating the Neon password via
  `neon credentials` still stands.

### Deviations from the docs
- **None.** Columns, types, NOT NULL/defaults, unique constraints and
  FKs follow `development-docs.md` §1.1–§1.4 exactly. The opaque
  `master_data` codes are non-human-readable tokens as the docs require;
  the docs intentionally don't specify literal strings, so generated
  tokens were used and their meanings recorded above.

---


## Milestone 2 — Connect NestJS to PostgreSQL — Completed 2026-10-08

ORM choice: **TypeORM** (`@nestjs/typeorm`, `typeorm`, `pg`);
connection via `DATABASE_URL_UNPOOLED` (Neon direct host).

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Backend logs show a successful DB connection on startup | ✅ Passed | Fresh boot of `npm run start:dev` with the final config logged "Found 0 errors" → "Nest application successfully started" → "F1 Help Desk backend listening on port 7676" → **"Database connection established: true"** (DataSource.isInitialized) in `/tmp/backend_m2_final.log`. |
| 2 | You've proven a table can be created from code, not just configured | ✅ Passed | Temporary entity + `synchronize: true` made TypeORM execute `CREATE TABLE "m2_connection_probe" ("id" SERIAL NOT NULL … PRIMARY KEY ("id"))` against Neon — captured in the boot log (ANSI-stripped) — and `psql` immediately showed the table existed (count=1). |
| 3 | *(user-added)* No throwaway table or entity remains | ✅ Passed | `backend/src/m2-throwaway.entity.ts` deleted; `grep -rn 'M2ThrowawayEntity\|m2-throwaway\|m2_connection_probe' backend/src/` → no matches; psql: probe count=0 and **zero tables in public schema**; a fresh restart after the drop did not recreate it. |
| 4 | *(user-added)* Backend still starts cleanly on port 7676 | ✅ Passed | Fresh restart after cleanup: 0 compile errors, clean startup log with `Database connection established: true`, `GET http://localhost:7676/` → HTTP 200 ("Hello World!"). |

### Summary of changes
- `backend/src/app.module.ts` — `TypeOrmModule.forRoot(...)` with
  `url: DATABASE_URL_UNPOOLED` (env), explicit
  `ssl: { rejectUnauthorized: false }`, `autoLoadEntities: true`,
  **`synchronize: false`**.
- `backend/src/main.ts` — fails fast if `DATABASE_URL_UNPOOLED` is
  unset; logs `Database connection established: <bool>` after listen
  (URL never printed).
- `backend/package.json` / `package-lock.json` — `@nestjs/typeorm`,
  `typeorm`, `pg` (installed with `--legacy-peer-deps`).
- `backend/.env.example` — placeholder-only `DATABASE_URL_UNPOOLED`
  (fake Neon-style URL) added.
- `docs/development-docs.md` — stack line now records TypeORM
  (user-approved).
- Processes: old foreground `nest start` (2026-10-07 22:48) replaced
  by detached `npm run start:dev` watch instance on :7676; foreign
  :3001 process untouched; frontend :3000 left running.
- Tables: none remain (transient `m2_connection_probe` created →
  dropped).

### Pending errors or issues
- Non-blocking `pg` startup warning: "SECURITY WARNING: The SSL
  modes 'prefer', 'require', and 'verify-ca' are treated as aliases
  for 'verify-full'…" — informational, concerns a future pg v9
  behavior change; connections work as-is. No action needed now;
  revisit before any pg major upgrade.
- Carried forward (non-blocking, unchanged): backend full-tree
  `npm install` may need `--legacy-peer-deps` (npm 10.9.4 arborist
  bug); the M1 diagnostic that printed the Neon URL password lives
  only in the terminal transcript (rotate via `neon credentials` if
  desired).
- Otherwise: None.

### Deviations from the docs
- Docs edit (user-approved): `development-docs.md` stack line now
  records the ORM (TypeORM, integer identity PKs) — reason: user
  decision to standardize on TypeORM; recorded in the changelog.
- `main.ts` env guard + connection-status log go slightly beyond the
  checklist wording — they exist to satisfy its "logs show a
  successful DB connection" check without ever printing the URL.
- Backend switched from a foreground `nest start` to a detached
  watch-mode instance — required so code changes actually reload
  during later milestones; behavior otherwise identical.

## Milestone 1 — PostgreSQL Setup — Completed 2026-10-08

Provisioned as a **hosted Neon instance** (checklist step 1's second
option) instead of a local install, per the user's prescribed Neon
setup steps.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | You can connect to the database outside of your app code | ✅ Passed | Ran `psql` directly with the `DATABASE_URL` from `backend/.env`: returned `current_user=neondb_owner`, `current_database=neondb`, `CREATE` privilege `t`, and `PostgreSQL 18.6` on Neon. **Re-verified 2026-10-08 per user**: first attempt connected (no suspend-retry needed), then created throwaway table `f1_helpdesk_m1_probe_tmp` (exists=1) and dropped it (exists=0) — full round-trip passed; `\dt` at milestone close reported no tables (expected — Milestone 3 creates them). |
| 2 | Connection string is in .env, not hardcoded anywhere | ✅ Passed | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEON_BRANCH` written to `backend/.env` by `neon link`/`neon deploy`; `backend/.env` is gitignored (`git check-ignore` confirmed). `git grep -F 'ep-tiny-sun'` over tracked files and `git ls-files -o --exclude-standard` over committable files both return no matches. |

### Summary of changes
- **Neon CLI 8.0.12** installed globally (npm prefix → `~/.npm-global`
  due to `/usr/local` EACCES) and OAuth-logged-in as `mrstudent211`.
- **`neon link`** → backend linked to project `rapid-bread-25047918`
  ("F1 help desk"), branch `production`; context file `backend/.neon`
  (IDs only).
- **`neon skills -y` / `neon mcp -y`** → 8 skills in
  `backend/.agents/skills/` + `skills-lock.json`; MCP registered in 7
  agent configs (one MCP API key minted, stored outside the repo).
- **`neon config init` + step 6 edit** → `backend/neon.ts` set to bare
  `defineConfig({})`; deps `@neon/config`, `@neon/env` added to
  `backend/package.json`.
- **`neon deploy`** → "No changes — branch production already matches
  the policy"; connection strings pulled into `backend/.env`.
- **Git**: `.gitignore` (+`*env`), `backend/.gitignore` (+`.neon`).
- **No tables** — database intentionally empty until Milestone 3.
- **2026-10-08 follow-up (per user go-ahead):** re-verified M1 against
  Neon (connect + CREATE/DROP round-trip, first attempt passed);
  stopped the stale M0 `nest --watch` process; standardized the port
  to 7676 across `.env.example` files and all doc mentions; applied
  the approved Neon doc rewrites.

### Pending errors or issues
- None new in this milestone. The Milestone 0 note still stands:
  backend *full-tree* `npm install` may need `--legacy-peer-deps`
  (npm 10.9.4 arborist bug) — although `neon config init`'s install of
  the two `@neon/*` packages succeeded without the flag, the original
  vitest peer-graph crash can still recur on a clean full install.
- Environment notes resolved 2026-10-08: port standardized to
  **7676** (backend/frontend `.env` + both `.env.example` files +
  all CHANGELOG/checklist mentions now agree); the stale M0
  `nest start --watch` process was stopped (port 3001 is now held by a
  different project's app — Ryo Academy — left untouched). Backend
  `:7676` and frontend `:3000` re-confirmed HTTP 200 afterwards.
- One diagnostic run printed the full Neon URL (incl. password) into
  the terminal transcript only; it is not stored in any file or commit.
  Rotate via `neon credentials` if desired.

### Deviations from the docs
- Database name is **`neondb`**, not the checklist's example
  `f1_helpdesk_db` ("e.g." — example, not a requirement); role is the
  Neon-provisioned **`neondb_owner`** (dedicated owner, password-protected,
  not a superuser — satisfies step 3).
- Provisioned hosted Neon rather than a local install (step 1 allows
  either).
- **Approved doc rewrite (2026-10-08, per user):**
  `development-check-list.md` Milestone 1's local-Postgres install
  steps replaced with "Create a Neon project, database and role in the
  Neon console", and `development-docs.md`'s stack line now says the
  database is "hosted on Neon". Reason: the database is hosted on
  Neon, so the original local-install wording was obsolete and would
  mislead future contributors. Local Postgres is explicitly ignored —
  no superuser use, no `pg_hba.conf`/auth changes, nothing created on
  the local server. Recorded as a deviation in the changelog.

## Milestone 0 — Project Scaffolding — Completed 2026-10-07

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Backend starts with no errors on its port | ✅ Passed | Ran `npm run start:dev` in `backend/`: TypeScript compiled with "Found 0 errors", all 9 module stubs initialized, Nest logged "Nest application successfully started" and "F1 Help Desk backend listening on port 7676" (proves `.env` PORT was loaded; re-verified after port standardization). `curl http://localhost:7676/` returned HTTP 200 "Hello World!". No errors/exceptions in the backend dev log. |
| 2 | Frontend starts with no errors and shows a default page | ✅ Passed | Ran `npm run dev` in `frontend/`: Next.js 16.4.0 logged "✓ Ready in 2.9s" / "Environments: .env" with no errors. `curl http://localhost:3000/` returned HTTP 200 containing the "F1 Help Desk" default landing page; `/super-admin` and `/admin` both returned HTTP 200 with their placeholder content. No errors in `/tmp/frontend_dev.log`. |
| 3 | `.env` files exist and are not committed to Git | ✅ Passed | `backend/.env` and `frontend/.env` exist on disk. `git check-ignore -v` confirms `backend/.env` → `backend/.gitignore:.env` and `frontend/.env` → `frontend/.gitignore:.env*`. `git ls-files -o --exclude-standard \| grep '\.env'` lists only `backend/.env.example` and `frontend/.env.example` (templates, intentionally committable); the real `.env` files appear nowhere in the untracked list. |

### Summary of changes
- **Backend** (`backend/`): NestJS 12 scaffold; 9 empty module stubs
  (`auth`, `admins`, `super-admins`, `partners`, `locations`,
  `master-data`, `inventory`, `configurations`, `status-requests`)
  registered in `AppModule`; `main.ts` loads `.env` via `dotenv` and
  listens on `PORT=7676`.
- **Frontend** (`frontend/`): Next.js 16 App Router scaffold with
  `super-admin/` and `admin/` role-area routes (placeholder pages), a
  branded default landing page, and `NEXT_PUBLIC_API_BASE_URL` env var.
- **Env & Git**: `backend/.env` + `frontend/.env` created (DB connection
  string placeholder, JWT secret, ports), matching `.env.example`
  templates committed, `.env` gitignored at root/backend/frontend.
- **No tables, no API endpoints** — intentionally none for this
  milestone.
- Docs created: `docs/CHANGELOG.md`, `docs/completed-checklist.md`.

### Pending errors or issues
- Backend `npm install` fails without `--legacy-peer-deps` due to an npm
  10.9.4 arborist bug (`TypeError: Cannot read properties of null
  (reading 'edgesOut')` while resolving vitest peers). Worked around by
  installing with `--legacy-peer-deps`; not breaking, but future backend
  installs must use that flag (or upgrade npm). No other issues.

### Deviations from the docs
- None in structure or scope. Small additions beyond the literal
  checklist wording, all in service of it: `dotenv` (to actually read
  the `.env` port), `.env.example` templates (safe-to-commit
  documentation of required variables), and wiring the module stubs into
  `AppModule` so the backend boots as a coherent scaffold.
