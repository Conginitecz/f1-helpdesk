# F1 Help Desk — V0 Build Milestones & Checklist

A step-by-step build order for the Admin & Super Admin dashboard, with a
checklist at the end of each milestone. Follow in order — each milestone
assumes the previous ones are working. Target: Sunday (Oct 4, 2026).

---

## Milestone 0 — Project Scaffolding

Goal: empty but running frontend + backend, nothing wired together yet.

Steps:
1. Create the NestJS backend project. Set up folder structure by module
   (auth, admins, super-admins, partners, locations, master-data,
   inventory, configurations, status-requests) even if most are empty
   stubs for now.
2. Create the Next.js frontend project. Set up basic routing/folder
   structure for the two role areas (super-admin/*, admin/*).
3. Set up environment variable files (.env) on both projects — DB
   connection string, JWT secret, port numbers — and make sure .env is
   gitignored.
4. Initialize a Git repo (if not already) and make your first commit
   with the empty scaffolds.

Check before moving on:
- Backend starts with no errors on its port.
- Frontend starts with no errors and shows a default page.
- .env files exist and are not committed to Git.

---

## Milestone 1 — PostgreSQL Setup (Neon)

Goal: a running Neon (hosted PostgreSQL) database the backend can reach.

Steps:
1. Create a Neon project, database and role in the Neon console
   (hosted PostgreSQL — do not set up, use, or modify a local Postgres
   install for this project).
2. Create the database for this project on the Neon branch.
3. Use the dedicated Neon role that comes with the project (an owner
   role with a password, not a superuser); it has rights on that
   database.
4. Confirm you can connect to it with a plain client (psql or a GUI
   tool like TablePlus/DBeaver) using that role's connection string
   before touching code.
5. Put the connection string into the backend's .env.

Check before moving on:
- You can connect to the database outside of your app code.
- Connection string is in .env, not hardcoded anywhere.

---

## Milestone 2 — Connect NestJS to PostgreSQL

Goal: backend boots and successfully talks to the database.

Steps:
1. Install and configure your ORM of choice (TypeORM or Prisma — pick
   one now, it affects how you write the schema next).
2. Configure the database module in NestJS using the .env connection
   string.
3. Create one throwaway test entity/table to confirm the connection
   actually works end to end, not just that config loaded.
4. Run the app and confirm in the logs (or by checking the DB directly)
   that the connection succeeded and the test table was created.
5. Remove the test entity once confirmed.

Check before moving on:
- Backend logs show a successful DB connection on startup.
- You've proven a table can be created from code, not just configured.

---

## Milestone 3 — Core Schema: Auth & Org Structure

Goal: the tables that everything else depends on exist and are correct.

Build in this order, since each depends on the one before:
1. super_admins
2. locations
3. admins (references locations, super_admins)
4. master_data

Steps:
1. Define each entity/model exactly per the schema doc — correct
   column types, NOT NULL constraints, defaults, and foreign keys.
2. Run the migration (or let the ORM sync, if you're using that
   approach) and verify each table in the database directly.
3. Seed master_data with the required default rows: partner_type
   (vendor code, engineer code) and reference_type (admin code, vendor
   code). Write this as a seed script you can re-run, not manual
   inserts, so it's repeatable.
4. Manually insert one super admin row (hash the password properly,
   don't store it plain) so you have a login to work with later.

Check before moving on:
- All four tables exist with correct columns and foreign keys.
- master_data has its seeded partner_type and reference_type rows —
  write down the actual IDs it assigned, you'll need them for testing.
- A super admin row exists in the DB with a hashed password.

---

## Milestone 4 — Core Schema: Partners & Supporting Tables

Goal: the rest of the schema exists.

Build in this order:
1. partners (references admins, master_data — self-references itself
   via reference_id, but remember that FK can't be enforced at the DB
   level since it's polymorphic; validate in application code instead)
2. inventory_items (references master_data, locations, admins,
   super_admins)
3. configurations
4. status_change_requests (references admins, super_admins)

Steps:
1. Define each entity/model per the schema doc.
2. Run migrations and verify in the database.
3. Double check the nullable fields on partners (skill_id, category_id,
   reference_type_id, reference_id, email, address) are actually
   nullable — this table is shared between two very different row
   shapes (vendor vs engineer) and it's an easy place to get a
   NOT NULL wrong.

Check before moving on:
- All remaining tables exist with correct columns and foreign keys.
- You can manually insert one vendor-shaped partner row and one
  engineer-shaped partner row directly in the DB and both succeed.

---

## Milestone 5 — Authentication

Goal: login works for both roles, protected routes reject unauthenticated
requests.

Steps:
1. Build POST /auth/login — accepts email/username + password, checks
   against both super_admins and admins tables, returns a JWT with role
   embedded in it plus the user's id.
2. Build POST /auth/logout (can be a simple client-side token discard if
   you're not maintaining a token blocklist — fine for V0).
3. Build an auth guard/middleware that checks the JWT and exposes the
   role, so later endpoints can restrict by role (super_admin-only vs
   admin-only).
4. Test login against the super admin row you seeded in Milestone 3.

Check before moving on:
- Logging in with correct credentials returns a valid token.
- Logging in with wrong credentials is rejected with a proper error.
- Hitting a protected test route without a token is rejected.
- The token correctly identifies role (super_admin vs admin).

---

## Milestone 6 — Super Admin Backend: Admins & Locations

Goal: super admin can manage admin accounts and locations via API.

Steps:
1. Build GET /super-admin/admins and POST /super-admin/admins (hash
   password on creation, assign location_id).
2. Build PATCH /super-admin/admins/:id/activate and /deactivate.
3. Build GET, POST, PATCH for /super-admin/locations.
4. Guard all of the above so only super_admin role can call them.

Check before moving on:
- You can create a new admin via API and see it in the DB.
- Activate/deactivate toggles is_active correctly.
- Calling these endpoints with an admin-role token (not super admin) is
  rejected.

---

## Milestone 7 — Super Admin Backend: Master Data & Configuration

Goal: super admin can manage master_data rows and config key/values.

Steps:
1. Build GET /super-admin/master-data?type=... and POST (create new
   row) and PATCH (edit label).
2. Do not build a delete endpoint for master_data in V0. That keeps the
   seeded core rows (partner_type, reference_type) safe by default. Make
   sure those rows can still be edited (label only) via PATCH without
   changing the IDs your app logic depends on.
3. Build GET /super-admin/config and PATCH /super-admin/config/:key.

Check before moving on:
- You can list master data filtered by type.
- You can add a new row to a non-core type (e.g. add a new inventory
  category) and it appears correctly.
- Editing a seeded core row's label doesn't change its id, so nothing
  else breaks.

---

## Milestone 8 — Super Admin Backend: Partners & Status Requests

Goal: super admin can view/manage all partners directly, and resolve
admin-submitted status change requests.

Steps:
1. Build GET /super-admin/partners?type=vendor|engineer.
2. Build PATCH /super-admin/partners/:id/activate and /deactivate
   (writes straight to is_active, bypassing status_change_requests).
3. Build GET /super-admin/status-requests.
4. Build PATCH /super-admin/status-requests/:id/approve and /reject —
   approve must actually flip is_active on the target partner row, not
   just mark the request resolved.

Check before moving on:
- Filtering partners by type=vendor vs type=engineer returns the right
  rows (test against the vendor-shaped and engineer-shaped rows you
  inserted in Milestone 4).
- Approving a status request actually changes the partner's is_active
  state, and the request's own status updates to "approved".
- Rejecting a request leaves the partner's is_active untouched.

---

## Milestone 9 — Super Admin Backend: Inventory

Goal: super admin can view and manage inventory across all locations.

Steps:
1. Build GET /super-admin/inventory (with optional location_id filter).
2. Build POST /super-admin/inventory — location_id required in payload
   here, since super admin must choose explicitly.
3. Build PATCH /super-admin/inventory/:id.

Check before moving on:
- Creating inventory without a location_id in the payload is rejected
  with a clear error (this is the one place it's required, not
  auto-set — easy to accidentally make it optional by copying the
  admin-side logic later).
- Filtering by location_id returns only that location's items.

---

## Milestone 10 — Admin Backend: Partners (Engineers & Vendors)

Goal: admin can create and list their own service engineers and
vendors, and add engineers under a vendor.

Steps:
1. Build POST /admin/partners for a service engineer — sets
   partner_type_id to the engineer code, reference_type_id to the admin
   code, reference_id to the calling admin's own id.
2. Build POST /admin/partners for a vendor — sets partner_type_id to
   the vendor code, reference_type_id and reference_id left null.
3. Build GET /admin/partners?type=engineer and ?type=vendor, both
   scoped to rows created by (or tracing back to) the calling admin.
4. Build POST /admin/partners/:vendorPartnerId/service-engineers — sets
   partner_type_id to engineer code, reference_type_id to vendor code,
   reference_id to the vendor's partner id.
5. Build POST /admin/partners/:id/request-status-change — writes a row
   to status_change_requests, does not touch is_active directly.
6. Guard all of the above so only admin role can call them, and that
   list endpoints never leak another admin's partners.

Check before moving on:
- Creating an engineer directly, a vendor, and an engineer under that
  vendor all produce correctly-shaped rows — check reference_type_id
  and reference_id by hand in the DB for each case.
- Logging in as a second admin and listing partners shows only that
  admin's own rows, not the first admin's.
- Submitting a status-change request creates a pending row and does
  NOT change the partner's is_active.

---

## Milestone 11 — Admin Backend: Inventory & Master Data Read

Goal: admin can add inventory auto-tagged to their location, and read
master data for populating dropdowns.

Steps:
1. Build GET /admin/inventory, scoped to the admin's own location_id.
2. Build POST /admin/inventory — location_id is NOT accepted from the
   client, it's set server-side from the admin's own location_id.
3. Build GET /admin/master-data?type=..., read-only, active rows only.

Check before moving on:
- Creating inventory as an admin always lands in their own location,
  even if you try to pass a different location_id in the request body
  (confirm the server ignores/overrides it).
- Master data dropdown endpoint returns only is_active = true rows.

---

## Milestone 12 — Backend Complete: Full Pass Test

Goal: confirm the whole API surface works together before starting
frontend work.

Steps:
1. Walk through the entire user journey with a REST client (Postman/
   Insomnia/Thunder Client): super admin logs in, creates a location,
   creates an admin, admin logs in, admin creates a vendor, admin adds
   an engineer under that vendor, admin adds an engineer directly,
   admin requests deactivation of one engineer, super admin approves
   it, super admin adds inventory to a location, admin adds inventory
   to their own location.
2. Fix anything that breaks during this walkthrough before touching the
   frontend — it's much cheaper to catch here.

Check before moving on:
- The entire journey above completes without manual DB edits.
- is_active states are correct everywhere at the end of the walkthrough.

---

## Milestone 13 — Frontend: Auth & Shell

Goal: login works from the UI, and both role areas have a basic shell
to build screens into.

Steps:
1. Build the login page — single form, calls /auth/login, stores the
   token, redirects based on role.
2. Build route protection on the frontend so admin routes aren't
   reachable without an admin token, and super-admin routes aren't
   reachable without a super-admin token.
3. Build a basic shell/layout for each role area (nav with the screen
   names from the spec, logout button).

Check before moving on:
- Logging in as super admin lands you in the super admin shell; same
  for admin.
- Trying to directly visit the other role's URL while logged in as one
  role redirects away or blocks access.

---

## Milestone 14 — Frontend: Super Admin Dashboard & User Management

Goal: Dashboard and User Management screens fully working.

Steps:
1. Dashboard screen: add-new-admin form wired to POST
   /super-admin/admins, plus a list/overview of existing admins.
2. User Management screen: tabs/filters for Admins / Vendors / Service
   Engineers, table with status, direct activate/deactivate buttons.
3. Pending Status Requests section: list with approve/reject buttons.

Check before moving on:
- Creating an admin from the UI actually works end to end and shows up
  in the list without a page refresh being required to see it (or at
  least refreshes cleanly).
- Activate/deactivate buttons update the table state visibly.
- Approving/rejecting a status request updates both the request list
  and, for approvals, the partner's status.

---

## Milestone 15 — Frontend: Super Admin Configuration & Inventory

Goal: Configuration and Inventory screens fully working.

Steps:
1. Configuration screen: pricing key/value editable list, locations
   list + add form, master data manager (select type, view/add/edit
   rows, core seeded rows label-editable only).
2. Inventory screen: table with location filter, add-item form
   (location is a required dropdown here), edit existing items.

Check before moving on:
- Adding a new location from the UI makes it immediately selectable in
  other dropdowns that use locations (admin creation, inventory add).
- Adding a new master data row under a non-core type works and is
  immediately usable in relevant dropdowns elsewhere.
- Inventory add/edit works correctly across different locations.

---

## Milestone 16 — Frontend: Admin Screens

Goal: all three admin screens fully working.

Steps:
1. Service Engineer Creation & List: form (name, phone, skill dropdown,
   category dropdown), list view, per-row "Request Activation/
   Deactivation" action.
2. Vendor Creation & List: form (name, phone, email, address), list
   view, drill-in per vendor to add engineers under it.
3. Inventory: add-item form with no location field shown (auto-set),
   list view of own location's inventory.

Check before moving on:
- Creating an engineer and a vendor both work and show up correctly in
  their respective lists.
- Drilling into a vendor and adding an engineer under it correctly
  nests that engineer (verify in the super admin's partner list that it
  traces back properly).
- Submitting a status-change request shows no outcome in the UI
  afterward (by design) but does succeed silently.
- Inventory items added here always land in the admin's own location.

---

## Milestone 17 — End-to-End Walkthrough & Polish

Goal: the whole product works as a coherent demo.

Steps:
1. Repeat the full journey from Milestone 12, this time entirely
   through the UI, both roles, start to finish.
2. Check obvious error states: empty lists, failed logins, form
   validation on required fields.
3. Basic loading states on data fetches so nothing looks broken while
   waiting on the network.
4. Quick visual pass — consistent spacing/buttons, nothing overlapping
   or unreadable — doesn't need to be polished, just presentable.

Check before moving on (this is your ship checklist):
- Fresh login as super admin and as admin both work.
- Every screen in the spec loads without errors.
- The full partner/vendor/engineer/inventory/status-request journey
  works start to finish through the UI alone.
- Nothing in the browser console is throwing errors on normal use.

---

## Notes

- Milestones 3-4 (schema) and 6-11 (backend endpoints) are the places
  most likely to run long — budget more time there than the frontend
  milestones, since the frontend is mostly wiring once the API is solid.
- Out of scope, don't build: certification expiry, disciplinary
  suspension, dispute handling, payments/commission, multi-engineer
  jobs, real-time matching notifications, admin-facing status-request
  outcomes, password reset.
