import { describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Role } from '../auth/roles.enum.js';
import { ROLES_KEY } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { AdminStatusRequestsController } from './status-requests.controller.js';
import { StatusRequestsService } from './status-requests.service.js';

describe('StatusRequestsService admin reads', () => {
  it('returns request rows filtered to the requesting admin', async () => {
    const createdAt = new Date('2026-10-10T10:00:00.000Z');
    const rows = [{
        id: 41,
        entityType: 'partner',
        entityId: 77,
        requestedAction: 'deactivate',
        requestedByAdmin: { id: 12 },
        status: 'approved',
        resolvedBySuperAdmin: { id: 1 },
        createdAt,
        resolvedAt: createdAt,
      }, {
        id: 42,
        entityType: 'partner',
        entityId: 78,
        requestedAction: 'deactivate',
        requestedByAdmin: { id: 13 },
        status: 'pending',
        resolvedBySuperAdmin: null,
        createdAt,
        resolvedAt: null,
      }, {
        id: 43,
        entityType: 'partner',
        entityId: 79,
        requestedAction: 'activate',
        requestedByAdmin: { id: 12 },
        status: 'pending',
        resolvedBySuperAdmin: null,
        createdAt,
        resolvedAt: null,
      }];
    const statusRequestsRepo = {
      find: vi.fn(async (options: { where: { requestedByAdmin: { id: number }; requestedAction: string } }) =>
        rows.filter((row) =>
          row.requestedByAdmin.id === options.where.requestedByAdmin.id &&
          row.requestedAction === options.where.requestedAction)),
    };
    const service = new StatusRequestsService(statusRequestsRepo as any, {} as any);

    const result = await service.findForAdmin(12);

    expect(statusRequestsRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { requestedByAdmin: { id: 12 }, requestedAction: 'deactivate' },
      order: { createdAt: 'DESC', id: 'DESC' },
    }));
    expect(result).toEqual([{
      id: 41,
      entity_type: 'partner',
      entity_id: 77,
      requested_action: 'deactivate',
      requested_by_admin_id: 12,
      status: 'approved',
      resolved_by_super_admin_id: 1,
      created_at: createdAt,
      resolved_at: createdAt,
    }]);
  });

  it('restricts the read controller to admin role', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminStatusRequestsController)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata(GUARDS_METADATA, AdminStatusRequestsController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
  });
});