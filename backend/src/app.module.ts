import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { AdminsModule } from './admins/admins.module.js';
import { SuperAdminsModule } from './super-admins/super-admins.module.js';
import { PartnersModule } from './partners/partners.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { MasterDataModule } from './master-data/master-data.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { ConfigurationsModule } from './configurations/configurations.module.js';
import { StatusRequestsModule } from './status-requests/status-requests.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      // Neon direct (unpooled) connection — schema/migrations are unreliable
      // through the pooler. Read from environment; never hardcode.
      url: process.env.DATABASE_URL_UNPOOLED,
      // Neon requires TLS — configured explicitly on the connection.
      ssl: { rejectUnauthorized: false },
      autoLoadEntities: true,
      // Never auto-sync schema: Milestone 3+ creates schema via migrations.
      synchronize: false,
    }),
    AuthModule,
    AdminsModule,
    SuperAdminsModule,
    PartnersModule,
    LocationsModule,
    MasterDataModule,
    InventoryModule,
    ConfigurationsModule,
    StatusRequestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
