import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Location } from './locations.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Location])],
})
export class LocationsModule {}
