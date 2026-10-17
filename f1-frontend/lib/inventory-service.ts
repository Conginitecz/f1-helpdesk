import { apiClient } from './api-client'
import { isApiConfigured } from './auth'

export interface InventoryItem {
  id: string
  name: string
  category: string
  quantity: number
  pricePerUnit: string
  value: string
  locationId: number | null
  location: string
  status: 'ACTIVE' | 'INACTIVE'
  taxApplicable: boolean
  taxPercentage: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateInventoryInput {
  name: string
  units?: number
  price_per_unit: string
  tax_applicable?: boolean
  tax_percentage?: string
  location_id?: number
  category?: string
}

export interface UpdateInventoryInput {
  name?: string
  units?: number
  price_per_unit?: string
  tax_applicable?: boolean
  tax_percentage?: string
  location_id?: number
  is_active?: boolean
  category?: string
}

export interface InventoryApiResponse {
  id: number
  name: string
  type_id: number | null
  category_id: number | null
  units: number
  price_per_unit: string
  tax_applicable: boolean
  tax_percentage: string | null
  location_id: number
  location_name: string
  created_by_admin_id: number | null
  created_by_super_admin_id: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export function mapInventoryResponse(row: InventoryApiResponse): InventoryItem {
  const priceNum = parseFloat(row.price_per_unit) || 0
  return {
    id: String(row.id),
    name: row.name,
    category: row.category_id ? `Category #${row.category_id}` : 'General',
    quantity: row.units ?? 0,
    pricePerUnit: row.price_per_unit,
    value: `$${priceNum.toFixed(2)}`,
    locationId: row.location_id,
    location: row.location_name || `Location #${row.location_id}`,
    status: row.is_active ? 'ACTIVE' : 'INACTIVE',
    taxApplicable: row.tax_applicable,
    taxPercentage: row.tax_percentage ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

let inventoryItems: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'CCTV Camera',
    category: 'Security',
    quantity: 24,
    pricePerUnit: '148.00',
    value: '$148.00',
    locationId: 1,
    location: 'Downtown HQ',
    status: 'ACTIVE',
    taxApplicable: true,
    taxPercentage: '5.00',
  },
  {
    id: 'inv-2',
    name: 'Network Router',
    category: 'Networking',
    quantity: 12,
    pricePerUnit: '220.00',
    value: '$220.00',
    locationId: 2,
    location: 'North Campus',
    status: 'ACTIVE',
    taxApplicable: true,
    taxPercentage: '5.00',
  },
  {
    id: 'inv-3',
    name: 'Power Supply Unit',
    category: 'Hardware',
    quantity: 18,
    pricePerUnit: '64.00',
    value: '$64.00',
    locationId: 1,
    location: 'Downtown HQ',
    status: 'ACTIVE',
    taxApplicable: false,
    taxPercentage: null,
  },
  {
    id: 'inv-4',
    name: 'Fiber Patch Cable',
    category: 'Cabling',
    quantity: 86,
    pricePerUnit: '12.50',
    value: '$12.50',
    locationId: 3,
    location: 'West Operations',
    status: 'ACTIVE',
    taxApplicable: false,
    taxPercentage: null,
  },
]

const delay = (ms = 120) => new Promise((resolve) => window.setTimeout(resolve, ms))

export const inventoryService = {
  snapshot(): InventoryItem[] {
    return inventoryItems.map((item) => ({ ...item }))
  },

  async list(role: 'SUPER_ADMIN' | 'ADMIN' = 'SUPER_ADMIN', locationId?: number, search = ''): Promise<InventoryItem[]> {
    if (isApiConfigured()) {
      const endpoint =
        role === 'ADMIN'
          ? 'admin/inventory'
          : locationId !== undefined
            ? `super-admin/inventory?location_id=${locationId}`
            : 'super-admin/inventory'

      const rows = await apiClient.getAuth<InventoryApiResponse[]>(endpoint)
      const mapped = rows.map(mapInventoryResponse)
      inventoryItems = mapped

      const query = search.trim().toLowerCase()
      return query
        ? mapped.filter(
            (item) =>
              item.name.toLowerCase().includes(query) ||
              item.category.toLowerCase().includes(query) ||
              item.location.toLowerCase().includes(query),
          )
        : mapped
    }

    await delay()
    let current = inventoryItems.map((item) => ({ ...item }))
    if (role === 'ADMIN') {
      current = current.filter((item) => item.location === 'Downtown HQ')
    } else if (locationId !== undefined) {
      current = current.filter((item) => item.locationId === locationId)
    }

    const query = search.trim().toLowerCase()
    return query
      ? current.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query) ||
            item.location.toLowerCase().includes(query),
        )
      : current
  },

  async create(role: 'SUPER_ADMIN' | 'ADMIN', input: CreateInventoryInput): Promise<InventoryItem> {
    const trimmedName = input.name.trim()
    if (!trimmedName) {
      throw new Error('Item name is required.')
    }
    const trimmedPrice = input.price_per_unit.trim()
    if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
      throw new Error('Unit price must be a decimal string like 12.50')
    }

    if (isApiConfigured()) {
      const payload: Record<string, unknown> = {
        name: trimmedName,
        price_per_unit: trimmedPrice,
        units: input.units ?? 0,
        tax_applicable: Boolean(input.tax_applicable),
      }
      if (input.tax_applicable && input.tax_percentage) {
        payload.tax_percentage = input.tax_percentage.trim()
      }
      if (role === 'SUPER_ADMIN') {
        if (input.location_id === undefined || input.location_id === null) {
          throw new Error('Location is required for Super Admin inventory creation.')
        }
        payload.location_id = input.location_id
      }

      const endpoint = role === 'SUPER_ADMIN' ? 'super-admin/inventory' : 'admin/inventory'
      const createdRow = await apiClient.postAuth<InventoryApiResponse>(endpoint, payload)
      const createdItem = mapInventoryResponse(createdRow)
      if (input.category) {
        createdItem.category = input.category
      }

      inventoryItems = [...inventoryItems.filter((i) => i.id !== createdItem.id), createdItem]
      return { ...createdItem }
    }

    await delay()
    const priceNum = parseFloat(trimmedPrice) || 0
    const created: InventoryItem = {
      id: `inv-${Date.now()}`,
      name: trimmedName,
      category: input.category || 'General',
      quantity: input.units ?? 0,
      pricePerUnit: trimmedPrice,
      value: `$${priceNum.toFixed(2)}`,
      locationId: input.location_id ?? 1,
      location: role === 'SUPER_ADMIN' ? `Location #${input.location_id ?? 1}` : 'Downtown HQ',
      status: 'ACTIVE',
      taxApplicable: Boolean(input.tax_applicable),
      taxPercentage: input.tax_percentage ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    inventoryItems = [...inventoryItems, created]
    return { ...created }
  },

  async update(id: string | number, input: UpdateInventoryInput): Promise<InventoryItem> {
    const numericId = typeof id === 'string' ? Number(id.replace(/^inv-/, '')) : id

    if (isApiConfigured()) {
      if (Number.isNaN(numericId)) {
        throw new Error(`Invalid inventory item id: ${id}`)
      }

      const payload: Record<string, unknown> = {}
      if (input.name !== undefined) {
        const trimmed = input.name.trim()
        if (!trimmed) throw new Error('Item name cannot be empty.')
        payload.name = trimmed
      }
      if (input.price_per_unit !== undefined) {
        const trimmedPrice = input.price_per_unit.trim()
        if (!/^\d+(\.\d{1,2})?$/.test(trimmedPrice)) {
          throw new Error('Unit price must be a decimal string like 12.50')
        }
        payload.price_per_unit = trimmedPrice
      }
      if (input.units !== undefined) {
        payload.units = input.units
      }
      if (input.tax_applicable !== undefined) {
        payload.tax_applicable = input.tax_applicable
      }
      if (input.tax_percentage !== undefined) {
        payload.tax_percentage = input.tax_percentage ? input.tax_percentage.trim() : null
      }
      if (input.location_id !== undefined) {
        payload.location_id = input.location_id
      }
      if (input.is_active !== undefined) {
        payload.is_active = input.is_active
      }

      const updatedRow = await apiClient.patchAuth<InventoryApiResponse>(`super-admin/inventory/${numericId}`, payload)
      const updatedItem = mapInventoryResponse(updatedRow)
      if (input.category) {
        updatedItem.category = input.category
      }

      inventoryItems = inventoryItems.map((item) => (item.id === String(updatedItem.id) ? updatedItem : item))
      return { ...updatedItem }
    }

    await delay()
    const strId = String(id)
    const existing = inventoryItems.find((item) => item.id === strId)
    if (!existing) {
      throw new Error(`Inventory item ${id} not found.`)
    }

    const price = input.price_per_unit !== undefined ? input.price_per_unit.trim() : existing.pricePerUnit
    const priceNum = parseFloat(price) || 0
    const updated: InventoryItem = {
      ...existing,
      name: input.name !== undefined ? input.name.trim() : existing.name,
      category: input.category || existing.category,
      quantity: input.units !== undefined ? input.units : existing.quantity,
      pricePerUnit: price,
      value: `$${priceNum.toFixed(2)}`,
      locationId: input.location_id !== undefined ? input.location_id : existing.locationId,
      status: input.is_active !== undefined ? (input.is_active ? 'ACTIVE' : 'INACTIVE') : existing.status,
      taxApplicable: input.tax_applicable !== undefined ? input.tax_applicable : existing.taxApplicable,
      taxPercentage: input.tax_percentage !== undefined ? input.tax_percentage : existing.taxPercentage,
      updatedAt: new Date().toISOString(),
    }

    inventoryItems = inventoryItems.map((item) => (item.id === strId ? updated : item))
    return { ...updated }
  },
}
