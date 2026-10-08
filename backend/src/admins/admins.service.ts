import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { Admin } from './admins.entity.js';
import { CreateAdminDto } from './create-admin.dto.js';
import { Location } from '../locations/locations.entity.js';

/**
 * Public shape of an admin. Built by an explicit whitelist in toResponse(), so
 * password_hash can never leak, even if the entity gains fields later.
 */
export interface AdminResponse {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  address: string;
  location_id: number | null;
  is_active: boolean;
  is_deleted: boolean;
  created_by_super_admin_id: number | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Columns read for every admin response. password_hash is deliberately absent,
 * and the relations are limited to their ids (the super admin's own row,
 * including its hash, is never loaded).
 */
const ADMIN_READ_OPTIONS = {
  relations: { location: true, createdBySuperAdmin: true },
  select: {
    id: true,
    email: true,
    username: true,
    firstName: true,
    lastName: true,
    phoneNumber: true,
    address: true,
    isActive: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true,
    location: { id: true },
    createdBySuperAdmin: { id: true },
  },
} as const;

/**
 * Super-admin admin management.
 * - Password hashed with bcryptjs (same library auth uses to verify it).
 * - location_id must reference an existing AND active location.
 * - Duplicate email or username -> 409 (both are UNIQUE per docs §1.2).
 * - created_by_super_admin_id is filled from the authenticated super admin,
 *   never from the request body.
 */
@Injectable()
export class AdminsService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminsRepo: Repository<Admin>,
    @InjectRepository(Location)
    private readonly locationsRepo: Repository<Location>,
  ) {}

  async findAll(): Promise<AdminResponse[]> {
    const admins = await this.adminsRepo.find({
      ...ADMIN_READ_OPTIONS,
      order: { id: 'ASC' },
    });
    return admins.map((admin) => this.toResponse(admin));
  }

  async create(
    dto: CreateAdminDto,
    createdBySuperAdminId: number,
  ): Promise<AdminResponse> {
    await this.assertIdentityAvailable(dto.email, dto.username);

    const location = await this.locationsRepo.findOne({
      where: { id: dto.location_id },
    });
    if (!location || !location.isActive) {
      throw new BadRequestException(
        `location_id ${dto.location_id} does not exist or is not active`,
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const saved = await this.adminsRepo.save(
        this.adminsRepo.create({
          email: dto.email,
          username: dto.username,
          passwordHash,
          firstName: dto.first_name,
          lastName: dto.last_name,
          phoneNumber: dto.phone_number,
          address: dto.address,
          location,
          isActive: true,
          isDeleted: false,
          createdBySuperAdmin: { id: createdBySuperAdminId },
        }),
      );
      return this.toResponse(saved);
    } catch (error) {
      // Backstop for a race between the pre-check above and the insert.
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'An admin with this email or username already exists',
        );
      }
      throw error;
    }
  }

  /** Sets is_active=true. No-op (no write, no error) if already active. */
  async activate(id: number): Promise<AdminResponse> {
    return this.setActive(id, true);
  }

  /** Sets is_active=false. No-op (no write, no error) if already inactive. */
  async deactivate(id: number): Promise<AdminResponse> {
    return this.setActive(id, false);
  }

  private async setActive(id: number, isActive: boolean): Promise<AdminResponse> {
    const admin = await this.findOneOrFail(id);
    if (admin.isActive !== isActive) {
      admin.isActive = isActive;
      // updated_at is refreshed by TypeORM's @UpdateDateColumn on this save.
      await this.adminsRepo.save(admin);
    }
    return this.toResponse(admin);
  }

  private async findOneOrFail(id: number): Promise<Admin> {
    const admin = await this.adminsRepo.findOne({
      ...ADMIN_READ_OPTIONS,
      where: { id },
    });
    if (!admin) {
      throw new NotFoundException(`Admin with id ${id} not found`);
    }
    return admin;
  }

  private async assertIdentityAvailable(email: string, username: string): Promise<void> {
    const byEmail = await this.adminsRepo.findOne({ where: { email } });
    if (byEmail) {
      throw new ConflictException('An admin with this email already exists');
    }
    const byUsername = await this.adminsRepo.findOne({ where: { username } });
    if (byUsername) {
      throw new ConflictException('An admin with this username already exists');
    }
  }

  private toResponse(admin: Admin): AdminResponse {
    return {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      first_name: admin.firstName,
      last_name: admin.lastName,
      phone_number: admin.phoneNumber,
      address: admin.address,
      location_id: admin.location?.id ?? null,
      is_active: admin.isActive,
      is_deleted: admin.isDeleted,
      created_by_super_admin_id: admin.createdBySuperAdmin?.id ?? null,
      created_at: admin.createdAt,
      updated_at: admin.updatedAt,
    };
  }
}

/** Postgres unique_violation (23505), from either the wrapper or the driver error. */
function isUniqueViolation(error: unknown): boolean {
  const code =
    (error as { code?: string })?.code ??
    (error as { driverError?: { code?: string } })?.driverError?.code;
  return code === '23505';
}
