import 'dotenv/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module.js';

async function bootstrap() {
  if (!process.env.DATABASE_URL_UNPOOLED) {
    throw new Error('DATABASE_URL_UNPOOLED is not set in the environment (.env)');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not set in the environment (.env)');
  }
  const app = await NestFactory.create(AppModule);
  // Validates + strips DTOs globally (class-validator/class-transformer).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(`F1 Help Desk backend listening on port ${port}`);
  const dataSource = app.get(DataSource);
  Logger.log(`Database connection established: ${dataSource.isInitialized}`);
}
await bootstrap();
