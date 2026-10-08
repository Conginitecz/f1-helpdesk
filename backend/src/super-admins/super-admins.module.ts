import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuperAdmin } from './super-admins.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([SuperAdmin])],
})
export class SuperAdminsModule {}
