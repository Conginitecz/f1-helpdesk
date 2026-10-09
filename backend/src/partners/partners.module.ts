import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partner } from './partners.entity.js';
import { MasterData } from '../master-data/master-data.entity.js';
import { StatusChangeRequest } from '../status-requests/status-requests.entity.js';
import { AdminPartnersController, PartnersController } from './partners.controller.js';
import { PartnersService } from './partners.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Partner, MasterData, StatusChangeRequest])],
  controllers: [PartnersController, AdminPartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}

