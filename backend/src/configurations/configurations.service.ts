import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';
import { Configuration } from './configurations.entity.js';
import { CreateConfigurationDto } from './create-configuration.dto.js';
import { UpdateConfigurationDto } from './update-configuration.dto.js';

const EDITABLE_CONFIGURATION_KEYS = new Set([
  'session_idle_timeout_minutes',
  'max_vendor_attachment_mb',
  'default_timezone',
]);

export interface ConfigurationResponse {
  id: number;
  config_key: string;
  config_value: string;
  description: string | null;
  updated_by_super_admin_id: number | null;
  updated_at: Date;
}

@Injectable()
export class ConfigurationsService {
  constructor(
    @InjectRepository(Configuration)
    private readonly configurationsRepo: Repository<Configuration>,
  ) {}

  async findAll(): Promise<ConfigurationResponse[]> {
    const rows = await this.configurationsRepo.find({ order: { configKey: 'ASC' } });
    return rows.map((row) => this.toResponse(row));
  }

  async create(dto: CreateConfigurationDto, superAdminId: number): Promise<ConfigurationResponse> {
    this.assertEditableKey(dto.key);
    const existing = await this.configurationsRepo.findOne({
      where: { configKey: dto.key },
    });
    if (existing) {
      throw new ConflictException(`Configuration key ${dto.key} already exists`);
    }

    const row = this.configurationsRepo.create({
      configKey: dto.key,
      configValue: dto.value,
      description: dto.description ?? null,
      updatedBySuperAdmin: { id: superAdminId } as SuperAdmin,
    });
    const saved = await this.configurationsRepo.save(row);
    return this.toResponse(saved, superAdminId);
  }

  async update(
    key: string,
    dto: UpdateConfigurationDto,
    superAdminId: number,
  ): Promise<ConfigurationResponse> {
    this.assertEditableKey(key);
    const row = await this.configurationsRepo.findOne({ where: { configKey: key } });
    if (!row) {
      throw new NotFoundException(`Configuration key ${key} not found`);
    }

    row.configValue = dto.config_value;
    row.updatedBySuperAdmin = { id: superAdminId } as SuperAdmin;
    const saved = await this.configurationsRepo.save(row);
    return this.toResponse(saved, superAdminId);
  }

  private assertEditableKey(key: string): void {
    if (!EDITABLE_CONFIGURATION_KEYS.has(key)) {
      throw new BadRequestException(`Configuration key ${key} is not editable`);
    }
  }

  private toResponse(row: Configuration, updaterId?: number): ConfigurationResponse {
    return {
      id: row.id,
      config_key: row.configKey,
      config_value: row.configValue,
      description: row.description,
      updated_by_super_admin_id: updaterId ?? row.updatedBySuperAdminId ?? null,
      updated_at: row.updatedAt,
    };
  }
}
