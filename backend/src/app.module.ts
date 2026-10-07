import { Module } from '@nestjs/common';
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
