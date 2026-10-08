import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminsService } from './admins.service.js';
import type { AdminResponse } from './admins.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/roles.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CreateAdminDto } from './create-admin.dto.js';

/**
 * Super-admin-only admin management (docs §3).
 * Guards: JwtAuthGuard (valid token) then RolesGuard (role must be super_admin).
 * Applied at class level so every route is covered.
 */
@Controller('super-admin/admins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get()
  findAll(): Promise<AdminResponse[]> {
    return this.adminsService.findAll();
  }

  @Post()
  create(
    @Body() dto: CreateAdminDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AdminResponse> {
    return this.adminsService.create(dto, user.userId);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number): Promise<AdminResponse> {
    return this.adminsService.activate(id);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number): Promise<AdminResponse> {
    return this.adminsService.deactivate(id);
  }
}
