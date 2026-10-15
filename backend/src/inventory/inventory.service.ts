import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../admins/admins.entity.js';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { Location } from '../locations/locations.entity.js';
import { MasterData } from '../master-data/master-data.entity.js';
import { InventoryItem } from './inventory.entity.js';
import { CreateInventoryDto } from './create-inventory.dto.js';
import { UpdateInventoryDto } from './update-inventory.dto.js';

export interface InventoryResponse {
  id: number;
  name: string;
  type_id: number | null;
  category_id: number | null;
  units: number;
  price_per_unit: string;
  tax_applicable: boolean;
  tax_percentage: string | null;
  location_id: number;
  location_name: string;
  created_by_admin_id: number | null;
  created_by_super_admin_id: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryItem)
    private readonly inventoryRepo: Repository<InventoryItem>,
    @InjectRepository(Location)
    private readonly locationsRepo: Repository<Location>,
    @InjectRepository(MasterData)
    private readonly masterDataRepo: Repository<MasterData>,
    @InjectRepository(Admin)
    private readonly adminsRepo: Repository<Admin>,
  ) {}

  async findAll(locationId?: number): Promise<InventoryResponse[]> {
    const rows = await this.inventoryRepo.find({
      where: locationId !== undefined ? { location: { id: locationId } } : {},
      relations: {
        type: true,
        category: true,
        location: true,
        createdByAdmin: true,
        createdBySuperAdmin: true,
      },
      order: { id: 'ASC' },
    });

    return rows.map((row) => this.toResponse(row));
  }

  async create(
    dto: CreateInventoryDto,
    user: AuthenticatedUser,
  ): Promise<InventoryResponse> {
    if (dto.location_id === undefined || dto.location_id === null) {
      throw new BadRequestException('location_id is required for super-admin inventory creation');
    }

    const location = await this.validateLocation(dto.location_id);
    const type = await this.validateMasterData(dto.type_id, 'inventory_type');
    const category = await this.validateMasterData(dto.category_id, 'inventory_category');

    const row = this.inventoryRepo.create({
      name: dto.name.trim(),
      type: type ?? null,
      category: category ?? null,
      units: dto.units ?? 0,
      pricePerUnit: dto.price_per_unit,
      taxApplicable: dto.tax_applicable,
      taxPercentage: dto.tax_applicable ? dto.tax_percentage ?? null : null,
      location: { id: location.id } as Location,
      createdBySuperAdmin: { id: user.userId } as any,
      isActive: true,
    });

    const saved = await this.inventoryRepo.save(row);
    const reloaded = await this.findOneOrFail(saved.id);
    return this.toResponse(reloaded);
  }

  async findForAdmin(adminId: number): Promise<InventoryResponse[]> {
    const admin = await this.getAdminWithLocation(adminId);
    const rows = await this.inventoryRepo.find({
      where: { location: { id: admin.location.id } },
      relations: {
        type: true,
        category: true,
        location: true,
        createdByAdmin: true,
        createdBySuperAdmin: true,
      },
      order: { id: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async createForAdmin(
    dto: CreateInventoryDto,
    user: AuthenticatedUser,
  ): Promise<InventoryResponse> {
    const admin = await this.getAdminWithLocation(user.userId);
    const location = await this.validateLocation(admin.location.id);
    const type = await this.validateMasterData(dto.type_id, 'inventory_type');
    const category = await this.validateMasterData(dto.category_id, 'inventory_category');

    const row = this.inventoryRepo.create({
      name: dto.name.trim(),
      type: type ?? null,
      category: category ?? null,
      units: dto.units ?? 0,
      pricePerUnit: dto.price_per_unit,
      taxApplicable: dto.tax_applicable,
      taxPercentage: dto.tax_applicable ? dto.tax_percentage ?? null : null,
      location: { id: location.id } as Location,
      createdByAdmin: { id: admin.id } as Admin,
      createdBySuperAdmin: null,
      isActive: true,
    });

    const saved = await this.inventoryRepo.save(row);
    const reloaded = await this.findOneOrFail(saved.id);
    return this.toResponse(reloaded);
  }

  async update(id: number, dto: UpdateInventoryDto): Promise<InventoryResponse> {
    const row = await this.findOneOrFail(id);

    if (dto.name !== undefined) {
      row.name = dto.name.trim();
    }

    if (dto.type_id !== undefined) {
      row.type = await this.validateMasterData(dto.type_id, 'inventory_type');
    }

    if (dto.category_id !== undefined) {
      row.category = await this.validateMasterData(dto.category_id, 'inventory_category');
    }

    if (dto.units !== undefined) {
      row.units = dto.units;
    }

    if (dto.price_per_unit !== undefined) {
      row.pricePerUnit = dto.price_per_unit;
    }

    if (dto.tax_applicable !== undefined) {
      row.taxApplicable = dto.tax_applicable;
      if (!dto.tax_applicable) {
        row.taxPercentage = null;
      }
    }

    if (dto.tax_percentage !== undefined) {
      row.taxPercentage = row.taxApplicable ? dto.tax_percentage ?? null : null;
    }

    if (dto.location_id !== undefined) {
      row.location = await this.validateLocation(dto.location_id);
    }

    if (dto.is_active !== undefined) {
      row.isActive = dto.is_active;
    }

    const saved = await this.inventoryRepo.save(row);
    return this.toResponse(saved);
  }

  private async findOneOrFail(id: number): Promise<InventoryItem> {
    const row = await this.inventoryRepo.findOne({
      where: { id },
      relations: {
        type: true,
        category: true,
        location: true,
        createdByAdmin: true,
        createdBySuperAdmin: true,
      },
    });

    if (!row) {
      throw new NotFoundException(`Inventory item with id ${id} not found`);
    }

    return row;
  }

  private async validateLocation(locationId: number): Promise<Location> {
    const location = await this.locationsRepo.findOne({ where: { id: locationId } });
    if (!location || !location.isActive) {
      throw new BadRequestException(`Location with id ${locationId} is not found or inactive`);
    }
    return location;
  }

  private async getAdminWithLocation(adminId: number): Promise<Admin> {
    const admin = await this.adminsRepo.findOne({
      where: { id: adminId },
      relations: { location: true },
    });

    if (!admin || !admin.isActive || admin.isDeleted || !admin.location) {
      throw new NotFoundException(`Admin with id ${adminId} not found or unavailable`);
    }

    return admin;
  }

  private async validateMasterData(
    id: number | undefined,
    expectedType: 'inventory_type' | 'inventory_category',
  ): Promise<MasterData | null> {
    if (id === undefined) {
      return null;
    }

    const row = await this.masterDataRepo.findOne({
      where: { id, type: expectedType, isActive: true },
    });

    if (!row) {
      throw new BadRequestException(
        `${expectedType} master data row with id ${id} is not found or inactive`,
      );
    }

    return row;
  }

  private toResponse(row: InventoryItem): InventoryResponse {
    return {
      id: row.id,
      name: row.name,
      type_id: row.type?.id ?? null,
      category_id: row.category?.id ?? null,
      units: row.units,
      price_per_unit: String(row.pricePerUnit),
      tax_applicable: row.taxApplicable,
      tax_percentage: row.taxPercentage !== null && row.taxPercentage !== undefined ? String(row.taxPercentage) : null,
      location_id: row.location.id,
      location_name: row.location.name,
      created_by_admin_id: row.createdByAdmin?.id ?? null,
      created_by_super_admin_id: row.createdBySuperAdmin?.id ?? null,
      is_active: row.isActive,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };
  }
}
