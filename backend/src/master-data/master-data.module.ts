import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterData } from './master-data.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([MasterData])],
})
export class MasterDataModule {}
