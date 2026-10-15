# M2 — Partner Lifecycle

Date: 2026-10-13
Status: **Blocked pending review**

## Objective and scope

M2 was limited to Vendor and Service Engineer lifecycle rules. The approved
scope included Vendor initial state, Vendor eligibility, Engineer creation under
eligible Vendors, immutable Vendor association, invalid-transition protection,
and focused tests. M3 status-request processing was explicitly out of scope.

## Approved business decisions

1. Use one lifecycle status for Vendor onboarding and operational activation.
2. Admins request activation/deactivation; Super Admins decide.
3. Engineers may be created only under an approved, eligible Vendor owned by
   the authenticated Admin.

## Initial findings

- The existing `partners` entity has only `is_active` as a lifecycle field.
- The migration creates only the `is_active` boolean for partner lifecycle.
- Admin-created Vendors currently default to `isActive: true`.
- Engineer creation under a Vendor validates ownership and Vendor type, but not
  lifecycle eligibility.
- Admin status requests currently reject Vendor targets and accept only
  activate/deactivate requests for Service Engineers.
- Super Admin direct activation/deactivation exists for any partner.

Relevant files:

- `backend/src/partners/partners.entity.ts`
- `backend/src/partners/partners.service.ts`
- `backend/src/partners/partners.controller.ts`
- `backend/src/status-requests/status-requests.entity.ts`
- `backend/src/status-requests/status-requests.service.ts`
- `backend/src/migrations/1791479985733-M4PartnerInventory.ts`

## Lifecycle behavior implemented

None. The milestone stopped before implementation because the approved rules
cannot be enforced safely within the M2/M3 boundary using the current schema
and endpoints.

## Stop condition and rationale

Keeping Vendor creation active violates the approved requirement that a new
Vendor awaits approval. Changing creation to inactive would conflate pending,
rejected, and deactivated states because the existing schema has only a
boolean. Enforcing Admin-request/Super-Admin-decision authority requires
changing the existing status-request behavior or implementing M3 processing,
which this task explicitly prohibits.

The existing Super Admin direct activation/deactivation endpoints also conflict
with the approved authority model. Removing or redesigning them requires an
explicit backward-compatibility decision.

## Files changed

Only documentation was changed for this blocked milestone:

- `docs/M2_PARTNER_LIFECYCLE.md` — this audit and stop report.
- `docs/F1_BACKEND_CODEX_PLAN.md` — appended the M2 audit and stop decision.

No backend source, tests, frontend files, entities, migrations, or seed scripts
were changed.

## Database and migration status

- No migration was created, modified, run, or reverted.
- No shared Neon database was contacted or modified.
- No destructive database operation was performed.

## Tests and verification

No new tests were added because no runtime behavior was implemented. The prior
M1 baseline remains unchanged; this milestone did not claim new test results.

## Known limitations and M3 dependencies

M2 cannot proceed until review approves one of these boundaries:

- permit the required status-request transition work to be implemented with
  M2, or
- approve an additive lifecycle representation and define how existing rows map
  to pending, approved, rejected, and deactivated states, or
- explicitly revise the single-status/authority requirements.

The existing direct Super Admin partner activation API also needs an explicit
compatibility decision.

## Deviations

The requested M2 implementation was not performed because continuing would
require guessing a lifecycle state model or crossing into M3. This follows the
task's strict stop conditions.

## User changes and execution boundary

Existing user changes were preserved. No frontend files were touched. Execution
stopped before M3 and before any database operation.
