import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { Role } from './roles.enum.js';

describe('AuthService.getMe', () => {
  const mockSuperAdminsRepo = {
    findOne: vi.fn(),
  };
  const mockAdminsRepo = {
    findOne: vi.fn(),
  };
  const mockJwtService = {
    sign: vi.fn(),
    verifyAsync: vi.fn(),
  };

  const service = new AuthService(
    mockSuperAdminsRepo as any,
    mockAdminsRepo as any,
    mockJwtService as any,
  );

  it('returns super admin profile with display_name and null location', async () => {
    mockSuperAdminsRepo.findOne.mockResolvedValueOnce({
      id: 1,
      email: 'superadmin@f1helpdesk.com',
      username: 'superadmin',
      firstName: 'Jordan',
      lastName: 'Lee',
    });

    const result = await service.getMe(1, Role.SUPER_ADMIN);
    expect(result).toEqual({
      id: 1,
      role: Role.SUPER_ADMIN,
      display_name: 'Jordan Lee',
      username: 'superadmin',
      email: 'superadmin@f1helpdesk.com',
      location_id: null,
      location_name: null,
    });
    expect(mockSuperAdminsRepo.findOne).toHaveBeenCalledWith({
      select: { id: true, email: true, username: true, firstName: true, lastName: true },
      where: { id: 1 },
    });
  });

  it('throws NotFoundException if super admin is not found', async () => {
    mockSuperAdminsRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.getMe(99, Role.SUPER_ADMIN)).rejects.toThrow(NotFoundException);
  });

  it('returns admin profile with display_name and resolved location', async () => {
    mockAdminsRepo.findOne.mockResolvedValueOnce({
      id: 2,
      email: 'admin@f1helpdesk.com',
      username: 'admin',
      firstName: 'Olivia',
      lastName: 'Martin',
      location: { id: 10, name: 'Downtown HQ' },
    });

    const result = await service.getMe(2, Role.ADMIN);
    expect(result).toEqual({
      id: 2,
      role: Role.ADMIN,
      display_name: 'Olivia Martin',
      username: 'admin',
      email: 'admin@f1helpdesk.com',
      location_id: 10,
      location_name: 'Downtown HQ',
    });
  });

  it('throws NotFoundException if admin is not found', async () => {
    mockAdminsRepo.findOne.mockResolvedValueOnce(null);

    await expect(service.getMe(88, Role.ADMIN)).rejects.toThrow(NotFoundException);
  });
});
