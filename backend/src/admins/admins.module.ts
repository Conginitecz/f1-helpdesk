import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './admins.entity.js';
import { Location } from '../locations/locations.entity.js';
import { AdminsController } from './admins.controller.js';
import { AdminsService } from './admins.service.js';
import { AuthModule } from '../auth/auth.module.js';

/** Admin management. AuthModule supplies JwtAuthGuard + RolesGuard. */
@Module({
  imports: [TypeOrmModule.forFeature([Admin, Location]), AuthModule],
  controllers: [AdminsController],
  providers: [AdminsService],
  exports: [AdminsService],
})
export class AdminsModule {}
