import 'dotenv/config';
import { AppDataSource } from '../data-source.js';

async function main(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  try {
    await dataSource.query(
      `INSERT INTO configurations (config_key, config_value)
       VALUES ($1, $2)
       ON CONFLICT (config_key) DO NOTHING`,
      ['min_service_charge', '500'],
    );
    console.log(
      'Configuration seed completed; existing values were preserved.',
    );
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  console.error('Configuration seed failed');
  if (error instanceof Error) {
    console.error(error.message);
  }
  process.exitCode = 1;
});
