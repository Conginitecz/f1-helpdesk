import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { Role } from '../auth/roles.enum.js';
import { InventoryService } from './inventory.service.js';

describe('InventoryService', () => {
  it('rejects super-admin inventory creation without a location_id', async () => {
    const inventoryRepo = {
      create: vi.fn(),
      find: vi.fn(),
      findOne: vi.fn(),
      save: vi.fn(),
    };
    const locationRepo = {
      findOne: vi.fn(),
    };
    const masterDataRepo = {
      findOne: vi.fn(),
    };
    const adminRepo = {
      findOne: vi.fn(),
    };

    const service = new InventoryService(
      inventoryRepo as any,
      locationRepo as any,
      masterDataRepo as any,
      adminRepo as any,
    );

    await expect(
      service.create(
        {
          name: 'Test item',
          type_id: undefined,
          category_id: undefined,
          location_id: 1,
          units: 5,
          price_per_unit: '12.50',
          tax_applicable: false,
          tax_percentage: undefined,
        },
        { userId: 7, role: Role.SUPER_ADMIN },
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('uses the admin location instead of a client-supplied location_id', async () => {
    const inventoryRepo = {
      create: vi.fn((payload) => payload),
      find: vi.fn(),
      findOne: vi.fn(async () => ({
        id: 55,
        name: 'Admin item',
        type: null,
        category: null,
        units: 2,
        pricePerUnit: '3.50',
        taxApplicable: false,
        taxPercentage: null,
        location: { id: 4 },
        createdByAdmin: { id: 8 },
        createdBySuperAdmin: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      save: vi.fn(async (payload) => ({ ...payload, id: 55 })),
    };
    const locationRepo = {
      findOne: vi.fn(async () => ({ id: 4, isActive: true })),
    };
    const masterDataRepo = { findOne: vi.fn() };
    const adminRepo = {
      findOne: vi.fn(async () => ({
        id: 8,
        isActive: true,
        isDeleted: false,
        location: { id: 4 },
      })),
    };
    const service = new InventoryService(
      inventoryRepo as any,
      locationRepo as any,
      masterDataRepo as any,
      adminRepo as any,
    );

    const result = await service.createForAdmin(
      {
        name: 'Admin item',
        type_id: undefined,
        category_id: undefined,
        location_id: 99,
        units: 2,
        price_per_unit: '3.50',
        tax_applicable: false,
        tax_percentage: undefined,
      },
      { userId: 8, role: Role.ADMIN },
    );

    expect(result.location_id).toBe(4);
    expect(inventoryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        location: { id: 4 },
        createdByAdmin: { id: 8 },
      }),
    );
  });
});
