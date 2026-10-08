import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryItem } from './inventory.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([InventoryItem])],
})
export class InventoryModule {}

