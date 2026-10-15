import { describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { Role } from '../auth/roles.enum.js';
import { ROLES_KEY } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { AdminStatusRequestsController } from './status-requests.controller.js';
import { StatusRequestsController } from './status-requests.controller.js';
import { StatusRequestsService } from './status-requests.service.js';
import { PartnerLifecycleStatus } from '../partners/partner-lifecycle.js';
import { Partner } from '../partners/partners.entity.js';
import { StatusChangeRequest } from './status-requests.entity.js';
import { StatusRequestType } from './request-types.js';

describe('StatusRequestsService admin reads', () => {
  it('returns request rows filtered to the requesting admin', async () => {
    const createdAt = new Date('2026-10-10T10:00:00.000Z');
    const rows = [{
        id: 41,
        entityType: 'partner',
        entityId: 77,
        requestedAction: 'deactivate',
        requestType: 'ENGINEER_DEACTIVATION',
        reason: 'needs review',
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
        requestType: null,
        reason: null,
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
        requestType: 'ENGINEER_ACTIVATION',
        reason: null,
        requestedByAdmin: { id: 12 },
        status: 'pending',
        resolvedBySuperAdmin: null,
        createdAt,
        resolvedAt: null,
      }];
    const statusRequestsRepo = {
      find: vi.fn(async (options: { where: { requestedByAdmin: { id: number } } }) =>
        rows.filter((row) =>
          row.requestedByAdmin.id === options.where.requestedByAdmin.id)),
    };
    const service = new StatusRequestsService(statusRequestsRepo as any, {} as any);

    const result = await service.findForAdmin(12);

    expect(statusRequestsRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      where: { requestedByAdmin: { id: 12 } },
      order: { createdAt: 'DESC', id: 'DESC' },
    }));
    expect(result).toEqual([{
      id: 41,
      entity_type: 'partner',
      entity_id: 77,
      requested_action: 'deactivate',
      request_type: 'ENGINEER_DEACTIVATION',
      reason: 'needs review',
      requested_by_admin_id: 12,
      status: 'approved',
      resolved_by_super_admin_id: 1,
      created_at: createdAt,
      resolved_at: createdAt,
    }, {
      id: 43,
      entity_type: 'partner',
      entity_id: 79,
      requested_action: 'activate',
      request_type: 'ENGINEER_ACTIVATION',
      reason: null,
      requested_by_admin_id: 12,
      status: 'pending',
      resolved_by_super_admin_id: null,
      created_at: createdAt,
      resolved_at: null,
    }]);
  });

  it('restricts the read controller to admin role', () => {
    expect(Reflect.getMetadata(ROLES_KEY, AdminStatusRequestsController)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata(GUARDS_METADATA, AdminStatusRequestsController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
  });

  it('restricts resolution endpoints to Super Admin role with JWT and role guards', () => {
    expect(Reflect.getMetadata(ROLES_KEY, StatusRequestsController)).toEqual([Role.SUPER_ADMIN]);
    expect(Reflect.getMetadata(GUARDS_METADATA, StatusRequestsController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
  });

  it('does not resolve a legacy request with a null request type', async () => {
    const partner = { id: 77, lifecycleStatus: PartnerLifecycleStatus.ACTIVE };
    const partnerRepo = { findOne: vi.fn(async () => partner), save: vi.fn() };
    const request = {
      id: 41,
      entityType: 'partner',
      entityId: 77,
      requestedAction: 'deactivate',
      status: 'pending',
    };
    const requestRepo = {
      findOne: vi.fn(async () => request),
      save: vi.fn(),
    };
    const dataSource = {
      transaction: vi.fn(async (callback) => callback({
        getRepository: (entity: unknown) =>
          entity === StatusChangeRequest ? requestRepo : entity === Partner ? partnerRepo : requestRepo,
      })),
    };
    const service = new StatusRequestsService(requestRepo as any, dataSource as any);

    await expect(service.approve(41, 1)).rejects.toThrow(
      'Legacy or unsupported status request types cannot be resolved',
    );
    expect(partnerRepo.save).not.toHaveBeenCalled();
  });

  it.each([
    [StatusRequestType.VENDOR_ONBOARDING, 1, PartnerLifecycleStatus.PENDING_APPROVAL, PartnerLifecycleStatus.ACTIVE],
    [StatusRequestType.VENDOR_ONBOARDING, 1, PartnerLifecycleStatus.REJECTED, PartnerLifecycleStatus.ACTIVE],
    [StatusRequestType.VENDOR_ACTIVATION, 1, PartnerLifecycleStatus.INACTIVE, PartnerLifecycleStatus.ACTIVE],
    [StatusRequestType.VENDOR_DEACTIVATION, 1, PartnerLifecycleStatus.ACTIVE, PartnerLifecycleStatus.INACTIVE],
    [StatusRequestType.ENGINEER_ACTIVATION, 2, PartnerLifecycleStatus.INACTIVE, PartnerLifecycleStatus.ACTIVE],
    [StatusRequestType.ENGINEER_DEACTIVATION, 2, PartnerLifecycleStatus.ACTIVE, PartnerLifecycleStatus.INACTIVE],
  ])('approves %s with an atomic lifecycle and compatibility transition', async (
    requestType,
    partnerTypeId,
    initialStatus,
    finalStatus,
  ) => {
    const partner = {
      id: 77,
      partnerType: {
        id: partnerTypeId,
        text: partnerTypeId === 1 ? 'q7Kf2mZ9xRw4tB6y' : 'h3Np8Ld1Qs5Vc2Jw',
      },
      referenceId: partnerTypeId === 2 ? 88 : null,
      referenceType: partnerTypeId === 2 ? { text: 'd6Rq1Ae3Uv9sH5pM' } : null,
      lifecycleStatus: initialStatus,
      isActive: initialStatus === PartnerLifecycleStatus.ACTIVE,
    };
    const request = {
      id: 77,
      entityType: 'partner',
      entityId: 77,
      requestType,
      requestedAction: 'activate',
      status: 'pending',
      requestedByAdmin: { id: 12 },
      resolvedBySuperAdmin: null,
      createdAt: new Date(),
      resolvedAt: null,
      reason: null,
    };
    const resolved = { ...request, status: 'approved', resolvedBySuperAdmin: { id: 1 }, resolvedAt: new Date() };
    const vendor = {
      id: 88,
      partnerType: { text: 'q7Kf2mZ9xRw4tB6y' },
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
    };
    const requestRepo = {
      findOne: vi.fn().mockResolvedValueOnce(request).mockResolvedValueOnce(resolved),
      save: vi.fn().mockResolvedValue(resolved),
    };
    const partnerRepo = {
      findOne: vi.fn().mockResolvedValueOnce(partner).mockResolvedValueOnce(partner).mockResolvedValueOnce(vendor),
      save: vi.fn().mockResolvedValue(partner),
    };
    const dataSource = {
      transaction: vi.fn(async (callback) => callback({
        getRepository: (entity: unknown) => entity === StatusChangeRequest ? requestRepo : partnerRepo,
      })),
    };
    const service = new StatusRequestsService(requestRepo as any, dataSource as any);

    const result = await service.approve(77, 1);

    expect(result.status).toBe('approved');
    expect(partner.lifecycleStatus).toBe(finalStatus);
    expect(partner.isActive).toBe(finalStatus === PartnerLifecycleStatus.ACTIVE);
    expect(partnerRepo.save).toHaveBeenCalledWith(partner);
    expect(requestRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
    expect(partnerRepo.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: 77 },
      lock: { mode: 'pessimistic_write' },
    });
    expect(partnerRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: { id: 77 },
      relations: { partnerType: true, referenceType: true },
    });
  });

  it('rejects Vendor onboarding transitioning PENDING_APPROVAL to REJECTED and remaining inactive', async () => {
    const partner = {
      id: 77,
      partnerType: { id: 1, text: 'q7Kf2mZ9xRw4tB6y' },
      lifecycleStatus: PartnerLifecycleStatus.PENDING_APPROVAL,
      isActive: false,
      referenceId: null,
      referenceType: null,
    };
    const request = {
      id: 77, entityType: 'partner', entityId: 77, requestType: StatusRequestType.VENDOR_ONBOARDING,
      requestedAction: 'onboard', status: 'pending', requestedByAdmin: { id: 12 },
      resolvedBySuperAdmin: null, createdAt: new Date(), resolvedAt: null, reason: null,
    };
    const resolved = { ...request, status: 'rejected', resolvedBySuperAdmin: { id: 1 }, resolvedAt: new Date() };
    const requestRepo = {
      findOne: vi.fn().mockResolvedValueOnce(request).mockResolvedValueOnce(resolved),
      save: vi.fn().mockResolvedValue(resolved),
    };
    const partnerRepo = { findOne: vi.fn().mockResolvedValue(partner), save: vi.fn().mockResolvedValue(partner) };
    const transactionManager = {
      getRepository: vi.fn((entity: unknown) => entity === StatusChangeRequest ? requestRepo : partnerRepo),
    };
    const dataSource = {
      transaction: vi.fn(async (callback) => callback(transactionManager)),
    };
    const service = new StatusRequestsService(requestRepo as any, dataSource as any);

    const result = await service.reject(77, 1);
    expect(result).toEqual(expect.objectContaining({ status: 'rejected' }));
    expect(partner.lifecycleStatus).toBe(PartnerLifecycleStatus.REJECTED);
    expect(partner.isActive).toBe(false);
    expect(partnerRepo.save).toHaveBeenCalledWith(partner);
    expect(requestRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'rejected',
      resolvedBySuperAdmin: { id: 1 },
    }));
    expect(transactionManager.getRepository).toHaveBeenCalledWith(Partner);
    expect(transactionManager.getRepository).toHaveBeenCalledWith(StatusChangeRequest);
  });

  it.each([
    StatusRequestType.VENDOR_ACTIVATION,
    StatusRequestType.VENDOR_DEACTIVATION,
    StatusRequestType.ENGINEER_ACTIVATION,
    StatusRequestType.ENGINEER_DEACTIVATION,
  ])('rejects operational request %s without mutating the Partner', async (requestType) => {
    const partner = {
      id: 77,
      partnerType: {
        id: requestType.startsWith('VENDOR_') ? 1 : 2,
        text: requestType.startsWith('VENDOR_') ? 'q7Kf2mZ9xRw4tB6y' : 'h3Np8Ld1Qs5Vc2Jw',
      },
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isActive: true,
      referenceId: null,
      referenceType: null,
    };
    const request = {
      id: 77, entityType: 'partner', entityId: 77, requestType,
      requestedAction: 'deactivate', status: 'pending', requestedByAdmin: { id: 12 },
      resolvedBySuperAdmin: null, createdAt: new Date(), resolvedAt: null, reason: null,
    };
    const resolved = { ...request, status: 'rejected', resolvedBySuperAdmin: { id: 1 }, resolvedAt: new Date() };
    const requestRepo = {
      findOne: vi.fn().mockResolvedValueOnce(request).mockResolvedValueOnce(resolved),
      save: vi.fn().mockResolvedValue(resolved),
    };
    const partnerRepo = { findOne: vi.fn().mockResolvedValue(partner), save: vi.fn() };
    const transactionManager = {
      getRepository: vi.fn((entity: unknown) => entity === StatusChangeRequest ? requestRepo : partnerRepo),
    };
    const dataSource = {
      transaction: vi.fn(async (callback) => callback(transactionManager)),
    };
    const service = new StatusRequestsService(requestRepo as any, dataSource as any);

    await expect(service.reject(77, 1)).resolves.toEqual(expect.objectContaining({ status: 'rejected' }));
    expect(partner.lifecycleStatus).toBe(PartnerLifecycleStatus.ACTIVE);
    expect(partner.isActive).toBe(true);
    expect(partnerRepo.save).not.toHaveBeenCalled();
    expect(requestRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      status: 'rejected',
      resolvedBySuperAdmin: { id: 1 },
    }));
  });

  it('rejects stale, mismatched, missing, and already-resolved requests', async () => {
    const stale = {
      id: 1, entityType: 'partner', entityId: 77, requestType: StatusRequestType.VENDOR_ACTIVATION,
      status: 'pending', requestedByAdmin: { id: 12 },
    };
    const partner = {
      id: 77, partnerType: { text: 'q7Kf2mZ9xRw4tB6y' }, lifecycleStatus: PartnerLifecycleStatus.ACTIVE, isActive: true,
    };
    const requestRepo = { findOne: vi.fn().mockResolvedValue(stale), save: vi.fn() };
    const partnerRepo = { findOne: vi.fn().mockResolvedValue(partner), save: vi.fn() };
    const dataSource = { transaction: vi.fn(async (callback) => callback({
      getRepository: (entity: unknown) => entity === StatusChangeRequest ? requestRepo : partnerRepo,
    })) };
    const service = new StatusRequestsService(requestRepo as any, dataSource as any);
    await expect(service.approve(1, 1)).rejects.toThrow('Partner lifecycle state is stale');
    expect(partnerRepo.save).not.toHaveBeenCalled();
  });

  it.each([
    PartnerLifecycleStatus.ACTIVE,
    PartnerLifecycleStatus.INACTIVE,
    null,
  ])('does not approve onboarding from an invalid Vendor lifecycle state (%s)', async (lifecycleStatus) => {
    const request = {
      id: 2, entityType: 'partner', entityId: 77,
      requestType: StatusRequestType.VENDOR_ONBOARDING, status: 'pending',
    };
    const partner = {
      id: 77, partnerType: { text: 'q7Kf2mZ9xRw4tB6y' }, lifecycleStatus, isActive: lifecycleStatus === PartnerLifecycleStatus.ACTIVE,
    };
    const requestRepo = { findOne: vi.fn().mockResolvedValue(request), save: vi.fn() };
    const partnerRepo = { findOne: vi.fn().mockResolvedValue(partner), save: vi.fn() };
    const dataSource = { transaction: vi.fn(async (callback) => callback({
      getRepository: (entity: unknown) => entity === StatusChangeRequest ? requestRepo : partnerRepo,
    })) };
    const service = new StatusRequestsService(requestRepo as any, dataSource as any);

    await expect(service.approve(2, 1)).rejects.toThrow('Partner lifecycle state is stale');
    expect(partnerRepo.save).not.toHaveBeenCalled();
  });
});
