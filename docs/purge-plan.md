# Purge Plan (Approval Required)

This file is a proposal only. No purge was run. Do not change `dry_run` to `false` or execute this script until the owner approves the exact target and rows.

## Backup First

Before any approved purge, export the target Neon database/branch and retain the export outside the repository. Example using the configured unpooled URL from a secure local shell:

```sh
pg_dump "$DATABASE_URL_UNPOOLED" --format=custom --file="$HOME/f1-helpdesk-before-test-purge.dump"
```

Confirm the connection targets the intended Neon project, branch, database, and role. Do not paste or commit the connection string.

## Proposed Scope

The script touches only IDs already listed in `docs/completed-checklist.md` under **Test data to purge before demo**. Counts below are expected counts at the time this plan was prepared; the dry run must show the same rows before any approved deletion.

| Table | IDs | Expected count |
|---|---|---:|
| `configurations` | 1, 2, 4 | 3 |
| `master_data` | 5, 6 | 2 |
| `locations` | 4-16 | 13 |
| `admins` | 6-16 | 11 |
| `partners` | 5-25 | 21 |
| `status_change_requests` | 1-11 | 11 |
| `inventory_items` | 1-11 | 11 |
| **Total** | | **72** |

The script intentionally excludes the super-admin row, all seeded core master-data rows (IDs 1-4), seeded demo inventory types (IDs 7-9), and every ID not listed above. Keep IDs 7-9 active for the inventory demo baseline.

## Proposed SQL

Run with `psql` only after explicit approval. The default `dry_run` value prints the exact matching rows and counts, then rolls back without deleting anything. For an approved purge only, the operator must deliberately set `dry_run` to `false` and inspect the target connection first.

```sql
\set dry_run true
BEGIN;

SELECT 'configurations' AS table_name, id, config_key AS record FROM configurations WHERE id = ANY(ARRAY[1, 2, 4]);
SELECT 'master_data' AS table_name, id, type || ':' || text AS record FROM master_data WHERE id = ANY(ARRAY[5, 6]);
SELECT 'locations' AS table_name, id, name AS record FROM locations WHERE id = ANY(ARRAY[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
SELECT 'admins' AS table_name, id, email AS record FROM admins WHERE id = ANY(ARRAY[6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
SELECT 'partners' AS table_name, id, name AS record FROM partners WHERE id = ANY(ARRAY[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]);
SELECT 'status_change_requests' AS table_name, id, entity_type || ':' || entity_id || ':' || requested_action || ':' || status AS record FROM status_change_requests WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
SELECT 'inventory_items' AS table_name, id, name AS record FROM inventory_items WHERE id = ANY(ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);

SELECT 'configurations' AS table_name, count(*) AS matched FROM configurations WHERE id = ANY(ARRAY[1, 2, 4])
UNION ALL SELECT 'master_data', count(*) FROM master_data WHERE id = ANY(ARRAY[5, 6])
UNION ALL SELECT 'locations', count(*) FROM locations WHERE id = ANY(ARRAY[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
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
  DELETE FROM locations WHERE id = ANY(ARRAY[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
  DELETE FROM master_data WHERE id = ANY(ARRAY[5, 6]);
  DELETE FROM configurations WHERE id = ANY(ARRAY[1, 2, 4]);
  COMMIT;
\endif
```

Do not run this proposal in this milestone. The owner must approve the target and dry-run output first.
