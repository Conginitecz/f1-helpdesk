import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MasterData } from './master-data.entity.js';
import { AdminMasterDataController, MasterDataController } from './master-data.controller.js';
import { MasterDataService } from './master-data.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([MasterData])],
  controllers: [MasterDataController, AdminMasterDataController],
  providers: [MasterDataService],
})
export class MasterDataModule {}
