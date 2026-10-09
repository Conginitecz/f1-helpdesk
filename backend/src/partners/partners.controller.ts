import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Role } from '../auth/roles.enum.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreatePartnerDto } from './create-partner.dto.js';
import { RequestStatusChangeDto } from './request-status-change.dto.js';
import { PartnersService } from './partners.service.js';
import type { PartnerResponse } from './partners.service.js';
import type { StatusRequestResponse } from '../status-requests/status-requests.service.js';

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

@Controller('admin/partners')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminPartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Get()
  findForAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Query('type') type?: string,
  ): Promise<PartnerResponse[]> {
    return this.partnersService.findForAdmin(user.userId, type);
  }

  @Post()
  create(
    @Body() dto: CreatePartnerDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PartnerResponse> {
    return this.partnersService.createForAdmin(dto, user.userId);
  }

  @Post(':vendorPartnerId/service-engineers')
  createEngineerUnderVendor(
    @Param('vendorPartnerId', ParseIntPipe) vendorPartnerId: number,
    @Body() dto: Omit<CreatePartnerDto, 'type'>,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PartnerResponse> {
    return this.partnersService.createEngineerForVendor(user.userId, vendorPartnerId, dto);
  }

  @Post(':id/request-status-change')
  requestStatusChange(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RequestStatusChangeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<StatusRequestResponse> {
    return this.partnersService.requestStatusChange(user.userId, id, dto.action);
  }
}