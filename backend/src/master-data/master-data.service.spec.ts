import { describe, expect, it, vi } from 'vitest';
import { MasterDataService } from './master-data.service.js';

describe('MasterDataService admin reads', () => {
  it('filters active rows by the optional type', async () => {
    const now = new Date();
    const row = {
      id: 5,
      type: 'inventory_category',
      text: 'Test category',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const masterDataRepo = { find: vi.fn(async () => [row]) };
    const service = new MasterDataService(masterDataRepo as any);

    const result = await service.findActive('inventory_category');

    expect(masterDataRepo.find).toHaveBeenCalledWith({
      where: { type: 'inventory_category', isActive: true },
      order: { type: 'ASC', id: 'ASC' },
    });
    expect(result).toEqual([
      {
        id: 5,
        type: 'inventory_category',
        text: 'Test category',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  });
});