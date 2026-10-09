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

    const service = new InventoryService(
      inventoryRepo as any,
      locationRepo as any,
      masterDataRepo as any,
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
});
