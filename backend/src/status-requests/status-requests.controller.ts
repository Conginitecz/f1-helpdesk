import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Role } from '../auth/roles.enum.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { StatusRequestsService } from './status-requests.service.js';
import type { StatusRequestResponse } from './status-requests.service.js';

@Controller('super-admin/status-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class StatusRequestsController {
  constructor(private readonly statusRequestsService: StatusRequestsService) {}

  @Get()
  findAll(): Promise<StatusRequestResponse[]> {
    return this.statusRequestsService.findAll();
  }

  @Patch(':id/approve')
  approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StatusRequestResponse> {
    return this.statusRequestsService.approve(id, user.userId);
  }

  @Patch(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StatusRequestResponse> {
    return this.statusRequestsService.reject(id, user.userId);
  }
}

@Controller('admin/status-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminStatusRequestsController {
  constructor(private readonly statusRequestsService: StatusRequestsService) {}

  @Get()
  findForAdmin(@CurrentUser() user: AuthenticatedUser): Promise<StatusRequestResponse[]> {
    return this.statusRequestsService.findForAdmin(user.userId);
  }
}