import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusChangeRequest } from './status-requests.entity.js';
import { Partner } from '../partners/partners.entity.js';
import { AdminStatusRequestsController, StatusRequestsController } from './status-requests.controller.js';
import { StatusRequestsService } from './status-requests.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([StatusChangeRequest, Partner])],
  controllers: [StatusRequestsController, AdminStatusRequestsController],
  providers: [StatusRequestsService],
})
export class StatusRequestsModule {}

