import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Role } from '../auth/roles.enum.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ConfigurationsService } from './configurations.service.js';
import type { ConfigurationResponse } from './configurations.service.js';
import { CreateConfigurationDto } from './create-configuration.dto.js';
import { UpdateConfigurationDto } from './update-configuration.dto.js';

@Controller('super-admin/config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class ConfigurationsController {
  constructor(private readonly configurationsService: ConfigurationsService) {}

  @Get()
  findAll(): Promise<ConfigurationResponse[]> {
    return this.configurationsService.findAll();
  }

  @Post()
  create(
    @Body() dto: CreateConfigurationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConfigurationResponse> {
    return this.configurationsService.create(dto, user.userId);
  }

  @Patch(':key')
  update(
    @Param('key') key: string,
    @Body() dto: UpdateConfigurationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConfigurationResponse> {
    return this.configurationsService.update(key, dto, user.userId);
  }
}