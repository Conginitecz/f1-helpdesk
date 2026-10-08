import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatusChangeRequest } from './status-requests.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([StatusChangeRequest])],
})
export class StatusRequestsModule {}

