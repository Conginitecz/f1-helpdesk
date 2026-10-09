import { describe, expect, it, vi } from 'vitest';
import { PartnersService } from './partners.service.js';

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
});
