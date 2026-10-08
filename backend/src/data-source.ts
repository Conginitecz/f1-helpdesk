import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * TypeORM data source for CLI tasks (migration:generate / migration:run /
 * migration:revert) and seed scripts. Uses the Neon DIRECT (unpooled)
 * connection — schema work is unreliable through the pooler.
 * synchronize stays false: schema changes go through migrations only.
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL_UNPOOLED,
  ssl: { rejectUnauthorized: true },
  synchronize: false,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
