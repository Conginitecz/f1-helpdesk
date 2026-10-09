import { Controller, Get, Param, ParseIntPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Role } from '../auth/roles.enum.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { PartnersService } from './partners.service.js';
import type { PartnerResponse } from './partners.service.js';

@Controller('super-admin/partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findAll(@Query('type') type?: string): Promise<PartnerResponse[]> {
    return this.partnersService.findAll(type);
  }

  @Patch(':id/activate')
  activate(@Param('id', ParseIntPipe) id: number): Promise<PartnerResponse> {
    return this.partnersService.setActive(id, true);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id', ParseIntPipe) id: number): Promise<PartnerResponse> {
    return this.partnersService.setActive(id, false);
  }
}