# F1 Backend Codex Plan — Repository Change Log

> The authoritative task contract remains
> `/home/qwerty/Downloads/F1_BACKEND_CODEX_PLAN.md`. This repository copy is
> the append-only milestone and change log requested for work performed here.

# M1 — Authorization and Ownership

Date: 2026-10-13

## Scope

This milestone covered authorization and ownership only, as defined by
`F1_BACKEND_CODEX_PLAN.md`:

- JWT authentication and role-guard coverage on sensitive backend routes.
- Super Admin versus Admin route boundaries.
- Admin ownership of vendors, service engineers, and status requests.
- Admin inventory location scoping and client-location tampering.
- Focused negative tests.

No M2 partner-lifecycle or M3 status-request behavior was implemented.

## Initial findings

The source audit confirmed that all sensitive controller groups already use
`JwtAuthGuard` and `RolesGuard`, with controller-level `@Roles()` metadata:

- Super Admin: admins, locations, partners, inventory, status requests,
  configuration, and master data.
- Admin: partners, inventory, status-request reads, and active master-data
  reads.

Ownership checks were also present in the existing services:

- `PartnersService.findForAdmin()` scopes vendors to `createdByAdmin` and
  engineers to either the Admin or an owned vendor.
- `PartnersService.createEngineerForVendor()` requires the vendor to belong to
  the authenticated Admin.
- `PartnersService.requestStatusChange()` requires the target partner to be
  owned by the authenticated Admin.
- `StatusRequestsService.findForAdmin()` filters by the authenticated Admin's
  requester ID.
- `InventoryService.createForAdmin()` and `findForAdmin()` resolve the Admin
  and use its assigned location rather than trusting the request body.

No confirmed runtime authorization or ownership defect was found.

## Decisions and assumptions

- Existing controller guards and service ownership predicates were retained.
- The existing `createdByAdmin` relationship is the ownership authority for
  partner operations.
- Admin inventory location is server-derived from the authenticated Admin.
- No behavior was added for unresolved inactive-location policy, Admin editing,
  vendor onboarding, or status-request expansion.

These are verified implementation facts or existing contract decisions, not new
product assumptions.

## Implementation

Only regression tests were added:

- `backend/src/authorization-m1.spec.ts`
  - Verifies JWT and expected role metadata for every sensitive controller.
- `backend/src/partners/partners.service.spec.ts`
  - Verifies cross-Admin status-request access is rejected.
  - Verifies cross-Admin vendor-based engineer creation is rejected.

No production backend behavior required changing during M1.

## Database and migrations

- No database connection was made.
- No migration was created, modified, run, or reverted.
- No schema or seed data changed.

## Tests and verification

Executed from `backend/`:

```text
npm test -- --reporter=dot
```

Result: 6 test files passed; 20 tests passed.

```text
npm run build
```

Result: passed.

```text
npm run lint
```

Result: passed with the existing warning at
`backend/src/auth/auth.service.ts:86` for an unused catch parameter.

```text
git diff --check
```

Result: passed.

## Files changed

M1 changes made by this milestone:

- `backend/src/authorization-m1.spec.ts`
- `backend/src/partners/partners.service.spec.ts`
- `docs/M1_AUTHORIZATION_OWNERSHIP.md` (this report)

Pre-existing user changes were preserved, including the modified
`backend/src/main.ts`, modified frontend files, modified
`docs/CHANGELOG.md`, and untracked `backend.zip`.

## Unresolved issues and follow-up

The following remain intentionally unimplemented and belong to later milestones
or product decisions:

- Vendor onboarding and eligibility lifecycle.
- All five status-request types, persisted reasons, and duplicate prevention.
- Configuration-key allowlisting.
- Core master-data protection.
- Explicit inactive-location access policy.
- Optional Admin edit support.

No deviation from the approved M1 scope was required. M1 is complete pending
review.

## Change-log policy

Every subsequent change made in this repository for this task must be recorded
in a new dated entry in this file, including files changed, behavior or
documentation changed, verification performed, and any remaining risk.

## 2026-10-13 — M2 Partner Lifecycle audit and stop

### Scope

Inspected M2 requirements, current Git status, the M1 report, partner
controllers, DTOs, service, entity, status-request infrastructure, master-data
seeds, migrations, and partner tests. No M2 runtime implementation was made.

### Findings

- `partners.is_active` is the only lifecycle-like partner column in the
  existing entity and migration (`backend/src/partners/partners.entity.ts:69`
  and `backend/src/migrations/1791479985733-M4PartnerInventory.ts:10`).
- Admin vendor creation currently sets `isActive: true` immediately
  (`backend/src/partners/partners.service.ts:171-195`), so a newly created
  Vendor is immediately eligible under the current implementation.
- Engineer-under-vendor creation checks ownership and partner type but does not
  check vendor lifecycle eligibility (`backend/src/partners/partners.service.ts:210-240`).
- The existing Admin request endpoint only permits engineers
  (`backend/src/partners/partners.service.ts:244-271`).
- Super Admin direct activation/deactivation remains exposed for all partners
  (`backend/src/partners/partners.controller.ts:25-32` and
  `partners.service.ts:287-298`).
- The status-request schema and resolver are existing M3 infrastructure and
  currently support only generic partner activate/deactivate requests
  (`backend/src/status-requests/status-requests.entity.ts` and
  `status-requests.service.ts:71-124`).

### Stop decision

M2 is blocked under the task's strict stop conditions. Decision 2 requires
Admins to request Vendor and Engineer activation/deactivation and Super Admins
to decide, while the task explicitly prohibits implementing the M3 request
state machine in M2. The current boolean can distinguish `false` from `true`,
but safely changing Vendor creation to `false` would make pending, rejected,
and deactivated Vendors indistinguishable. Preserving `true` violates the
approved rule that a newly created Vendor must await approval. Removing or
changing the existing Super Admin direct endpoints would also be a backward-
compatibility/API decision outside a safe isolated M2 change.

No schema change was proposed or applied. No M3 behavior was implemented.
Review is required to choose whether M3 request processing may be pulled into
the lifecycle change, or whether an additive lifecycle representation should be
approved.
