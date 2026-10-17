import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  configurationService,
  configKeyTitle,
  configDisplayValue,
  mapConfigurationResponse,
  type ConfigurationApiResponse,
  ALLOWED_CONFIG_KEYS,
} from '../lib/config-service'

describe('Configuration Service', () => {
  it('formats titles and display values for known configuration keys', () => {
    assert.strictEqual(configKeyTitle('session_idle_timeout_minutes'), 'Session idle timeout')
    assert.strictEqual(configKeyTitle('max_vendor_attachment_mb'), 'Max vendor attachment size')
    assert.strictEqual(configKeyTitle('default_timezone'), 'Default timezone')

    assert.strictEqual(configDisplayValue('session_idle_timeout_minutes', '45'), '45 minutes')
    assert.strictEqual(configDisplayValue('max_vendor_attachment_mb', '20'), '20 MB')
    assert.strictEqual(configDisplayValue('default_timezone', 'America/New_York'), 'America/New_York')
  })

  it('maps backend configuration response', () => {
    const raw: ConfigurationApiResponse = {
      id: 1,
      config_key: 'session_idle_timeout_minutes',
      config_value: '30',
      description: 'Session timeout description',
      updated_by_super_admin_id: 1,
      updated_at: '2026-10-15T10:00:00Z',
    }
    const mapped = mapConfigurationResponse(raw)
    assert.strictEqual(mapped.id, '1')
    assert.strictEqual(mapped.key, 'session_idle_timeout_minutes')
    assert.strictEqual(mapped.value, '30')
    assert.strictEqual(mapped.description, 'Session timeout description')
    assert.strictEqual(mapped.updatedBy, 'Super Admin #1')
  })

  it('lists existing configurations', async () => {
    const configs = await configurationService.list()
    assert.ok(configs.length >= 3)
    for (const key of ALLOWED_CONFIG_KEYS) {
      assert.ok(configs.some((c) => c.key === key))
    }
  })

  it('updates configuration value successfully', async () => {
    const updated = await configurationService.update('session_idle_timeout_minutes', '60')
    assert.strictEqual(updated.key, 'session_idle_timeout_minutes')
    assert.strictEqual(updated.value, '60')

    const snapshot = configurationService.snapshot()
    const found = snapshot.find((c) => c.key === 'session_idle_timeout_minutes')
    assert.strictEqual(found?.value, '60')
  })

  it('rejects empty configuration values', async () => {
    await assert.rejects(
      async () => {
        await configurationService.update('session_idle_timeout_minutes', '   ')
      },
      /Configuration value cannot be empty./,
    )
  })

  it('rejects updating non-existent configuration key', async () => {
    await assert.rejects(
      async () => {
        await configurationService.update('non_existent_key_xyz', 'value')
      },
      /Configuration key non_existent_key_xyz not found/,
    )
  })
})
