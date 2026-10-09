import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Partner } from '../partners/partners.entity.js';
import { SuperAdmin } from '../super-admins/super-admins.entity.js';
import { StatusChangeRequest } from './status-requests.entity.js';

export interface StatusRequestResponse {
  id: number;
  entity_type: string;
  entity_id: number;
  requested_action: string;
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
    status: true,
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

      if (approved) {
        const partner = await partnersRepo.findOne({ where: { id: row.entityId } });
        if (!partner) {
          throw new NotFoundException(`Partner with id ${row.entityId} not found`);
        }
        if (row.requestedAction === 'activate') {
          partner.isActive = true;
        } else if (row.requestedAction === 'deactivate') {
          partner.isActive = false;
        } else {
          throw new BadRequestException('Status request action must be activate or deactivate');
        }
        await partnersRepo.save(partner);
        row.status = 'approved';
      } else {
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

  private toResponse(row: StatusChangeRequest): StatusRequestResponse {
    return {
      id: row.id,
      entity_type: row.entityType,
      entity_id: row.entityId,
      requested_action: row.requestedAction,
      requested_by_admin_id: row.requestedByAdmin.id,
      status: row.status,
      resolved_by_super_admin_id: row.resolvedBySuperAdmin?.id ?? null,
      created_at: row.createdAt,
      resolved_at: row.resolvedAt,
    };
  }
}