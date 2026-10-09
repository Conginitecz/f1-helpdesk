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
import { CurrentUser } from '../auth/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Role } from '../auth/roles.enum.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { CreateInventoryDto } from './create-inventory.dto.js';
import { UpdateInventoryDto } from './update-inventory.dto.js';
import { InventoryResponse, InventoryService } from './inventory.service.js';

@Controller('super-admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  findAll(
    @Query('location_id', new ParseIntPipe({ optional: true })) locationId?: number,
  ): Promise<InventoryResponse[]> {
    return this.inventoryService.findAll(locationId);
  }

  @Post()
  create(
    @Body() dto: CreateInventoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InventoryResponse> {
    return this.inventoryService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInventoryDto,
  ): Promise<InventoryResponse> {
    return this.inventoryService.update(id, dto);
  }
}
