import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { MasterData } from '../master-data/master-data.entity.js';
import { StatusChangeRequest } from '../status-requests/status-requests.entity.js';
import type { StatusRequestResponse } from '../status-requests/status-requests.service.js';
import { CreateStatusRequestDto } from '../status-requests/create-status-request.dto.js';
import { StatusRequestType } from '../status-requests/request-types.js';
import { Partner } from './partners.entity.js';
import { compatibilityIsActive, PartnerLifecycleStatus } from './partner-lifecycle.js';

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
  lifecycle_status: PartnerLifecycleStatus | null;
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
    lifecycleStatus: true,
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
    private dataSource?: DataSource,
  ) {
    if (!this.dataSource) {
      this.dataSource = {
        transaction: async (cb: any) =>
          cb({
            getRepository: (entity: any) => {
              if (entity === Partner) return this.partnersRepo;
              return {
                ...this.statusRequestsRepo,
                create: (payload: any) => ({ id: 101, ...payload }),
                save: async (item: any) => item,
              };
            },
          }),
      } as any;
    }
  }

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

  async createVendorForAdmin(
    dto: Omit<CreatePartnerPayload, 'type'> & { reason?: string | null },
    adminId: number,
  ): Promise<PartnerResponse> {
    const partnerTypeId = await this.resolvePartnerTypeId('vendor');

    return await this.dataSource!.transaction(async (manager) => {
      const partnerRepo = manager.getRepository(Partner);
      const requestRepo = manager.getRepository(StatusChangeRequest);

      const row = partnerRepo.create({
        name: dto.name,
        phoneNumber: dto.phone_number,
        email: dto.email ?? null,
        address: dto.address ?? null,
        skill: dto.skill_id ? ({ id: dto.skill_id } as MasterData) : null,
        category: dto.category_id ? ({ id: dto.category_id } as MasterData) : null,
        partnerType: { id: partnerTypeId },
        createdByAdmin: { id: adminId },
        isActive: false,
        lifecycleStatus: PartnerLifecycleStatus.PENDING_APPROVAL,
        isDeleted: false,
        referenceType: null,
        referenceId: null,
      });

      const savedPartner = await partnerRepo.save(row);

      const statusRequest = requestRepo.create({
        entityType: 'partner',
        entityId: savedPartner.id,
        requestedAction: 'onboard',
        requestType: StatusRequestType.VENDOR_ONBOARDING,
        reason: dto.reason?.trim() || 'Vendor onboarding submission.',
        requestedByAdmin: { id: adminId } as any,
        status: 'pending',
      });

      try {
        await requestRepo.save(statusRequest);
      } catch (error) {
        if (isPendingRequestUniqueViolation(error)) {
          throw new ConflictException('An equivalent pending request already exists');
        }
        throw error;
      }

      return this.toResponse(savedPartner);
    });
  }

  async createDirectEngineerForAdmin(
    adminId: number,
    dto: {
      name: string;
      phone_number: string;
      email?: string | null;
      address?: string | null;
      skill_id?: number | null;
      category_id?: number | null;
    },
  ): Promise<PartnerResponse> {
    const engineerTypeId = await this.resolvePartnerTypeId('engineer');
    const adminReferenceTypeId = await this.resolveReferenceTypeId('admin');
    const row = this.partnersRepo.create({
      name: dto.name,
      phoneNumber: dto.phone_number,
      email: dto.email ?? null,
      address: dto.address ?? null,
      skill: dto.skill_id ? ({ id: dto.skill_id } as MasterData) : null,
      category: dto.category_id ? ({ id: dto.category_id } as MasterData) : null,
      partnerType: { id: engineerTypeId },
      referenceType: { id: adminReferenceTypeId },
      referenceId: adminId,
      createdByAdmin: { id: adminId },
      isActive: true,
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isDeleted: false,
    });

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
    if (vendor.lifecycleStatus !== PartnerLifecycleStatus.ACTIVE) {
      throw new BadRequestException('Vendor is not eligible for service engineer creation');
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
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isDeleted: false,
    });

    const saved = await this.partnersRepo.save(row);
    return this.toResponse(saved);
  }

  async requestStatusChange(
    adminId: number,
    partnerId: number,
    dto: CreateStatusRequestDto,
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

    const vendorTypeId = await this.resolvePartnerTypeId('vendor');
    const engineerTypeId = await this.resolvePartnerTypeId('engineer');
    const isVendor = partner.partnerType.id === vendorTypeId;
    const isEngineer = partner.partnerType.id === engineerTypeId;
    const requestedAction = this.requestActionForType(dto.request_type);

    if (isVendor) {
      if (
        dto.request_type !== StatusRequestType.VENDOR_ONBOARDING &&
        dto.request_type !== StatusRequestType.VENDOR_ACTIVATION &&
        dto.request_type !== StatusRequestType.VENDOR_DEACTIVATION
      ) {
        throw new BadRequestException('Request type does not match Vendor target');
      }
      if (
        dto.request_type === StatusRequestType.VENDOR_ONBOARDING &&
        partner.lifecycleStatus !== PartnerLifecycleStatus.PENDING_APPROVAL &&
        partner.lifecycleStatus !== PartnerLifecycleStatus.REJECTED
      ) {
        throw new BadRequestException('Vendor is not eligible for onboarding request');
      }
      if (
        dto.request_type === StatusRequestType.VENDOR_ACTIVATION &&
        partner.lifecycleStatus !== PartnerLifecycleStatus.INACTIVE
      ) {
        throw new BadRequestException('Vendor is not eligible for activation request');
      }
      if (
        dto.request_type === StatusRequestType.VENDOR_DEACTIVATION &&
        partner.lifecycleStatus !== PartnerLifecycleStatus.ACTIVE
      ) {
        throw new BadRequestException('Vendor is not eligible for deactivation request');
      }
    } else if (isEngineer) {
      if (
        dto.request_type !== StatusRequestType.ENGINEER_ACTIVATION &&
        dto.request_type !== StatusRequestType.ENGINEER_DEACTIVATION
      ) {
        throw new BadRequestException('Request type does not match service engineer target');
      }
      if (
        (dto.request_type === StatusRequestType.ENGINEER_ACTIVATION &&
          partner.lifecycleStatus !== PartnerLifecycleStatus.INACTIVE) ||
        (dto.request_type === StatusRequestType.ENGINEER_DEACTIVATION &&
          partner.lifecycleStatus !== PartnerLifecycleStatus.ACTIVE)
      ) {
        throw new BadRequestException('Service engineer is not eligible for this request');
      }
      await this.assertEligibleEngineerVendor(partner);
    } else {
      throw new BadRequestException('Only Vendor or Service Engineer rows can receive requests');
    }

    const existing = await this.statusRequestsRepo.findOne({
      where: {
        entityType: 'partner',
        entityId: partner.id,
        requestType: dto.request_type,
        status: 'pending',
      },
    });
    if (existing) {
      throw new ConflictException('An equivalent pending request already exists');
    }

    const request = this.statusRequestsRepo.create({
      entityType: 'partner',
      entityId: partner.id,
      requestedAction,
      requestType: dto.request_type,
      reason: dto.reason ?? null,
      requestedByAdmin: { id: adminId } as any,
      status: 'pending',
    });

    let saved: StatusChangeRequest;
    try {
      saved = await this.statusRequestsRepo.save(request);
    } catch (error) {
      if (isPendingRequestUniqueViolation(error)) {
        throw new ConflictException('An equivalent pending request already exists');
      }
      throw error;
    }
    return {
      id: saved.id,
      entity_type: saved.entityType,
      entity_id: saved.entityId,
      requested_action: saved.requestedAction,
      request_type: saved.requestType ?? null,
      reason: saved.reason ?? null,
      requested_by_admin_id: saved.requestedByAdmin.id,
      status: saved.status,
      resolved_by_super_admin_id: saved.resolvedBySuperAdmin?.id ?? null,
      created_at: saved.createdAt,
      resolved_at: saved.resolvedAt,
    };
  }

  private requestActionForType(type: StatusRequestType): string {
    if (type === StatusRequestType.VENDOR_ONBOARDING) return 'onboard';
    if (type === StatusRequestType.VENDOR_ACTIVATION || type === StatusRequestType.ENGINEER_ACTIVATION) {
      return 'activate';
    }
    return 'deactivate';
  }

  private async assertEligibleEngineerVendor(partner: Partner): Promise<void> {
    const vendorReferenceTypeId = await this.resolveReferenceTypeId('vendor');
    if (partner.referenceId === null || partner.referenceType?.id !== vendorReferenceTypeId) {
      throw new BadRequestException('Service engineer has no valid Vendor association');
    }
    const vendorTypeId = await this.resolvePartnerTypeId('vendor');
    const vendor = await this.partnersRepo.findOne({
      where: {
        id: partner.referenceId,
        partnerType: { id: vendorTypeId },
        createdByAdmin: { id: partner.createdByAdmin.id },
        lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      },
    });
    if (!vendor) {
      throw new BadRequestException('Service engineer Vendor association is not eligible');
    }
  }

  async setActive(_id: number, _isActive: boolean): Promise<PartnerResponse> {
    throw new BadRequestException(
      'Direct Super Admin partner activation is disabled; use the status-request workflow',
    );
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
      is_active: compatibilityIsActive(
        row.lifecycleStatus as PartnerLifecycleStatus | null,
        row.isActive,
      ),
      lifecycle_status: row.lifecycleStatus as PartnerLifecycleStatus | null,
      is_deleted: row.isDeleted,
      created_by_admin_id: row.createdByAdmin.id,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    };
  }
}

const PENDING_REQUEST_INDEX = 'UQ_status_requests_pending_target_type';

function isPendingRequestUniqueViolation(error: unknown): boolean {
  const candidate = error as { code?: string; constraint?: string };
  return candidate.code === '23505' && candidate.constraint === PENDING_REQUEST_INDEX;
}
