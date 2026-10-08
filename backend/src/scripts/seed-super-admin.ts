import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source.js';

/**
 * Repeatable seed: creates one super admin from SEED_SUPER_ADMIN_EMAIL and
 * SEED_SUPER_ADMIN_PASSWORD (backend/.env). The password is hashed with
 * bcrypt before storing — the plain value is never logged, never printed
 * and never written to any committed file. Idempotent: if a row with the
 * target email/username already exists, nothing is inserted.
 */
async function main(): Promise<void> {
  const email = process.env.SEED_SUPER_ADMIN_EMAIL;
  const password = process.env.SEED_SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'SEED_SUPER_ADMIN_EMAIL and SEED_SUPER_ADMIN_PASSWORD must be set in backend/.env',
    );
  }
  const username = email.split('@')[0];

  const dataSource = await AppDataSource.initialize();
  try {
    const existing = await dataSource.query(
      'SELECT id FROM super_admins WHERE email = $1 OR username = $2',
      [email, username],
    );
    if (existing.length > 0) {
      console.log(
        `super admin already exists (id=${existing[0].id}) — skipped`,
      );
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await dataSource.query(
      `INSERT INTO super_admins
         (email, username, password_hash, first_name, last_name, is_active, is_deleted)
       VALUES ($1, $2, $3, $4, $5, true, false)
       RETURNING id`,
      [email, username, passwordHash, 'Super', 'Admin'],
    );
    console.log(`super admin created (id=${inserted[0].id}, email=${email})`);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
