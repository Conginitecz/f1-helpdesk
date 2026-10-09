import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from '../locations/locations.entity.js';
import { MasterData } from '../master-data/master-data.entity.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryItem } from './inventory.entity.js';
import { InventoryService } from './inventory.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem, Location, MasterData])],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}

