import { apiClient } from './api-client'
import { isApiConfigured } from './auth'

export interface ConfigurationItem {
  id: string
  key: string
  value: string
  description: string | null
  updatedBy: string | null
  updatedAt: string
}

export interface ConfigurationApiResponse {
  id: number
  config_key: string
  config_value: string
  description: string | null
  updated_by_super_admin_id: number | null
  updated_at: string
}

export const ALLOWED_CONFIG_KEYS = [
  'session_idle_timeout_minutes',
  'max_vendor_attachment_mb',
  'default_timezone',
] as const

export function configKeyTitle(key: string): string {
  switch (key) {
    case 'session_idle_timeout_minutes':
      return 'Session idle timeout'
    case 'max_vendor_attachment_mb':
      return 'Max vendor attachment size'
    case 'default_timezone':
      return 'Default timezone'
    default:
      return key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

export function configDisplayValue(key: string, value: string): string {
  switch (key) {
    case 'session_idle_timeout_minutes':
      return `${value} minutes`
    case 'max_vendor_attachment_mb':
      return `${value} MB`
    default:
      return value
  }
}

export function mapConfigurationResponse(row: ConfigurationApiResponse): ConfigurationItem {
  return {
    id: String(row.id),
    key: row.config_key,
    value: row.config_value,
    description: row.description,
    updatedBy: row.updated_by_super_admin_id ? `Super Admin #${row.updated_by_super_admin_id}` : null,
    updatedAt: row.updated_at,
  }
}

let mockConfigs: ConfigurationItem[] = [
  {
    id: 'cfg-1',
    key: 'session_idle_timeout_minutes',
    value: '30',
    description: 'Session idle timeout in minutes for operational accounts',
    updatedBy: 'Super Admin',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cfg-2',
    key: 'max_vendor_attachment_mb',
    value: '10',
    description: 'Maximum vendor onboarding document attachment size',
    updatedBy: 'Super Admin',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cfg-3',
    key: 'default_timezone',
    value: 'UTC',
    description: 'Default operational facility timezone for scheduling',
    updatedBy: 'Super Admin',
    updatedAt: new Date().toISOString(),
  },
]

const delay = (ms = 100) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const configurationService = {
  snapshot(): ConfigurationItem[] {
    return mockConfigs.map((c) => ({ ...c }))
  },

  async list(): Promise<ConfigurationItem[]> {
    if (isApiConfigured()) {
      const rows = await apiClient.getAuth<ConfigurationApiResponse[]>('super-admin/config')
      const mapped = rows.map(mapConfigurationResponse)
      mockConfigs = mapped
      return mapped
    }

    await delay()
    return mockConfigs.map((c) => ({ ...c }))
  },

  async update(key: string, value: string): Promise<ConfigurationItem> {
    const trimmed = value.trim()
    if (!trimmed) {
      throw new Error('Configuration value cannot be empty.')
    }

    if (isApiConfigured()) {
      const res = await apiClient.patchAuth<ConfigurationApiResponse>(`super-admin/config/${encodeURIComponent(key)}`, {
        config_value: trimmed,
      })
      const mapped = mapConfigurationResponse(res)
      mockConfigs = mockConfigs.map((item) => (item.key === mapped.key ? mapped : item))
      return mapped
    }

    await delay()
    const found = mockConfigs.find((c) => c.key === key)
    if (!found) {
      throw new Error(`Configuration key ${key} not found.`)
    }
    const updated: ConfigurationItem = {
      ...found,
      value: trimmed,
      updatedAt: new Date().toISOString(),
    }
    mockConfigs = mockConfigs.map((c) => (c.key === key ? updated : c))
    return updated
  },
}

export default configurationService
