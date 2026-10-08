import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuration } from './configurations.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Configuration])],
})
export class ConfigurationsModule {}

