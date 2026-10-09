import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Role } from '../auth/roles.enum.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateMasterDataDto } from './create-master-data.dto.js';
import { MasterDataService } from './master-data.service.js';
import type { MasterDataResponse } from './master-data.service.js';
import { UpdateMasterDataDto } from './update-master-data.dto.js';

@Controller('super-admin/master-data')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class MasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get()
  findAll(@Query('type') type?: string): Promise<MasterDataResponse[]> {
    return this.masterDataService.findAll(type);
  }

  @Post()
  create(@Body() dto: CreateMasterDataDto): Promise<MasterDataResponse> {
    return this.masterDataService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMasterDataDto,
  ): Promise<MasterDataResponse> {
    return this.masterDataService.update(id, dto);
  }
}

@Controller('admin/master-data')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminMasterDataController {
  constructor(private readonly masterDataService: MasterDataService) {}

  @Get()
  findActive(@Query('type') type?: string): Promise<MasterDataResponse[]> {
    return this.masterDataService.findActive(type);
  }
}