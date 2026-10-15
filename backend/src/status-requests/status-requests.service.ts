import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Partner } from '../partners/partners.entity.js';
import { PartnerLifecycleStatus } from '../partners/partner-lifecycle.js';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';
import { StatusChangeRequest } from './status-requests.entity.js';
import { StatusRequestType } from './request-types.js';

export interface StatusRequestResponse {
  id: number;
  entity_type: string;
  entity_id: number;
  requested_action: string;
  request_type: string | null;
  reason: string | null;
  requested_by_admin_id: number;
  status: string;
  resolved_by_super_admin_id: number | null;
  created_at: Date;
  resolved_at: Date | null;
}

const REQUEST_READ_OPTIONS = {
  relations: { requestedByAdmin: true, resolvedBySuperAdmin: true },
  select: {
    id: true,
    entityType: true,
    entityId: true,
    requestedAction: true,
    requestType: true,
    status: true,
    reason: true,
    createdAt: true,
    resolvedAt: true,
    requestedByAdmin: { id: true },
    resolvedBySuperAdmin: { id: true },
  },
} as const;

@Injectable()
export class StatusRequestsService {
  constructor(
    @InjectRepository(StatusChangeRequest)
    private readonly statusRequestsRepo: Repository<StatusChangeRequest>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<StatusRequestResponse[]> {
    const rows = await this.statusRequestsRepo.find({
      ...REQUEST_READ_OPTIONS,
      order: { id: 'ASC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findForAdmin(adminId: number): Promise<StatusRequestResponse[]> {
    const rows = await this.statusRequestsRepo.find({
      ...REQUEST_READ_OPTIONS,
      where: {
        requestedByAdmin: { id: adminId },
      },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
    return rows.map((row) => this.toResponse(row));
  }

  approve(id: number, superAdminId: number): Promise<StatusRequestResponse> {
    return this.resolve(id, superAdminId, true);
  }

  reject(id: number, superAdminId: number): Promise<StatusRequestResponse> {
    return this.resolve(id, superAdminId, false);
  }

  private async resolve(
    id: number,
    superAdminId: number,
    approved: boolean,
  ): Promise<StatusRequestResponse> {
    return this.dataSource.transaction(async (manager) => {
      const requestsRepo = manager.getRepository(StatusChangeRequest);
      const partnersRepo = manager.getRepository(Partner);
      const row = await requestsRepo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!row) {
        throw new NotFoundException(`Status request with id ${id} not found`);
      }
      if (row.status !== 'pending') {
        throw new ConflictException(`Status request ${id} has already been resolved`);
      }
      if (row.entityType !== 'partner') {
        throw new BadRequestException('Only partner status requests can be resolved');
      }

      const requestType = row.requestType;
      if (!requestType || !Object.values(StatusRequestType).includes(requestType)) {
        throw new BadRequestException('Legacy or unsupported status request types cannot be resolved');
      }
      const partner = await partnersRepo.findOne({
        where: { id: row.entityId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!partner) {
        throw new NotFoundException(`Partner with id ${row.entityId} not found`);
      }
      // Lock the Partner row without joining nullable relations. PostgreSQL rejects
      // FOR UPDATE on the nullable side of an outer join. The row is already locked
      // in this transaction before its relations are loaded separately.
      const partnerWithRelations = await partnersRepo.findOne({
        where: { id: row.entityId },
        relations: { partnerType: true, referenceType: true },
      });
      if (!partnerWithRelations) {
        throw new NotFoundException(`Partner with id ${row.entityId} not found`);
      }
      partner.partnerType = partnerWithRelations.partnerType;
      partner.referenceType = partnerWithRelations.referenceType;
      this.assertTargetType(partner, requestType);
      if (approved) {
        await this.applyApproval(partner, requestType, partnersRepo);
        row.status = 'approved';
      } else {
        if (requestType === StatusRequestType.VENDOR_ONBOARDING) {
          partner.lifecycleStatus = PartnerLifecycleStatus.REJECTED;
          partner.isActive = false;
          await partnersRepo.save(partner);
        }
        row.status = 'rejected';
      }
      row.resolvedBySuperAdmin = { id: superAdminId } as SuperAdmin;
      row.resolvedAt = new Date();
      const saved = await requestsRepo.save(row);
      const result = await requestsRepo.findOne({
        ...REQUEST_READ_OPTIONS,
        where: { id: saved.id },
      });
      if (!result) {
        throw new NotFoundException(`Status request with id ${saved.id} not found`);
      }
      return this.toResponse(result);
    });
  }

  private assertTargetType(partner: Partner, requestType: StatusRequestType): void {
    const isVendorRequest = requestType.startsWith('VENDOR_');
    const expectedType = isVendorRequest ? 'q7Kf2mZ9xRw4tB6y' : 'h3Np8Ld1Qs5Vc2Jw';
    const actualType = partner.partnerType?.text;
    if (actualType !== undefined && actualType !== expectedType) {
      throw new BadRequestException('Status request type does not match Partner type');
    }
  }

  private async applyApproval(
    partner: Partner,
    requestType: StatusRequestType,
    partnersRepo: Repository<Partner>,
  ): Promise<void> {
    const isVendorRequest = requestType.startsWith('VENDOR_');
    const required = requestType === StatusRequestType.VENDOR_ONBOARDING
      ? PartnerLifecycleStatus.PENDING_APPROVAL
      : requestType === StatusRequestType.VENDOR_ACTIVATION || requestType === StatusRequestType.ENGINEER_ACTIVATION
        ? PartnerLifecycleStatus.INACTIVE
        : PartnerLifecycleStatus.ACTIVE;
    const next = required === PartnerLifecycleStatus.ACTIVE
      ? PartnerLifecycleStatus.INACTIVE
      : PartnerLifecycleStatus.ACTIVE;
    const onboardingResubmission = requestType === StatusRequestType.VENDOR_ONBOARDING &&
      partner.lifecycleStatus === PartnerLifecycleStatus.REJECTED;
    if (partner.lifecycleStatus !== required && !onboardingResubmission) {
      throw new ConflictException('Partner lifecycle state is stale for this request');
    }
    if (!isVendorRequest) {
      if (partner.referenceId === null || partner.referenceType?.text !== 'd6Rq1Ae3Uv9sH5pM') {
        throw new BadRequestException('Service engineer Vendor association is not eligible');
      }
      const vendor = await partnersRepo.findOne({
        where: {
          id: partner.referenceId,
          partnerType: { text: 'q7Kf2mZ9xRw4tB6y' },
          lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (!vendor) {
        throw new BadRequestException('Service engineer Vendor association is not eligible');
      }
    }
    partner.lifecycleStatus = next;
    partner.isActive = next === PartnerLifecycleStatus.ACTIVE;
    await partnersRepo.save(partner);
  }

  private toResponse(row: StatusChangeRequest): StatusRequestResponse {
    return {
      id: row.id,
      entity_type: row.entityType,
      entity_id: row.entityId,
      requested_action: row.requestedAction,
      request_type: row.requestType ?? null,
      reason: row.reason ?? null,
      requested_by_admin_id: row.requestedByAdmin.id,
      status: row.status,
      resolved_by_super_admin_id: row.resolvedBySuperAdmin?.id ?? null,
      created_at: row.createdAt,
      resolved_at: row.resolvedAt,
    };
  }
}
