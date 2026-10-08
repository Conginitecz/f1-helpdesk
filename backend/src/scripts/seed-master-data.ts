import 'dotenv/config';
import { AppDataSource } from '../data-source.js';

/**
 * Repeatable seed for the core master_data rows the application logic
 * depends on (docs/development-docs.md §1.4):
 *   - partner_type:    vendor + engineer
 *   - reference_type:  admin + vendor
 *
 * The docs require opaque, non-human-readable codes (the `text` values);
 * meaning lives in this script and in docs/completed-checklist.md (IDs),
 * never in the token itself. Idempotent: safe to run twice — rows are
 * only inserted when an identical (type, text) pair is absent.
 */
const CORE_ROWS: ReadonlyArray<{ key: string; type: string; text: string }> = [
  { key: 'partner_vendor', type: 'partner_type', text: 'q7Kf2mZ9xRw4tB6y' },
  { key: 'partner_engineer', type: 'partner_type', text: 'h3Np8Ld1Qs5Vc2Jw' },
  { key: 'reference_admin', type: 'reference_type', text: 'z9Wm4Yt7Bn2kF8xR' },
  { key: 'reference_vendor', type: 'reference_type', text: 'd6Rq1Ae3Uv9sH5pM' },
];

async function main(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  try {
    for (const row of CORE_ROWS) {
      const inserted = await dataSource.query(
        `INSERT INTO master_data (type, text, is_active)
         SELECT $1::varchar, $2::varchar, true
         WHERE NOT EXISTS (
           SELECT 1 FROM master_data WHERE type = $1::varchar AND text = $2::varchar
         )
         RETURNING id`,
        [row.type, row.text],
      );
      if (inserted.length > 0) {
        console.log(
          `inserted ${row.type} / ${row.key} -> id=${inserted[0].id}`,
        );
      } else {
        console.log(`already present ${row.type} / ${row.key} — skipped`);
      }
    }
    const rows = await dataSource.query(
      `SELECT id, type, text, is_active FROM master_data
       WHERE type IN ('partner_type', 'reference_type')
       ORDER BY type, id`,
    );
    console.log('core master_data rows now in the database:');
    console.log(JSON.stringify(rows, null, 2));
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
