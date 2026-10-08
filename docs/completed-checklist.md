# Completed Checklist

Verification record for each finished milestone: every "Check before
moving on" item from `docs/development-check-list.md`, marked passed or
failed with a note on how it was verified.

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
