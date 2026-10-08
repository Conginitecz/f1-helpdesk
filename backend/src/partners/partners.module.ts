import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Partner } from './partners.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Partner])],
})
export class PartnersModule {}

