import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../admins/admins.entity.js';
import { Location } from '../locations/locations.entity.js';
import { MasterData } from '../master-data/master-data.entity.js';
import { AdminInventoryController, InventoryController } from './inventory.controller.js';
import { InventoryItem } from './inventory.entity.js';
import { InventoryService } from './inventory.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, Location, MasterData, Admin])],
  controllers: [InventoryController, AdminInventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}

