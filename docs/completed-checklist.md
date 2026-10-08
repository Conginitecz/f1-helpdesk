# Completed Checklist

Verification record for each finished milestone: every "Check before
moving on" item from `docs/development-check-list.md`, marked passed or
failed with a note on how it was verified.

---

## Milestone 1 — PostgreSQL Setup — Completed 2026-10-08

Provisioned as a **hosted Neon instance** (checklist step 1's second
option) instead of a local install, per the user's prescribed Neon
setup steps.

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | You can connect to the database outside of your app code | ✅ Passed | Ran `psql` directly with the `DATABASE_URL` from `backend/.env` (quotes stripped): returned `current_user=neondb_owner`, `current_database=neondb`, and `PostgreSQL 18.6` on Neon. `\dt` reports "Did not find any tables" (expected — Milestone 3 creates them). |
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

### Pending errors or issues
- None new in this milestone. The Milestone 0 note still stands:
  backend *full-tree* `npm install` may need `--legacy-peer-deps`
  (npm 10.9.4 arborist bug) — although `neon config init`'s install of
  the two `@neon/*` packages succeeded without the flag, the original
  vitest peer-graph crash can still recur on a clean full install.
- Environment notes (not errors): backend port is now **7676** in
  `backend/.env` (changed by a parallel session on 2026-10-07 — the
  Milestone 0 records still say 3001, the value that was true and
  verified at the time); a stale `nest start --watch` from the M0
  session still holds port 3001 alongside the live 7676 instance.
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

## Milestone 0 — Project Scaffolding — Completed 2026-10-07

### Check before moving on

| # | Item | Result | How it was verified |
|---|---|---|---|
| 1 | Backend starts with no errors on its port | ✅ Passed | Ran `npm run start:dev` in `backend/`: TypeScript compiled with "Found 0 errors", all 9 module stubs initialized, Nest logged "Nest application successfully started" and "F1 Help Desk backend listening on port 3001" (proves `.env` PORT was loaded). `curl http://localhost:3001/` returned HTTP 200 "Hello World!". No errors/exceptions in `/tmp/backend_dev.log`. |
| 2 | Frontend starts with no errors and shows a default page | ✅ Passed | Ran `npm run dev` in `frontend/`: Next.js 16.4.0 logged "✓ Ready in 2.9s" / "Environments: .env" with no errors. `curl http://localhost:3000/` returned HTTP 200 containing the "F1 Help Desk" default landing page; `/super-admin` and `/admin` both returned HTTP 200 with their placeholder content. No errors in `/tmp/frontend_dev.log`. |
| 3 | `.env` files exist and are not committed to Git | ✅ Passed | `backend/.env` and `frontend/.env` exist on disk. `git check-ignore -v` confirms `backend/.env` → `backend/.gitignore:.env` and `frontend/.env` → `frontend/.gitignore:.env*`. `git ls-files -o --exclude-standard \| grep '\.env'` lists only `backend/.env.example` and `frontend/.env.example` (templates, intentionally committable); the real `.env` files appear nowhere in the untracked list. |

### Summary of changes
- **Backend** (`backend/`): NestJS 12 scaffold; 9 empty module stubs
  (`auth`, `admins`, `super-admins`, `partners`, `locations`,
  `master-data`, `inventory`, `configurations`, `status-requests`)
  registered in `AppModule`; `main.ts` loads `.env` via `dotenv` and
  listens on `PORT=3001`.
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
