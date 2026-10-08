import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Location } from './locations.entity.js';
import { CreateLocationDto } from './create-location.dto.js';
import { UpdateLocationDto } from './update-location.dto.js';

/** Public shape of a location (explicit whitelist, snake_case like the other API responses). */
export interface LocationResponse {
  id: number;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Super-admin location management (docs §1.3, §3).
 * - Names are NOT unique in the docs (`name VARCHAR NOT NULL` only), so
 *   duplicate names are allowed; no uniqueness rule is invented here.
 * - locations has no created_by/updated_by columns, so there are no audit
 *   columns to fill; updated_at is maintained by TypeORM.
 */
@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private readonly locationsRepo: Repository<Location>,
  ) {}

  async findAll(): Promise<LocationResponse[]> {
    const locations = await this.locationsRepo.find({ order: { id: 'ASC' } });
    return locations.map((location) => this.toResponse(location));
  }

  async create(dto: CreateLocationDto): Promise<LocationResponse> {
    const saved = await this.locationsRepo.save(
      this.locationsRepo.create({ name: dto.name, isActive: true }),
    );
    return this.toResponse(saved);
  }

  async update(id: number, dto: UpdateLocationDto): Promise<LocationResponse> {
    const location = await this.findOneOrFail(id);
    if (dto.name !== undefined) {
      location.name = dto.name;
    }
    if (dto.is_active !== undefined) {
      location.isActive = dto.is_active;
    }
    const saved = await this.locationsRepo.save(location);
    return this.toResponse(saved);
  }

  private async findOneOrFail(id: number): Promise<Location> {
    const location = await this.locationsRepo.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Location with id ${id} not found`);
    }
    return location;
  }

  private toResponse(location: Location): LocationResponse {
    return {
      id: location.id,
      name: location.name,
      is_active: location.isActive,
      created_at: location.createdAt,
      updated_at: location.updatedAt,
    };
  }
}
