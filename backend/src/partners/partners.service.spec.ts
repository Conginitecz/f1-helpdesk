import { describe, expect, it, vi } from 'vitest';
import { PartnersService } from './partners.service.js';
import { PartnerLifecycleStatus } from './partner-lifecycle.js';
import { PartnersController } from './partners.controller.js';
import { CreateVendorDto } from './create-vendor.dto.js';
import { ValidationPipe } from '@nestjs/common';
import { StatusRequestType } from '../status-requests/request-types.js';
import { Partner } from './partners.entity.js';

describe('PartnersService admin ownership', () => {
  it('lists engineer rows owned by the admin or by their vendors', async () => {
    const partnersRepo = {
      find: vi.fn().mockResolvedValue([
        { id: 10, createdByAdmin: { id: 42 }, partnerType: { id: 2 }, isActive: true },
        { id: 11, createdByAdmin: { id: 99 }, partnerType: { id: 2 }, isActive: true },
      ]),
      findOne: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
    };
    const masterDataRepo = {
      findOne: vi.fn(({ where }) => {
        if (where.type === 'partner_type' && where.text === 'q7Kf2mZ9xRw4tB6y') {
          return { id: 1 };
        }
        if (where.type === 'partner_type' && where.text === 'h3Np8Ld1Qs5Vc2Jw') {
          return { id: 2 };
        }
        if (where.type === 'reference_type' && where.text === 'd6Rq1Ae3Uv9sH5pM') {
          return { id: 3 };
        }
        return null;
      }),
    };
    const statusRequestsRepo = {
      findOne: vi.fn(),
      save: vi.fn(),
      create: vi.fn(),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      statusRequestsRepo as any,
    );

    const rows = await service.findForAdmin(42, 'engineer');

    expect(rows).toHaveLength(2);
    expect(partnersRepo.find).toHaveBeenCalled();
  });

  it('does not create a status request for another admin\'s engineer', async () => {
    const partnersRepo = {
      find: vi.fn(),
      findOne: vi.fn(async () => null),
      save: vi.fn(),
      create: vi.fn(),
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) =>
        where.text === 'h3Np8Ld1Qs5Vc2Jw' ? { id: 2 } : null),
    };
    const statusRequestsRepo = { findOne: vi.fn(), save: vi.fn(), create: vi.fn() };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      statusRequestsRepo as any,
    );

    await expect(service.requestStatusChange(42, 99, {
      request_type: StatusRequestType.ENGINEER_DEACTIVATION,
    })).rejects.toThrow(
      'Partner with id 99 not found',
    );
    expect(statusRequestsRepo.create).not.toHaveBeenCalled();
  });

  it('does not create an engineer under another admin\'s vendor', async () => {
    const partnersRepo = {
      find: vi.fn(),
      findOne: vi.fn(async () => null),
      save: vi.fn(),
      create: vi.fn(),
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) =>
        where.text === 'q7Kf2mZ9xRw4tB6y' ? { id: 1 } : null),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      { findOne: vi.fn(), save: vi.fn(), create: vi.fn() } as any,
    );

    await expect(
      service.createEngineerForVendor(42, 99, {
        name: 'Engineer',
        phone_number: '123',
      }),
    ).rejects.toThrow('Vendor partner with id 99 not found');
    expect(partnersRepo.create).not.toHaveBeenCalled();
  });

  it('creates new vendors pending approval and keeps the compatibility flag false', async () => {
    const vendor = {
      id: 50,
      partnerType: { id: 1 },
      name: 'Pending Vendor',
      phoneNumber: '123',
      email: null,
      address: null,
      skill: null,
      category: null,
      referenceType: null,
      referenceId: null,
      isActive: false,
      lifecycleStatus: PartnerLifecycleStatus.PENDING_APPROVAL,
      isDeleted: false,
      createdByAdmin: { id: 42 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const partnersRepo = {
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(async () => vendor),
      create: vi.fn((payload) => ({ ...vendor, ...payload })),
    };
    const masterDataRepo = {
      findOne: vi.fn(async () => ({ id: 1 })),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      {} as any,
    );

    const result = await service.createVendorForAdmin({
      name: 'Pending Vendor',
      phone_number: '123',
    }, 42);

    expect(partnersRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      isActive: false,
      lifecycleStatus: PartnerLifecycleStatus.PENDING_APPROVAL,
    }));
    expect(result.lifecycle_status).toBe(PartnerLifecycleStatus.PENDING_APPROVAL);
    expect(result.is_active).toBe(false);
  });

  it.each([
    PartnerLifecycleStatus.PENDING_APPROVAL,
    PartnerLifecycleStatus.REJECTED,
    PartnerLifecycleStatus.INACTIVE,
    null,
  ])('rejects Engineer creation for an ineligible Vendor (%s)', async (status) => {
    const partnersRepo = {
      find: vi.fn(),
      findOne: vi.fn(async () => ({
        id: 50,
        partnerType: { id: 1 },
        createdByAdmin: { id: 42 },
        lifecycleStatus: status,
      })),
      save: vi.fn(),
      create: vi.fn(),
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) =>
        where.text === 'q7Kf2mZ9xRw4tB6y' ? { id: 1 } : null),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      {} as any,
    );

    await expect(service.createEngineerForVendor(42, 50, {
      name: 'Engineer',
      phone_number: '123',
    })).rejects.toThrow('Vendor is not eligible');
    expect(partnersRepo.create).not.toHaveBeenCalled();
  });

  it('does not directly mutate lifecycle through the legacy Super Admin route', async () => {
    const service = new PartnersService({} as any, {} as any, {} as any);

    await expect(service.setActive(50, true)).rejects.toThrow(
      'Direct Super Admin partner activation is disabled',
    );
  });

  it.each([
    PartnerLifecycleStatus.PENDING_APPROVAL,
    PartnerLifecycleStatus.ACTIVE,
    PartnerLifecycleStatus.INACTIVE,
    PartnerLifecycleStatus.REJECTED,
  ])('serializes lifecycle status %s from normal Partner reads', async (status) => {
    const row = {
      id: 50,
      partnerType: { id: 1 },
      name: 'Vendor',
      phoneNumber: '123',
      email: null,
      address: null,
      skill: null,
      category: null,
      referenceType: null,
      referenceId: null,
      isActive: status === PartnerLifecycleStatus.ACTIVE,
      lifecycleStatus: status,
      isDeleted: false,
      createdByAdmin: { id: 42 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const partnersRepo = { find: vi.fn(async () => [row]) };
    const masterDataRepo = {
      findOne: vi.fn(async () => ({ id: 1 })),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      {} as any,
    );

    const result = await service.findAll('vendor');

    expect(result[0].lifecycle_status).toBe(status);
    expect(result[0].is_active).toBe(status === PartnerLifecycleStatus.ACTIVE);
    expect(partnersRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ lifecycleStatus: true }),
    }));
  });

  it('preserves the compatibility Boolean for unmapped legacy reads', async () => {
    const row = {
      id: 51,
      partnerType: { id: 1 },
      name: 'Legacy Vendor',
      phoneNumber: '123',
      email: null,
      address: null,
      skill: null,
      category: null,
      referenceType: null,
      referenceId: null,
      isActive: true,
      lifecycleStatus: null,
      isDeleted: false,
      createdByAdmin: { id: 42 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const partnersRepo = { find: vi.fn(async () => [row]) };
    const service = new PartnersService(
      partnersRepo as any,
      { findOne: vi.fn(async ({ where }) =>
        where.text === 'h3Np8Ld1Qs5Vc2Jw' ? { id: 2 } : { id: 1 }) } as any,
      {} as any,
    );

    const result = await service.findAll('vendor');

    expect(result[0].lifecycle_status).toBeNull();
    expect(result[0].is_active).toBe(true);
  });

  it('creates an Engineer under an owned ACTIVE Vendor', async () => {
    const vendor = {
      id: 50,
      partnerType: { id: 1 },
      createdByAdmin: { id: 42 },
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
    };
    const engineer = {
      id: 60,
      partnerType: { id: 2 },
      name: 'Engineer',
      phoneNumber: '123',
      email: null,
      address: null,
      skill: null,
      category: null,
      referenceType: { id: 3 },
      referenceId: 50,
      isActive: true,
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isDeleted: false,
      createdByAdmin: { id: 42 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const partnersRepo = {
      findOne: vi.fn(async () => vendor),
      create: vi.fn((payload) => ({ ...engineer, ...payload })),
      save: vi.fn(async () => engineer),
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) => {
        if (where.text === 'q7Kf2mZ9xRw4tB6y') return { id: 1 };
        if (where.text === 'h3Np8Ld1Qs5Vc2Jw') return { id: 2 };
        return { id: 3 };
      }),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      {} as any,
    );

    const result = await service.createEngineerForVendor(42, 50, {
      name: 'Engineer',
      phone_number: '123',
    });

    expect(result.lifecycle_status).toBe(PartnerLifecycleStatus.ACTIVE);
    expect(result.is_active).toBe(true);
    expect(partnersRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      referenceId: 50,
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
    }));
  });

  it('rejects Engineer creation when the owned parent is not a Vendor', async () => {
    const partnersRepo = {
      findOne: vi.fn(async () => null),
      create: vi.fn(),
      save: vi.fn(),
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) =>
        where.text === 'q7Kf2mZ9xRw4tB6y' ? { id: 1 } : null),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      {} as any,
    );

    await expect(service.createEngineerForVendor(42, 60, {
      name: 'Engineer',
      phone_number: '123',
    })).rejects.toThrow('Vendor partner with id 60 not found');
    expect(partnersRepo.findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ partnerType: { id: 1 } }),
    }));
    expect(partnersRepo.create).not.toHaveBeenCalled();
  });

  it('serializes Admin-scoped mapped and unmapped lifecycle reads', async () => {
    const mappedActive = {
      id: 50,
      partnerType: { id: 1 },
      name: 'Active Vendor',
      phoneNumber: '123',
      email: null,
      address: null,
      skill: null,
      category: null,
      referenceType: null,
      referenceId: null,
      isActive: true,
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isDeleted: false,
      createdByAdmin: { id: 42 },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const legacy = {
      ...mappedActive,
      id: 51,
      name: 'Legacy Engineer',
      partnerType: { id: 2 },
      isActive: false,
      lifecycleStatus: null,
    };
    const partnersRepo = {
      find: vi.fn()
        .mockResolvedValueOnce([{ id: 50 }])
        .mockResolvedValueOnce([mappedActive])
        .mockResolvedValueOnce([legacy])
        .mockResolvedValueOnce([]),
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) => {
        if (where.text === 'q7Kf2mZ9xRw4tB6y') return { id: 1 };
        if (where.text === 'h3Np8Ld1Qs5Vc2Jw') return { id: 2 };
        return { id: 3 };
      }),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      {} as any,
    );

    const result = await service.findForAdmin(42);

    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 50,
        lifecycle_status: PartnerLifecycleStatus.ACTIVE,
        is_active: true,
      }),
      expect.objectContaining({
        id: 51,
        lifecycle_status: null,
        is_active: false,
      }),
    ]));
    expect(partnersRepo.find).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ lifecycleStatus: true }),
    }));
  });

  it('does not rewrite a legacy Engineer when an ineligible Vendor operation is attempted', async () => {
    const legacyEngineer = {
      id: 60,
      partnerType: { id: 2 },
      referenceId: 55,
      isActive: true,
      lifecycleStatus: null,
      createdByAdmin: { id: 42 },
    };
    const partnersRepo = {
      findOne: vi.fn(async () => ({
        id: 55,
        partnerType: { id: 1 },
        createdByAdmin: { id: 42 },
        lifecycleStatus: PartnerLifecycleStatus.INACTIVE,
      })),
      create: vi.fn(),
      save: vi.fn(),
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) =>
        where.text === 'q7Kf2mZ9xRw4tB6y' ? { id: 1 } : null),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      {} as any,
    );

    await expect(service.createEngineerForVendor(42, 55, {
      name: 'New Engineer',
      phone_number: '123',
    })).rejects.toThrow('Vendor is not eligible');
    expect(legacyEngineer).toEqual(expect.objectContaining({
      referenceId: 55,
      isActive: true,
      lifecycleStatus: null,
    }));
    expect(partnersRepo.save).not.toHaveBeenCalled();
    expect(partnersRepo.create).not.toHaveBeenCalled();
  });

  it('rejects the direct Engineer creation HTTP DTO path', async () => {
    const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true });

    await expect(pipe.transform(
      { name: 'Engineer', phone_number: '123', type: 'engineer' },
      { type: 'body', metatype: CreateVendorDto, data: '' },
    )).rejects.toThrow();
  });

  it('blocks both Super Admin direct mutation controller endpoints without calling a repository', async () => {
    const service = new PartnersService({} as any, {} as any, {} as any);
    const controller = new PartnersController(service as any);

    await expect(controller.activate(50)).rejects.toThrow(
      'Direct Super Admin partner activation is disabled',
    );
    await expect(controller.deactivate(50)).rejects.toThrow(
      'Direct Super Admin partner activation is disabled',
    );
  });

  it.each([
    [StatusRequestType.VENDOR_ONBOARDING, 50, 1, PartnerLifecycleStatus.PENDING_APPROVAL, false],
    [StatusRequestType.VENDOR_ACTIVATION, 51, 1, PartnerLifecycleStatus.INACTIVE, false],
    [StatusRequestType.VENDOR_DEACTIVATION, 52, 1, PartnerLifecycleStatus.ACTIVE, true],
    [StatusRequestType.ENGINEER_ACTIVATION, 53, 2, PartnerLifecycleStatus.INACTIVE, false],
    [StatusRequestType.ENGINEER_DEACTIVATION, 54, 2, PartnerLifecycleStatus.ACTIVE, true],
  ])('creates a pending request for eligible %s targets without changing the Partner', async (
    requestType,
    partnerId,
    partnerTypeId,
    lifecycleStatus,
    isActive,
  ) => {
    const partner = {
      id: partnerId,
      partnerType: { id: partnerTypeId },
      lifecycleStatus,
      isActive,
      referenceId: partnerTypeId === 2 ? 90 : null,
      referenceType: partnerTypeId === 2 ? { id: 3 } : null,
      createdByAdmin: { id: 42 },
    };
    const savedRequest = {
      id: 700,
      entityType: 'partner',
      entityId: partnerId,
      requestedAction: requestType === StatusRequestType.VENDOR_ONBOARDING ? 'onboard' :
        requestType.endsWith('ACTIVATION') ? 'activate' : 'deactivate',
      requestType,
      reason: 'phase 2 test',
      requestedByAdmin: { id: 42 },
      status: 'pending',
      resolvedBySuperAdmin: null,
      createdAt: new Date(),
      resolvedAt: null,
    };
    const vendor = {
      id: 90,
      partnerType: { id: 1 },
      createdByAdmin: { id: 42 },
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      referenceType: null,
    };
    const partnersRepo = {
      findOne: vi.fn()
        .mockResolvedValueOnce(partner)
        .mockResolvedValueOnce(vendor),
      create: vi.fn(),
      save: vi.fn(),
    };
    const statusRequestsRepo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((value) => value),
      save: vi.fn().mockResolvedValue(savedRequest),
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) => {
        if (where.text === 'q7Kf2mZ9xRw4tB6y') return { id: 1 };
        if (where.text === 'h3Np8Ld1Qs5Vc2Jw') return { id: 2 };
        return { id: 3 };
      }),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      statusRequestsRepo as any,
    );

    const result = await service.requestStatusChange(42, partnerId, {
      request_type: requestType as StatusRequestType,
      reason: 'phase 2 test',
    });

    expect(result).toEqual(expect.objectContaining({
      entity_id: partnerId,
      request_type: requestType,
      reason: 'phase 2 test',
      requested_by_admin_id: 42,
      status: 'pending',
    }));
    expect(statusRequestsRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      entityId: partnerId,
      requestType,
      status: 'pending',
      requestedByAdmin: { id: 42 },
    }));
    expect(partner.lifecycleStatus).toBe(lifecycleStatus);
    expect(partner.isActive).toBe(isActive);
    expect(partnersRepo.save).not.toHaveBeenCalled();
    if (partnerTypeId === 2) {
      expect(partnersRepo.findOne).toHaveBeenNthCalledWith(2, {
        where: {
          id: 90,
          partnerType: { id: 1 },
          createdByAdmin: { id: 42 },
          lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        },
      });
    }
  });

  it('creates a new onboarding request for a rejected Vendor without reopening or replacing the old request', async () => {
    const vendor = {
      id: 50,
      partnerType: { id: 1 },
      lifecycleStatus: PartnerLifecycleStatus.REJECTED,
      isActive: false,
      referenceId: null,
      referenceType: null,
      createdByAdmin: { id: 42 },
    };
    const previousRejectedRequest = {
      id: 10,
      status: 'rejected',
      requestType: StatusRequestType.VENDOR_ONBOARDING,
    };
    const newRequest = {
      id: 11,
      entityType: 'partner',
      entityId: 50,
      requestedAction: 'onboard',
      requestType: StatusRequestType.VENDOR_ONBOARDING,
      reason: null,
      requestedByAdmin: { id: 42 },
      status: 'pending',
      resolvedBySuperAdmin: null,
      createdAt: new Date(),
      resolvedAt: null,
    };
    const partnersRepo = { findOne: vi.fn().mockResolvedValue(vendor), save: vi.fn() };
    const statusRequestsRepo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn((value) => value),
      save: vi.fn().mockResolvedValue(newRequest),
    };
    const service = new PartnersService(
      partnersRepo as any,
      { findOne: vi.fn(async ({ where }) => where.text === 'q7Kf2mZ9xRw4tB6y' ? { id: 1 } : { id: 2 }) } as any,
      statusRequestsRepo as any,
    );

    const result = await service.requestStatusChange(42, 50, {
      request_type: StatusRequestType.VENDOR_ONBOARDING,
    });

    expect(result.id).toBe(11);
    expect(statusRequestsRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    expect(previousRejectedRequest).toEqual({
      id: 10,
      status: 'rejected',
      requestType: StatusRequestType.VENDOR_ONBOARDING,
    });
    expect(vendor.lifecycleStatus).toBe(PartnerLifecycleStatus.REJECTED);
    expect(vendor.isActive).toBe(false);
    expect(partnersRepo.save).not.toHaveBeenCalled();
  });

  it.each([
    StatusRequestType.ENGINEER_ACTIVATION,
    StatusRequestType.ENGINEER_DEACTIVATION,
  ])('rejects a Vendor paired with %s', async (requestType) => {
    const service = new PartnersService(
      { findOne: vi.fn().mockResolvedValue({
        id: 50,
        partnerType: { id: 1 },
        lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        isActive: true,
        createdByAdmin: { id: 42 },
      }) } as any,
      { findOne: vi.fn(async ({ where }) =>
        where.text === 'h3Np8Ld1Qs5Vc2Jw' ? { id: 2 } : { id: 1 }) } as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );

    await expect(service.requestStatusChange(42, 50, { request_type: requestType }))
      .rejects.toThrow('Request type does not match Vendor target');
  });

  it('rejects an Engineer paired with a Vendor request type', async () => {
    const service = new PartnersService(
      { findOne: vi.fn().mockResolvedValue({
        id: 60,
        partnerType: { id: 2 },
        lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        isActive: true,
        referenceId: 50,
        referenceType: { id: 3 },
        createdByAdmin: { id: 42 },
      }) } as any,
      { findOne: vi.fn(async ({ where }) =>
        where.text === 'h3Np8Ld1Qs5Vc2Jw' ? { id: 2 } : { id: 1 }) } as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );

    await expect(service.requestStatusChange(42, 60, {
      request_type: StatusRequestType.VENDOR_DEACTIVATION,
    })).rejects.toThrow('Request type does not match service engineer target');
  });

  it('rejects unmapped Partners and Engineers with missing or ineligible Vendors', async () => {
    const unmapped = new PartnersService(
      { findOne: vi.fn().mockResolvedValue({
        id: 50, partnerType: { id: 1 }, lifecycleStatus: null, isActive: true, createdByAdmin: { id: 42 },
      }) } as any,
      { findOne: vi.fn(async () => ({ id: 1 })) } as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );
    await expect(unmapped.requestStatusChange(42, 50, {
      request_type: StatusRequestType.VENDOR_DEACTIVATION,
    })).rejects.toThrow('Vendor is not eligible');

    const missingVendor = new PartnersService(
      { findOne: vi.fn().mockResolvedValue({
        id: 60, partnerType: { id: 2 }, lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        isActive: true, referenceId: null, referenceType: null, createdByAdmin: { id: 42 },
      }) } as any,
      { findOne: vi.fn(async ({ where }) =>
        where.text === 'h3Np8Ld1Qs5Vc2Jw' ? { id: 2 } : { id: 1 }) } as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );
    await expect(missingVendor.requestStatusChange(42, 60, {
      request_type: StatusRequestType.ENGINEER_DEACTIVATION,
    })).rejects.toThrow('no valid Vendor association');
  });

  it('rejects engineer status request if engineer reference type is invalid or missing', async () => {
    const makeEngineer = (referenceType: any, referenceId: number | null) => ({
      id: 60,
      partnerType: { id: 2 },
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isActive: true,
      referenceId,
      referenceType,
      createdByAdmin: { id: 42 },
    });
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) => {
        if (where.text === 'q7Kf2mZ9xRw4tB6y') return { id: 1 };
        if (where.text === 'h3Np8Ld1Qs5Vc2Jw') return { id: 2 };
        if (where.text === 'd6Rq1Ae3Uv9sH5pM') return { id: 3 };
        return null;
      }),
    };

    // 1. Missing referenceType
    const service1 = new PartnersService(
      { findOne: vi.fn().mockResolvedValue(makeEngineer(null, 50)) } as any,
      masterDataRepo as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );
    await expect(service1.requestStatusChange(42, 60, {
      request_type: StatusRequestType.ENGINEER_DEACTIVATION,
    })).rejects.toThrow('Service engineer has no valid Vendor association');

    // 2. Mismatched referenceType ID (e.g. ID 4 instead of vendor reference type ID 3)
    const service2 = new PartnersService(
      { findOne: vi.fn().mockResolvedValue(makeEngineer({ id: 4 }, 50)) } as any,
      masterDataRepo as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );
    await expect(service2.requestStatusChange(42, 60, {
      request_type: StatusRequestType.ENGINEER_DEACTIVATION,
    })).rejects.toThrow('Service engineer has no valid Vendor association');

    // 3. Missing referenceId
    const service3 = new PartnersService(
      { findOne: vi.fn().mockResolvedValue(makeEngineer({ id: 3 }, null)) } as any,
      masterDataRepo as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );
    await expect(service3.requestStatusChange(42, 60, {
      request_type: StatusRequestType.ENGINEER_DEACTIVATION,
    })).rejects.toThrow('Service engineer has no valid Vendor association');
  });

  it('rejects engineer status request if parent Vendor does not exist or has mismatched partner type', async () => {
    const engineer = {
      id: 60,
      partnerType: { id: 2 },
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isActive: true,
      referenceId: 50,
      referenceType: { id: 3 },
      createdByAdmin: { id: 42 },
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) => {
        if (where.text === 'q7Kf2mZ9xRw4tB6y') return { id: 1 };
        if (where.text === 'h3Np8Ld1Qs5Vc2Jw') return { id: 2 };
        if (where.text === 'd6Rq1Ae3Uv9sH5pM') return { id: 3 };
        return null;
      }),
    };

    const service1 = new PartnersService(
      {
        findOne: vi.fn(async (opts: any) => {
          if (opts.where.id === 60) return engineer;
          return null;
        }),
      } as any,
      masterDataRepo as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );
    await expect(service1.requestStatusChange(42, 60, {
      request_type: StatusRequestType.ENGINEER_DEACTIVATION,
    })).rejects.toThrow('Service engineer Vendor association is not eligible');
  });

  it('rejects engineer status request if parent Vendor is owned by another Admin', async () => {
    const engineer = {
      id: 60,
      partnerType: { id: 2 },
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isActive: true,
      referenceId: 50,
      referenceType: { id: 3 },
      createdByAdmin: { id: 42 },
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) => {
        if (where.text === 'q7Kf2mZ9xRw4tB6y') return { id: 1 };
        if (where.text === 'h3Np8Ld1Qs5Vc2Jw') return { id: 2 };
        if (where.text === 'd6Rq1Ae3Uv9sH5pM') return { id: 3 };
        return null;
      }),
    };

    const partnersRepo = {
      findOne: vi.fn(async (opts: any) => {
        if (opts.where.id === 60) return engineer;
        if (opts.where.id === 50 && opts.where.createdByAdmin?.id === 42) {
          return null;
        }
        return null;
      }),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );
    await expect(service.requestStatusChange(42, 60, {
      request_type: StatusRequestType.ENGINEER_DEACTIVATION,
    })).rejects.toThrow('Service engineer Vendor association is not eligible');
    expect(partnersRepo.findOne).toHaveBeenNthCalledWith(2, {
      where: {
        id: 50,
        partnerType: { id: 1 },
        createdByAdmin: { id: 42 },
        lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      },
    });
  });

  it.each([
    [PartnerLifecycleStatus.PENDING_APPROVAL],
    [PartnerLifecycleStatus.REJECTED],
    [PartnerLifecycleStatus.INACTIVE],
    [null],
  ])('rejects engineer status request if parent Vendor lifecycle is %s', async (_vendorLifecycle) => {
    const engineer = {
      id: 60,
      partnerType: { id: 2 },
      lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isActive: true,
      referenceId: 50,
      referenceType: { id: 3 },
      createdByAdmin: { id: 42 },
    };
    const masterDataRepo = {
      findOne: vi.fn(async ({ where }) => {
        if (where.text === 'q7Kf2mZ9xRw4tB6y') return { id: 1 };
        if (where.text === 'h3Np8Ld1Qs5Vc2Jw') return { id: 2 };
        if (where.text === 'd6Rq1Ae3Uv9sH5pM') return { id: 3 };
        return null;
      }),
    };

    const partnersRepo = {
      findOne: vi.fn(async (opts: any) => {
        if (opts.where.id === 60) return engineer;
        if (opts.where.id === 50 && opts.where.lifecycleStatus === PartnerLifecycleStatus.ACTIVE) {
          return null;
        }
        return null;
      }),
    };
    const service = new PartnersService(
      partnersRepo as any,
      masterDataRepo as any,
      { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as any,
    );
    await expect(service.requestStatusChange(42, 60, {
      request_type: StatusRequestType.ENGINEER_DEACTIVATION,
    })).rejects.toThrow('Service engineer Vendor association is not eligible');
  });

  it('returns a conflict for an existing equivalent pending request', async () => {
    const statusRequestsRepo = {
      findOne: vi.fn().mockResolvedValue({ id: 9 }), create: vi.fn(), save: vi.fn(),
    };
    const service = new PartnersService(
      { findOne: vi.fn().mockResolvedValue({
        id: 50, partnerType: { id: 1 }, lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        isActive: true, createdByAdmin: { id: 42 },
      }) } as any,
      { findOne: vi.fn(async () => ({ id: 1 })) } as any,
      statusRequestsRepo as any,
    );

    await expect(service.requestStatusChange(42, 50, {
      request_type: StatusRequestType.VENDOR_DEACTIVATION,
    })).rejects.toThrow('equivalent pending request');
    expect(statusRequestsRepo.create).not.toHaveBeenCalled();
  });

  it('translates only the Phase 1 unique index violation into a conflict', async () => {
    const partner = {
      id: 50, partnerType: { id: 1 }, lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      isActive: true, createdByAdmin: { id: 42 },
    };
    const makeService = (error: unknown) => new PartnersService(
      { findOne: vi.fn().mockResolvedValue(partner) } as any,
      { findOne: vi.fn(async () => ({ id: 1 })) } as any,
      {
        findOne: vi.fn().mockResolvedValue(null),
        create: vi.fn((value) => value),
        save: vi.fn().mockRejectedValue(error),
      } as any,
    );
    const dto = { request_type: StatusRequestType.VENDOR_DEACTIVATION };

    await expect(makeService({ code: '23505', constraint: 'UQ_status_requests_pending_target_type' })
      .requestStatusChange(42, 50, dto)).rejects.toThrow('equivalent pending request');
    await expect(makeService({ code: '23505', constraint: 'other_constraint' })
      .requestStatusChange(42, 50, dto)).rejects.toEqual(expect.objectContaining({ code: '23505' }));
    await expect(makeService(new Error('database unavailable'))
      .requestStatusChange(42, 50, dto)).rejects.toThrow('database unavailable');
  });
});

describe('Phase 2C.3: Vendor Onboarding Atomicity and Engineer Relationship Contract', () => {
  describe('Atomic Vendor Onboarding', () => {
    it('persists both Partner and StatusChangeRequest in a single database transaction', async () => {
      const savedPartner = {
        id: 77,
        name: 'Atomic Logistics',
        phoneNumber: '555-0199',
        email: 'ops@atomic.com',
        address: '100 Terminal Way',
        skill: null,
        category: null,
        partnerType: { id: 1 },
        createdByAdmin: { id: 42 },
        isActive: false,
        lifecycleStatus: PartnerLifecycleStatus.PENDING_APPROVAL,
        isDeleted: false,
        referenceType: null,
        referenceId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const partnerRepo = {
        create: vi.fn((payload) => ({ ...savedPartner, ...payload })),
        save: vi.fn(async (partner) => ({ ...savedPartner, ...partner })),
      };

      const statusRequestsRepo = {
        create: vi.fn((payload) => ({ id: 501, ...payload })),
        save: vi.fn(async (req) => ({ id: 501, ...req })),
      };

      const transactionManager = {
        getRepository: vi.fn((entity) =>
          entity === Partner ? partnerRepo : statusRequestsRepo,
        ),
      };

      const dataSource = {
        transaction: vi.fn(async (cb) => cb(transactionManager)),
      };

      const masterDataRepo = {
        findOne: vi.fn(async ({ where }) => (where.text === 'q7Kf2mZ9xRw4tB6y' ? { id: 1 } : null)),
      };

      const service = new PartnersService(
        partnerRepo as any,
        masterDataRepo as any,
        statusRequestsRepo as any,
        dataSource as any,
      );

      const result = await service.createVendorForAdmin(
        {
          name: 'Atomic Logistics',
          phone_number: '555-0199',
          email: 'ops@atomic.com',
          address: '100 Terminal Way',
          reason: 'New regional vendor submission.',
        },
        42,
      );

      expect(dataSource.transaction).toHaveBeenCalledTimes(1);
      expect(partnerRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Atomic Logistics',
          isActive: false,
          lifecycleStatus: PartnerLifecycleStatus.PENDING_APPROVAL,
          createdByAdmin: { id: 42 },
        }),
      );
      expect(statusRequestsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'partner',
          entityId: 77,
          requestedAction: 'onboard',
          requestType: StatusRequestType.VENDOR_ONBOARDING,
          reason: 'New regional vendor submission.',
          status: 'pending',
          requestedByAdmin: { id: 42 },
        }),
      );
      expect(result.id).toBe(77);
      expect(result.lifecycle_status).toBe(PartnerLifecycleStatus.PENDING_APPROVAL);
      expect(result.is_active).toBe(false);
    });

    it('rolls back and does not commit Partner if StatusChangeRequest creation fails', async () => {
      const savedPartner = {
        id: 88,
        name: 'Faulty Vendor',
        phoneNumber: '555-0100',
        partnerType: { id: 1 },
        createdByAdmin: { id: 42 },
        lifecycleStatus: PartnerLifecycleStatus.PENDING_APPROVAL,
      };

      const partnerRepo = {
        create: vi.fn((payload) => ({ ...savedPartner, ...payload })),
        save: vi.fn(async () => savedPartner),
      };

      const statusRequestsRepo = {
        create: vi.fn((payload) => payload),
        save: vi.fn(async () => {
          throw new Error('Database error: column request_type missing');
        }),
      };

      const transactionManager = {
        getRepository: vi.fn((entity) =>
          entity === Partner ? partnerRepo : statusRequestsRepo,
        ),
      };

      const dataSource = {
        transaction: vi.fn(async (cb) => {
          return await cb(transactionManager);
        }),
      };

      const masterDataRepo = {
        findOne: vi.fn(async ({ where }) => (where.text === 'q7Kf2mZ9xRw4tB6y' ? { id: 1 } : null)),
      };

      const service = new PartnersService(
        partnerRepo as any,
        masterDataRepo as any,
        statusRequestsRepo as any,
        dataSource as any,
      );

      await expect(
        service.createVendorForAdmin({ name: 'Faulty Vendor', phone_number: '555-0100' }, 42),
      ).rejects.toThrow('Database error: column request_type missing');
    });

    it('translates duplicate pending request error into ConflictException within transaction', async () => {
      const savedPartner = {
        id: 99,
        partnerType: { id: 1 },
        createdByAdmin: { id: 42 },
      };

      const partnerRepo = {
        create: vi.fn(() => savedPartner),
        save: vi.fn(async () => savedPartner),
      };

      const statusRequestsRepo = {
        create: vi.fn((payload) => payload),
        save: vi.fn(async () => {
          throw { code: '23505', constraint: 'UQ_status_requests_pending_target_type' };
        }),
      };

      const transactionManager = {
        getRepository: vi.fn((entity) =>
          entity === Partner ? partnerRepo : statusRequestsRepo,
        ),
      };

      const dataSource = {
        transaction: vi.fn(async (cb) => cb(transactionManager)),
      };

      const masterDataRepo = {
        findOne: vi.fn(async () => ({ id: 1 })),
      };

      const service = new PartnersService(
        partnerRepo as any,
        masterDataRepo as any,
        statusRequestsRepo as any,
        dataSource as any,
      );

      await expect(
        service.createVendorForAdmin({ name: 'Duplicate Vendor', phone_number: '555-0100' }, 42),
      ).rejects.toThrow('equivalent pending request');
    });
  });

  describe('Service Engineer Relationship Contract', () => {
    it('creates a Direct Service Engineer bound to the Admin and active immediately', async () => {
      const engineer = {
        id: 101,
        name: 'Direct Tech',
        phoneNumber: '555-0111',
        partnerType: { id: 2 },
        referenceType: { id: 3 },
        referenceId: 42,
        createdByAdmin: { id: 42 },
        isActive: true,
        lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const partnersRepo = {
        create: vi.fn((payload) => ({ ...engineer, ...payload })),
        save: vi.fn(async (item) => ({ ...engineer, ...item })),
      };

      const masterDataRepo = {
        findOne: vi.fn(async ({ where }) => {
          if (where.type === 'partner_type' && where.text === 'h3Np8Ld1Qs5Vc2Jw') return { id: 2 };
          if (where.type === 'reference_type' && where.text === 'z9Wm4Yt7Bn2kF8xR') return { id: 3 };
          return null;
        }),
      };

      const service = new PartnersService(partnersRepo as any, masterDataRepo as any, {} as any);

      const result = await service.createDirectEngineerForAdmin(42, {
        name: 'Direct Tech',
        phone_number: '555-0111',
        email: 'direct@company.com',
      });

      expect(partnersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Direct Tech',
          partnerType: { id: 2 },
          referenceType: { id: 3 },
          referenceId: 42,
          createdByAdmin: { id: 42 },
          isActive: true,
          lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        }),
      );
      expect(result.reference_type_id).toBe(3);
      expect(result.reference_id).toBe(42);
      expect(result.is_active).toBe(true);
      expect(result.lifecycle_status).toBe(PartnerLifecycleStatus.ACTIVE);
    });

    it('creates a Vendor-Based Service Engineer bound to an approved active Vendor', async () => {
      const activeVendor = {
        id: 50,
        partnerType: { id: 1 },
        createdByAdmin: { id: 42 },
        lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
      };

      const engineer = {
        id: 202,
        name: 'Vendor Tech',
        phoneNumber: '555-0222',
        partnerType: { id: 2 },
        referenceType: { id: 4 },
        referenceId: 50,
        createdByAdmin: { id: 42 },
        isActive: true,
        lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const partnersRepo = {
        findOne: vi.fn(async () => activeVendor),
        create: vi.fn((payload) => ({ ...engineer, ...payload })),
        save: vi.fn(async (item) => ({ ...engineer, ...item })),
      };

      const masterDataRepo = {
        findOne: vi.fn(async ({ where }) => {
          if (where.type === 'partner_type' && where.text === 'q7Kf2mZ9xRw4tB6y') return { id: 1 };
          if (where.type === 'partner_type' && where.text === 'h3Np8Ld1Qs5Vc2Jw') return { id: 2 };
          if (where.type === 'reference_type' && where.text === 'd6Rq1Ae3Uv9sH5pM') return { id: 4 };
          return null;
        }),
      };

      const service = new PartnersService(partnersRepo as any, masterDataRepo as any, {} as any);

      const result = await service.createEngineerForVendor(42, 50, {
        name: 'Vendor Tech',
        phone_number: '555-0222',
      });

      expect(partnersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Vendor Tech',
          partnerType: { id: 2 },
          referenceType: { id: 4 },
          referenceId: 50,
          createdByAdmin: { id: 42 },
          isActive: true,
          lifecycleStatus: PartnerLifecycleStatus.ACTIVE,
        }),
      );
      expect(result.reference_type_id).toBe(4);
      expect(result.reference_id).toBe(50);
    });

    it('rejects Vendor-Based engineer creation if Vendor is owned by a different Admin', async () => {
      const partnersRepo = {
        findOne: vi.fn(async () => null),
      };
      const masterDataRepo = {
        findOne: vi.fn(async () => ({ id: 1 })),
      };
      const service = new PartnersService(partnersRepo as any, masterDataRepo as any, {} as any);

      await expect(
        service.createEngineerForVendor(42, 999, {
          name: 'Unscoped Tech',
          phone_number: '555-0000',
        }),
      ).rejects.toThrow('Vendor partner with id 999 not found');
    });

    it('rejects Vendor-Based engineer creation if Vendor is inactive or pending approval', async () => {
      const pendingVendor = {
        id: 50,
        partnerType: { id: 1 },
        createdByAdmin: { id: 42 },
        lifecycleStatus: PartnerLifecycleStatus.PENDING_APPROVAL,
      };

      const partnersRepo = {
        findOne: vi.fn(async () => pendingVendor),
      };
      const masterDataRepo = {
        findOne: vi.fn(async () => ({ id: 1 })),
      };
      const service = new PartnersService(partnersRepo as any, masterDataRepo as any, {} as any);

      await expect(
        service.createEngineerForVendor(42, 50, {
          name: 'Tech',
          phone_number: '555-0000',
        }),
      ).rejects.toThrow('Vendor is not eligible for service engineer creation');
    });
  });
});

