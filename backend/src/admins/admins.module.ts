import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admins.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
})
export class AdminsModule {}
