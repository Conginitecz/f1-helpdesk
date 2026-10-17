import { apiClient } from './api-client'
import { isApiConfigured } from './auth'

export const MASTER_DATA_TYPES = [
  'partner_type',
  'reference_type',
  'inventory_type',
  'inventory_category',
  'service_engineer_skill',
  'service_engineer_category',
] as const

export type MasterDataType = (typeof MASTER_DATA_TYPES)[number]

export interface MasterDataItem {
  id: string
  type: MasterDataType
  text: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface MasterDataApiResponse {
  id: number
  type: string
  text: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateMasterDataInput {
  type: MasterDataType
  text: string
}

export interface UpdateMasterDataInput {
  text: string
}

export function masterDataTypeLabel(type: MasterDataType): string {
  switch (type) {
    case 'partner_type':
      return 'Partner Types'
    case 'reference_type':
      return 'Reference Types'
    case 'inventory_type':
      return 'Inventory Types'
    case 'inventory_category':
      return 'Inventory Categories'
    case 'service_engineer_skill':
      return 'Engineer Skills'
    case 'service_engineer_category':
      return 'Engineer Categories'
    default:
      return type
  }
}

export function mapMasterDataResponse(row: MasterDataApiResponse): MasterDataItem {
  return {
    id: String(row.id),
    type: row.type as MasterDataType,
    text: row.text,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

let mockMasterData: MasterDataItem[] = [
  { id: 'md-1', type: 'service_engineer_skill', text: 'CCTV & Surveillance', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-2', type: 'service_engineer_skill', text: 'Fiber Optic Splicing', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-3', type: 'service_engineer_skill', text: 'Network Routing & Switching', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-4', type: 'service_engineer_skill', text: 'HVAC & Electrical Power', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-5', type: 'service_engineer_category', text: 'Level 1 Field Technician', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-6', type: 'service_engineer_category', text: 'Level 2 Senior Specialist', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-7', type: 'service_engineer_category', text: 'Emergency Dispatch Lead', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-8', type: 'inventory_category', text: 'Security', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-9', type: 'inventory_category', text: 'Networking', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-10', type: 'inventory_category', text: 'Hardware', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-11', type: 'inventory_category', text: 'Cabling', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-12', type: 'partner_type', text: 'Hardware Maintenance Vendor', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-13', type: 'partner_type', text: 'Fiber & Infrastructure Partner', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-14', type: 'reference_type', text: 'Work Order Ticket', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'md-15', type: 'reference_type', text: 'Asset Serial Number', isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const delay = (ms = 100) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const masterDataService = {
  snapshot(): MasterDataItem[] {
    return mockMasterData.map((item) => ({ ...item }))
  },

  async list(role: 'SUPER_ADMIN' | 'ADMIN' = 'SUPER_ADMIN', type?: MasterDataType): Promise<MasterDataItem[]> {
    if (isApiConfigured()) {
      const base = role === 'SUPER_ADMIN' ? 'super-admin/master-data' : 'admin/master-data'
      const endpoint = type ? `${base}?type=${encodeURIComponent(type)}` : base
      const rows = await apiClient.getAuth<MasterDataApiResponse[]>(endpoint)
      const mapped = rows.map(mapMasterDataResponse)
      if (type) {
        mockMasterData = [...mockMasterData.filter((i) => i.type !== type), ...mapped]
      } else {
        mockMasterData = mapped
      }
      return mapped
    }

    await delay()
    let items = mockMasterData.map((i) => ({ ...i }))
    if (role === 'ADMIN') {
      items = items.filter((i) => i.isActive)
    }
    if (type) {
      items = items.filter((i) => i.type === type)
    }
    return items
  },

  async create(input: CreateMasterDataInput): Promise<MasterDataItem> {
    const trimmed = input.text.trim()
    if (!trimmed) {
      throw new Error('Master data entry text cannot be empty.')
    }

    if (isApiConfigured()) {
      const res = await apiClient.postAuth<MasterDataApiResponse>('super-admin/master-data', {
        type: input.type,
        text: trimmed,
      })
      const mapped = mapMasterDataResponse(res)
      mockMasterData = [...mockMasterData.filter((i) => i.id !== mapped.id), mapped]
      return mapped
    }

    await delay()
    const duplicate = mockMasterData.find(
      (i) => i.type === input.type && i.text.toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) {
      throw new Error('A row with this type and text already exists')
    }

    const created: MasterDataItem = {
      id: `md-${Date.now()}`,
      type: input.type,
      text: trimmed,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockMasterData = [...mockMasterData, created]
    return created
  },

  async update(id: string | number, text: string): Promise<MasterDataItem> {
    const trimmed = text.trim()
    if (!trimmed) {
      throw new Error('Master data entry text cannot be empty.')
    }

    const numericId = typeof id === 'string' ? Number(id.replace(/^md-/, '')) : id

    if (isApiConfigured()) {
      if (Number.isNaN(numericId)) {
        throw new Error(`Invalid master data ID: ${id}`)
      }
      const res = await apiClient.patchAuth<MasterDataApiResponse>(`super-admin/master-data/${numericId}`, {
        text: trimmed,
      })
      const mapped = mapMasterDataResponse(res)
      mockMasterData = mockMasterData.map((item) => (item.id === mapped.id ? mapped : item))
      return mapped
    }

    await delay()
    const strId = String(id)
    const existing = mockMasterData.find((i) => i.id === strId)
    if (!existing) {
      throw new Error(`Master data row with id ${id} not found`)
    }

    const duplicate = mockMasterData.find(
      (i) => i.id !== strId && i.type === existing.type && i.text.toLowerCase() === trimmed.toLowerCase(),
    )
    if (duplicate) {
      throw new Error('A row with this type and text already exists')
    }

    const updated: MasterDataItem = {
      ...existing,
      text: trimmed,
      updatedAt: new Date().toISOString(),
    }
    mockMasterData = mockMasterData.map((i) => (i.id === strId ? updated : i))
    return updated
  },
}

export default masterDataService
