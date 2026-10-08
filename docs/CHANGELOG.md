# Changelog

All notable changes to the F1 Help Desk project. Newest entries first.

---

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
