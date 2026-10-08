import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module.js';

async function bootstrap() {
  if (!process.env.DATABASE_URL_UNPOOLED) {
    throw new Error('DATABASE_URL_UNPOOLED is not set in the environment (.env)');
  }
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`F1 Help Desk backend listening on port ${port}`);
  const dataSource = app.get(DataSource);
  console.log(`Database connection established: ${dataSource.isInitialized}`);
}
await bootstrap();
