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
import { LocationsService } from './locations.service.js';
import type { LocationResponse } from './locations.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/roles.enum.js';
import { CreateLocationDto } from './create-location.dto.js';
import { UpdateLocationDto } from './update-location.dto.js';

/**
 * Super-admin-only location management (docs §3).
 * Guards: JwtAuthGuard (valid token) then RolesGuard (role must be super_admin).
 */
@Controller('super-admin/locations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get()
  findAll(): Promise<LocationResponse[]> {
    return this.locationsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateLocationDto): Promise<LocationResponse> {
    return this.locationsService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLocationDto,
  ): Promise<LocationResponse> {
    return this.locationsService.update(id, dto);
  }
}
