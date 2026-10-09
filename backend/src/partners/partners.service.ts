import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MasterData } from '../master-data/master-data.entity.js';
import { Partner } from './partners.entity.js';

const PARTNER_TYPE_CODES = {
  vendor: 'q7Kf2mZ9xRw4tB6y',
  engineer: 'h3Np8Ld1Qs5Vc2Jw',
} as const;

export interface PartnerResponse {
  id: number;
  partner_type_id: number;
  name: string;
  phone_number: string;
  email: string | null;
  address: string | null;
  skill_id: number | null;
  category_id: number | null;
  reference_type_id: number | null;
  reference_id: number | null;
  is_active: boolean;
  is_deleted: boolean;
  created_by_admin_id: number;
  created_at: Date;
  updated_at: Date;
}

const PARTNER_READ_OPTIONS = {
  relations: {
    partnerType: true,
    skill: true,
    category: true,
    referenceType: true,
    createdByAdmin: true,
  },
  select: {
    id: true,
    name: true,
    phoneNumber: true,
    email: true,
    address: true,
    referenceId: true,
    isActive: true,
    isDeleted: true,
    createdAt: true,
    updatedAt: true,
    partnerType: { id: true },
    skill: { id: true },
    category: { id: true },
    referenceType: { id: true },
    createdByAdmin: { id: true },
  },
} as const;

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnersRepo: Repository<Partner>,
    @InjectRepository(MasterData)
    private readonly masterDataRepo: Repository<MasterData>,
  ) {}

  async findAll(type?: string): Promise<PartnerResponse[]> {
    let partnerTypeId: number | undefined;
    if (type !== undefined) {
      if (type !== 'vendor' && type !== 'engineer') {
        throw new BadRequestException('type must be vendor or engineer');
      }
      const code = PARTNER_TYPE_CODES[type];
      const typeRow = await this.masterDataRepo.findOne({
        where: { type: 'partner_type', text: code },
      });
      if (!typeRow) {
        throw new NotFoundException('Core partner type code is missing from master_data');
      }
      partnerTypeId = typeRow.id;
    }

    const rows = await this.partnersRepo.find({
      ...PARTNER_READ_OPTIONS,
      where: partnerTypeId === undefined ? undefined : { partnerType: { id: partnerTypeId } },
      order: { id: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async setActive(id: number, isActive: boolean): Promise<PartnerResponse> {
    const row = await this.partnersRepo.findOne({
      ...PARTNER_READ_OPTIONS,
      where: { id },
    });
    if (!row) {
      throw new NotFoundException(`Partner with id ${id} not found`);
    }
    row.isActive = isActive;
    const saved = await this.partnersRepo.save(row);
    return this.toResponse(saved);
  }

  private toResponse(row: Partner): PartnerResponse {
    return {
      id: row.id,
      partner_type_id: row.partnerType.id,
      name: row.name,
      phone_number: row.phoneNumber,
      email: row.email,
      address: row.address,
      skill_id: row.skill?.id ?? null,
      category_id: row.category?.id ?? null,
      reference_type_id: row.referenceType?.id ?? null,
      reference_id: row.referenceId,
      is_active: row.isActive,
      is_deleted: row.isDeleted,
      created_by_admin_id: row.createdByAdmin.id,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };
  }
}