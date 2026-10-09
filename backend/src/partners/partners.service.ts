import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MasterData } from '../master-data/master-data.entity.js';
import { StatusChangeRequest } from '../status-requests/status-requests.entity.js';
import type { StatusRequestResponse } from '../status-requests/status-requests.service.js';
import { Partner } from './partners.entity.js';

const PARTNER_TYPE_CODES = {
  vendor: 'q7Kf2mZ9xRw4tB6y',
  engineer: 'h3Np8Ld1Qs5Vc2Jw',
} as const;

const REFERENCE_TYPE_CODES = {
  admin: 'z9Wm4Yt7Bn2kF8xR',
  vendor: 'd6Rq1Ae3Uv9sH5pM',
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

export interface CreatePartnerPayload {
  name: string;
  phone_number: string;
  email?: string | null;
  address?: string | null;
  skill_id?: number | null;
  category_id?: number | null;
  type: 'vendor' | 'engineer';
}

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private readonly partnersRepo: Repository<Partner>,
    @InjectRepository(MasterData)
    private readonly masterDataRepo: Repository<MasterData>,
    @InjectRepository(StatusChangeRequest)
    private readonly statusRequestsRepo: Repository<StatusChangeRequest>,
  ) {}

  async findAll(type?: string): Promise<PartnerResponse[]> {
    let partnerTypeId: number | undefined;
    if (type !== undefined) {
      if (type !== 'vendor' && type !== 'engineer') {
        throw new BadRequestException('type must be vendor or engineer');
      }
      partnerTypeId = await this.resolvePartnerTypeId(type);
    }

    const rows = await this.partnersRepo.find({
      ...PARTNER_READ_OPTIONS,
      where: partnerTypeId === undefined ? undefined : { partnerType: { id: partnerTypeId } },
      order: { id: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findForAdmin(adminId: number, type?: string): Promise<PartnerResponse[]> {
    if (type !== undefined && type !== 'vendor' && type !== 'engineer') {
      throw new BadRequestException('type must be vendor or engineer');
    }

    const vendorTypeId = await this.resolvePartnerTypeId('vendor');
    const engineerTypeId = await this.resolvePartnerTypeId('engineer');
    const vendorReferenceTypeId = await this.resolveReferenceTypeId('vendor');

    const vendorIds = (
      await this.partnersRepo.find({
        where: {
          partnerType: { id: vendorTypeId },
          createdByAdmin: { id: adminId },
        },
        select: { id: true },
      })
    ).map((row) => row.id);

    const rows: Partner[] = [];
    if (type === undefined || type === 'vendor') {
      rows.push(
        ...(await this.partnersRepo.find({
          ...PARTNER_READ_OPTIONS,
          where: {
            partnerType: { id: vendorTypeId },
            createdByAdmin: { id: adminId },
          },
          order: { id: 'ASC' },
        })),
      );
    }

    if (type === undefined || type === 'engineer') {
      rows.push(
        ...(await this.partnersRepo.find({
          ...PARTNER_READ_OPTIONS,
          where: {
            partnerType: { id: engineerTypeId },
            createdByAdmin: { id: adminId },
          },
          order: { id: 'ASC' },
        })),
      );

      if (vendorIds.length > 0) {
        rows.push(
          ...(await this.partnersRepo.find({
            ...PARTNER_READ_OPTIONS,
            where: {
              partnerType: { id: engineerTypeId },
              referenceType: { id: vendorReferenceTypeId },
              referenceId: In(vendorIds),
            },
            order: { id: 'ASC' },
          })),
        );
      }
    }

    const uniqueRows = new Map<number, Partner>();
    rows.forEach((row) => uniqueRows.set(row.id, row));
    return [...uniqueRows.values()].sort((a, b) => a.id - b.id).map((row) => this.toResponse(row));
  }

  async createForAdmin(dto: CreatePartnerPayload, adminId: number): Promise<PartnerResponse> {
    const partnerTypeId = await this.resolvePartnerTypeId(dto.type);
    const row = this.partnersRepo.create({
      name: dto.name,
      phoneNumber: dto.phone_number,
      email: dto.email ?? null,
      address: dto.address ?? null,
      skill: dto.skill_id ? ({ id: dto.skill_id } as MasterData) : null,
      category: dto.category_id ? ({ id: dto.category_id } as MasterData) : null,
      partnerType: { id: partnerTypeId },
      createdByAdmin: { id: adminId },
      isActive: true,
      isDeleted: false,
      referenceType: null,
      referenceId: null,
    });

    if (dto.type === 'engineer') {
      const adminReferenceTypeId = await this.resolveReferenceTypeId('admin');
      row.referenceType = { id: adminReferenceTypeId } as MasterData;
      row.referenceId = adminId;
    }

    const saved = await this.partnersRepo.save(row);
    return this.toResponse(saved);
  }

  async createEngineerForVendor(
    adminId: number,
    vendorPartnerId: number,
    dto: {
      name: string;
      phone_number: string;
      email?: string | null;
      address?: string | null;
      skill_id?: number | null;
      category_id?: number | null;
    },
  ): Promise<PartnerResponse> {
    const vendorTypeId = await this.resolvePartnerTypeId('vendor');
    const vendor = await this.partnersRepo.findOne({
      where: {
        id: vendorPartnerId,
        partnerType: { id: vendorTypeId },
        createdByAdmin: { id: adminId },
      },
      relations: { partnerType: true, createdByAdmin: true },
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor partner with id ${vendorPartnerId} not found`);
    }

    const engineerTypeId = await this.resolvePartnerTypeId('engineer');
    const vendorReferenceTypeId = await this.resolveReferenceTypeId('vendor');
    const row = this.partnersRepo.create({
      name: dto.name,
      phoneNumber: dto.phone_number,
      email: dto.email ?? null,
      address: dto.address ?? null,
      skill: dto.skill_id ? ({ id: dto.skill_id } as MasterData) : null,
      category: dto.category_id ? ({ id: dto.category_id } as MasterData) : null,
      partnerType: { id: engineerTypeId },
      referenceType: { id: vendorReferenceTypeId },
      referenceId: vendor.id,
      createdByAdmin: { id: adminId },
      isActive: true,
      isDeleted: false,
    });

    const saved = await this.partnersRepo.save(row);
    return this.toResponse(saved);
  }

  async requestStatusChange(
    adminId: number,
    partnerId: number,
    action: 'activate' | 'deactivate',
  ): Promise<StatusRequestResponse> {
    const partner = await this.partnersRepo.findOne({
      ...PARTNER_READ_OPTIONS,
      where: {
        id: partnerId,
        createdByAdmin: { id: adminId },
      },
    });
    if (!partner) {
      throw new NotFoundException(`Partner with id ${partnerId} not found`);
    }

    const engineerTypeId = await this.resolvePartnerTypeId('engineer');
    if (partner.partnerType.id !== engineerTypeId) {
      throw new BadRequestException('Only service engineer rows can request a status change');
    }

    const request = this.statusRequestsRepo.create({
      entityType: 'partner',
      entityId: partner.id,
      requestedAction: action,
      requestedByAdmin: { id: adminId } as any,
      status: 'pending',
    });

    const saved = await this.statusRequestsRepo.save(request);
    return {
      id: saved.id,
      entity_type: saved.entityType,
      entity_id: saved.entityId,
      requested_action: saved.requestedAction,
      requested_by_admin_id: saved.requestedByAdmin.id,
      status: saved.status,
      resolved_by_super_admin_id: saved.resolvedBySuperAdmin?.id ?? null,
      created_at: saved.createdAt,
      resolved_at: saved.resolvedAt,
    };
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

  private async resolvePartnerTypeId(type: 'vendor' | 'engineer'): Promise<number> {
    const code = PARTNER_TYPE_CODES[type];
    const row = await this.masterDataRepo.findOne({
      where: { type: 'partner_type', text: code },
    });
    if (!row) {
      throw new NotFoundException('Core partner type code is missing from master_data');
    }
    return row.id;
  }

  private async resolveReferenceTypeId(type: 'admin' | 'vendor'): Promise<number> {
    const code = REFERENCE_TYPE_CODES[type];
    const row = await this.masterDataRepo.findOne({
      where: { type: 'reference_type', text: code },
    });
    if (!row) {
      throw new NotFoundException('Core reference type code is missing from master_data');
    }
    return row.id;
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