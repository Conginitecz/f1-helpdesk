import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partner } from './partners.entity.js';
import { MasterData } from '../master-data/master-data.entity.js';
import { PartnersController } from './partners.controller.js';
import { PartnersService } from './partners.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Partner, MasterData])],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}

