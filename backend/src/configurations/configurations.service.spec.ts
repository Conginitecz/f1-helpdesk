import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { ConfigurationsService } from './configurations.service.js';

function makeService(existing: Record<string, unknown> | null = null) {
  const row = {
    id: 1,
    configKey: existing?.configKey ?? 'default_timezone',
    configValue: existing?.configValue ?? 'UTC',
    description: null,
    updatedBySuperAdminId: 7,
    updatedAt: new Date(),
    ...existing,
  };
  const repo = {
    findOne: vi.fn().mockResolvedValue(existing ? row : null),
    create: vi.fn((value) => ({ ...row, ...value })),
    save: vi.fn(async (value) => ({ ...row, ...value })),
  };
  return { service: new ConfigurationsService(repo as any), repo, row };
}

describe('ConfigurationsService editable-key policy', () => {
  it.each(['session_idle_timeout_minutes', 'max_vendor_attachment_mb', 'default_timezone'])(
    'allows creating %s', async (key) => {
      const { service, repo } = makeService();
      await service.create({ key, value: '10' }, 7);
      expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ configKey: key }));
      expect(repo.save).toHaveBeenCalled();
    },
  );

  it.each(['arbitrary_key', 'min_service_charge'])('rejects creating %s', async (key) => {
    const { service, repo } = makeService();
    await expect(service.create({ key, value: '10' }, 7)).rejects.toThrow(BadRequestException);
    expect(repo.findOne).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it.each(['arbitrary_key', 'min_service_charge'])('rejects updating %s without changing its value', async (key) => {
    const { service, repo, row } = makeService({ configKey: key, configValue: '500' });
    await expect(service.update(key, { config_value: '999' }, 7)).rejects.toThrow(BadRequestException);
    expect(row.configValue).toBe('500');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it.each(['session_idle_timeout_minutes', 'max_vendor_attachment_mb', 'default_timezone'])(
    'allows updating %s', async (key) => {
      const { service, repo } = makeService({ configKey: key, configValue: 'old' });
      await service.update(key, { config_value: 'new' }, 7);
      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ configKey: key, configValue: 'new' }));
    },
  );
});
