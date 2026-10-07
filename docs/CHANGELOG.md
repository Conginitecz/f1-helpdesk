# Changelog

All notable changes to the F1 Help Desk project. Newest entries first.

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
