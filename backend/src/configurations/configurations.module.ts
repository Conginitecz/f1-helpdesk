import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Configuration } from './configurations.entity.js';
import { ConfigurationsController } from './configurations.controller.js';
import { ConfigurationsService } from './configurations.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Configuration])],
  controllers: [ConfigurationsController],
  providers: [ConfigurationsService],
})
export class ConfigurationsModule {}

