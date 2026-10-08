# Changelog

All notable changes to the F1 Help Desk project. Newest entries first.

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
- Backend port remains **7676** in `backend/.env` (changed from 3001
  by a parallel session on 2026-10-07 22:48; not yet reflected in the
  Milestone 0 records — see completed-checklist).

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
  - `backend/.env` — `PORT=3001`, `DATABASE_URL` (placeholder
    credentials until Milestone 1), `JWT_SECRET` (dev value).
  - `backend/.env.example`
  - `frontend/.env` — `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`.
  - `frontend/.env.example`
- **Git ignore rules**: root `.gitignore`, `backend/.gitignore`, and an
  added `!.env.example` exception in `frontend/.gitignore` (its default
  `.env*` rule would otherwise have hidden `.env.example` too).
- `dotenv` dependency in the backend, loaded via `import 'dotenv/config'`
  at the top of `backend/src/main.ts` so `PORT`/future secrets are read
  from `.env`.

### Decisions
- **Ports**: backend on **3001**, frontend on **3000** — avoids the
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
