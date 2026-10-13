# Purge Plan (Executed with Approval)

The owner approved the exact 67-row scope on 2026-10-11 after confirming the Neon backup branch and external `pg_dump` backup. The purge completed on the `production` branch in one SERIALIZABLE transaction. Locations 5-8 remained excluded. The SQL below is retained as the reviewed record; its default `dry_run` remains `true` and it must not be run again against this database.

## Backup First

Before any approved purge, export the target Neon database/branch and retain the export outside the repository. Example using the configured unpooled URL from a secure local shell:

```sh
pg_dump "$DATABASE_URL_UNPOOLED" --format=custom --file="$HOME/f1-helpdesk-before-test-purge.dump"
```

Confirm the connection targets the intended Neon project, branch, database, and role. Do not paste or commit the connection string.

## Review Answers and Scope Changes

### Configurations

Read-only Neon query on 2026-10-10 returned every configuration row:

| ID | Key | Value | Description | `updated_at` (UTC) | `updated_by_super_admin_id` |
|---:|---|---|---|---|---:|
| 1 | `TEST-M7-smoke-config` | `100` | Milestone 7 live verification | 2026-10-08 18:05:05.929 | 1 |
| 2 | `min_service_charge` | `500` | NULL | 2026-10-08 18:45:11.547 | 1 |
| 4 | `test_m7_1791504779535` | `TEST-M7-value` | NULL | 2026-10-08 18:42:59.969 | 1 |

The table has no `created_at` or `created_by` columns. The available audit fields are `updated_at` and `updated_by_super_admin_id`; all three rows currently name super admin ID 1 as updater. Configuration ID 3 does not exist.

`min_service_charge` is mentioned in `docs/development-docs.md` as an example config key and is created by the repeatable `backend/src/scripts/seed-configurations.ts` seed with dummy value `500`. A repository-wide search found no runtime read/consumer of this key (only the entity example, seed, and docs). Keep ID 2 as the seeded demo baseline; it is removed from the purge target. ID 4 is a separate M7 test key and remains a purge target. No seed change is needed because the existing seed creates ID 2 idempotently.

### Location Provenance

- Location ID 9 (`Loc-1791491006`) is individually tied to a test: the M6 checklist says this location and admin ID 6 were created together in the admin-creation verification.
- Location IDs 5 (`Test Location`) and 8 (`Patch Me`) appear in the older M6 changelog's broad note about earlier M5/M6 test rows, but there is no per-ID creation evidence.
- Location IDs 6 (`Location before patch`) and 7 (`Location A`) appear in the purge inventory but have no individual creation evidence in the checklist/changelog.

The approved and executed 67-row scope excludes locations 5-8. They remain in the database.

### References Outside the Revised Purge Set

A read-only audit checked all schema foreign keys plus the polymorphic partner/request references for non-target rows pointing at proposed location, admin, partner, or lookup targets. Result: **0 non-purge references**. Configuration ID 2 is retained; its `updated_by_super_admin_id=1` points to the explicitly retained super-admin, not to a purge target. No rows were changed.

## Executed Scope

The purge touched only IDs listed below and in the completed checklist. Config ID 2 was retained as seeded baseline; locations 5-8 were excluded by the owner's choice. Fresh dry-run counts matched exactly before the transaction.

| Table | IDs | Expected count |
|---|---|---:|
| `configurations` | 1, 4 | 2 |
| `master_data` | 5, 6 | 2 |
| `locations` | 4, 9-16 | 9 |
| `admins` | 6-16 | 11 |
| `partners` | 5-25 | 21 |
| `status_change_requests` | 1-11 | 11 |
| `inventory_items` | 1-11 | 11 |
| **Total** | | **67** |

The purge excluded super-admin ID 1, seeded config ID 2, locations 5-8, seeded core master-data IDs 1-4, demo inventory types 7-9, and every ID not listed above. Locations 1-3 are not part of the baseline and were not a verification requirement.

### Execution and Verification Record

- Fresh dry run: configurations 2, master data 2, locations 9, admins 11, partners 21, status requests 11, inventory 11; total **67**. Zero external references were found.
- One SERIALIZABLE transaction deleted in dependency order: status requests 11, inventory items 11, partners 21, admins 11, locations 9, master data 2, configurations 2. Returned-row counts were checked per table before commit.
- Two earlier attempts rolled back without committing deletes: one due to the obsolete locations 1-3 guard; one due to counting the PostgreSQL driver's `[rows, rowCount]` return as two rows. The successful attempt corrected both.
- Post-commit read-only verification passed: super admin ID 1 exists; master-data IDs 1-4 and 7-9 exist; config ID 2 exists; locations 5-8 exist; all purge-list target counts are zero.
- Backup branch `pre-purge-backup-20261010` and the external `pg_dump` were confirmed by the owner before the successful transaction.

## Historical SQL Plan (Do Not Rerun)

This is the reviewed SQL plan retained for audit. The purge already ran; do not set `dry_run` to `false` or rerun this block against the database.

```sql
\set dry_run true
BEGIN;

SELECT 'configurations' AS table_name, id, config_key AS record FROM configurations WHERE id = ANY(ARRAY[1, 4]);
SELECT 'master_data' AS table_name, id, type || ':' || text AS record FROM master_data WHERE id = ANY(ARRAY[5, 6]);
SELECT 'locations' AS table_name, id, name AS record FROM locations WHERE id = ANY(ARRAY[4, 9, 10, 11, 12, 13, 14, 15, 16]);
SELECT 'admins' AS table_name, id, email AS record FROM admins WHERE id = ANY(ARRAY[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
SELECT 'partners' AS table_name, id, name AS record FROM partners WHERE id = ANY(ARRAY[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
SELECT 'status_change_requests' AS table_name, id, entity_type || ':' || entity_id || ':' || requested_action || ':' || status AS record FROM status_change_requests WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
SELECT 'inventory_items' AS table_name, id, name AS record FROM inventory_items WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

SELECT 'configurations' AS table_name, count(*) AS matched FROM configurations WHERE id = ANY(ARRAY[1, 4])
UNION ALL SELECT 'master_data', count(*) FROM master_data WHERE id = ANY(ARRAY[5, 6])
UNION ALL SELECT 'locations', count(*) FROM locations WHERE id = ANY(ARRAY[4, 9, 10, 11, 12, 13, 14, 15, 16])
UNION ALL SELECT 'admins', count(*) FROM admins WHERE id = ANY(ARRAY[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
UNION ALL SELECT 'partners', count(*) FROM partners WHERE id = ANY(ARRAY[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25])
UNION ALL SELECT 'status_change_requests', count(*) FROM status_change_requests WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
UNION ALL SELECT 'inventory_items', count(*) FROM inventory_items WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

\if :dry_run
  \echo 'DRY RUN: no rows deleted; transaction rolled back.'
  ROLLBACK;
\else
  DELETE FROM status_change_requests WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  DELETE FROM inventory_items WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  DELETE FROM partners WHERE id = ANY(ARRAY[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
  DELETE FROM admins WHERE id = ANY(ARRAY[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  DELETE FROM locations WHERE id = ANY(ARRAY[4, 9, 10, 11, 12, 13, 14, 15, 16]);
  DELETE FROM master_data WHERE id = ANY(ARRAY[5, 6]);
  DELETE FROM configurations WHERE id = ANY(ARRAY[1, 4]);
  COMMIT;
  SELECT
    (SELECT count(*) = 1 FROM super_admins WHERE id = 1) AS super_admin_1_exists,
    (SELECT count(*) = 7 FROM master_data WHERE id = ANY(ARRAY[1, 2, 3, 4, 7, 8, 9])) AS required_master_data_remains,
    (SELECT count(*) = 1 FROM configurations WHERE id = 2) AS seeded_configuration_2_remains,
    (SELECT count(*) = 4 FROM locations WHERE id = ANY(ARRAY[5, 6, 7, 8])) AS excluded_locations_5_to_8_remain,
    (SELECT count(*) = 0 FROM configurations WHERE id = ANY(ARRAY[1, 4])) AS purged_configurations_gone,
    (SELECT count(*) = 0 FROM master_data WHERE id = ANY(ARRAY[5, 6])) AS purged_master_data_gone,
    (SELECT count(*) = 0 FROM locations WHERE id = ANY(ARRAY[4, 9, 10, 11, 12, 13, 14, 15, 16])) AS purged_locations_gone,
    (SELECT count(*) = 0 FROM admins WHERE id = ANY(ARRAY[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])) AS purged_admins_gone,
    (SELECT count(*) = 0 FROM partners WHERE id = ANY(ARRAY[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25])) AS purged_partners_gone,
    (SELECT count(*) = 0 FROM status_change_requests WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])) AS purged_requests_gone,
    (SELECT count(*) = 0 FROM inventory_items WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])) AS purged_inventory_gone;
\endif
```

For any future cleanup, prepare a new scoped plan and obtain fresh approval. Post-purge verification requires no locations 1-3; it checks retained config ID 2 and locations 5-8.

## Pending Purge: Phase 2 UI Verification Record (added 2026-10-13)

The 67-row scope above is complete. One further test row exists that was created
during Phase 2 of the UI restructure and is **not** covered by the executed
purge. It is recorded here so it is not forgotten:

| Table | ID | Value | Created | Password |
|---|---:|---|---|---|
| `admins` | 17 | `p2verify-admin@example.invalid` (display name `Phase2 Verify`) | Through the running application by the super admin, for browser verification of the rebuilt shell | Placeholder stored at `/tmp/p2pw` |

It is assigned to location ID 5 (`Test Location`), which is an excluded/retained
row, so removing this admin does not disturb the retained scope. No SQL, seed or
purge has been run for it. When it is time to purge, add it to a freshly approved
plan — do not reuse or re-run the script above.
