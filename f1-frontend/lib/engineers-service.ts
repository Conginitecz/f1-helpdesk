import { apiClient, ApiError } from './api-client'
import { isApiConfigured } from './auth'
import { adminService } from './admin-service'
import { vendorService, type PartnerApiResponse } from './vendors-service'

export type EngineerRelationship = 'DIRECT' | 'VENDOR_BASED'
export type EngineerStatus = 'ACTIVE' | 'INACTIVE'
export type EngineerRequestAction = 'ACTIVATE' | 'DEACTIVATE'

export type EngineerRecord = {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  skill?: string
  category?: string
  ownerAdminId: string
  ownerAdmin: string
  locationId: string
  location: string
  relationship: EngineerRelationship
  vendorId?: string
  vendor?: string
  status: EngineerStatus
}

export type EngineerStatusRequest = {
  id: string
  type: `SERVICE_ENGINEER_${'ACTIVATION' | 'DEACTIVATION'}`
  engineerId: string
  engineerName: string
  action: EngineerRequestAction
  requesterId: string
  requester: string
  location: string
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

function mapEngineerResponse(row: PartnerApiResponse): EngineerRecord {
  const admins = adminService.snapshot()
  const matchedAdmin = admins.find((a) => String(a.id) === String(row.created_by_admin_id))
  const ownerName = matchedAdmin ? matchedAdmin.name : `Admin #${row.created_by_admin_id}`
  const locationName = matchedAdmin ? matchedAdmin.location : 'Downtown HQ'
  const locationId = matchedAdmin?.location_id ? String(matchedAdmin.location_id) : 'loc-1'

  const vendors = vendorService.snapshot()
  const isVendorRef = Boolean(row.reference_id && row.reference_id !== row.created_by_admin_id)
  const matchedVendor = isVendorRef
    ? vendors.find((v) => String(v.id) === String(row.reference_id))
    : undefined

  const relationship: EngineerRelationship = isVendorRef ? 'VENDOR_BASED' : 'DIRECT'

  return {
    id: String(row.id),
    name: row.name,
    phone: row.phone_number,
    email: row.email ?? undefined,
    address: row.address ?? undefined,
    skill: row.skill_id ? String(row.skill_id) : undefined,
    category: row.category_id ? String(row.category_id) : undefined,
    ownerAdminId: String(row.created_by_admin_id),
    ownerAdmin: ownerName,
    locationId,
    location: locationName,
    relationship,
    vendorId: isVendorRef && row.reference_id ? String(row.reference_id) : undefined,
    vendor: matchedVendor ? matchedVendor.name : isVendorRef && row.reference_id ? `Vendor #${row.reference_id}` : undefined,
    status: row.is_active ? 'ACTIVE' : 'INACTIVE',
  }
}

let records: EngineerRecord[] = [
  {
    id: 'e-1',
    name: 'Marcus Chen',
    phone: '(512) 555-0101',
    email: 'marcus.chen@example.com',
    address: 'Downtown HQ',
    ownerAdminId: 'a-1',
    ownerAdmin: 'Olivia Martin',
    locationId: 'loc-1',
    location: 'Downtown HQ',
    relationship: 'VENDOR_BASED',
    vendorId: 'v-1',
    vendor: 'Apex Technical Services',
    status: 'ACTIVE',
  },
  {
    id: 'e-2',
    name: 'Priya Shah',
    phone: '(512) 555-0102',
    ownerAdminId: 'a-1',
    ownerAdmin: 'Olivia Martin',
    locationId: 'loc-1',
    location: 'Downtown HQ',
    relationship: 'DIRECT',
    status: 'ACTIVE',
  },
  {
    id: 'e-3',
    name: 'Ethan Brooks',
    phone: '(512) 555-0103',
    ownerAdminId: 'a-1',
    ownerAdmin: 'Olivia Martin',
    locationId: 'loc-1',
    location: 'Downtown HQ',
    relationship: 'VENDOR_BASED',
    vendorId: 'v-3',
    vendor: 'BluePeak Maintenance',
    status: 'INACTIVE',
  },
  {
    id: 'e-4',
    name: 'Sofia Rodriguez',
    phone: '(512) 555-0104',
    ownerAdminId: 'a-2',
    ownerAdmin: 'Noah Williams',
    locationId: 'loc-2',
    location: 'North Campus',
    relationship: 'DIRECT',
    status: 'ACTIVE',
  },
]

let requests: EngineerStatusRequest[] = [
  {
    id: 'REQ-ENG-101',
    type: 'SERVICE_ENGINEER_ACTIVATION',
    engineerId: 'e-3',
    engineerName: 'Ethan Brooks',
    action: 'ACTIVATE',
    requesterId: 'a-1',
    requester: 'Olivia Martin',
    location: 'Downtown HQ',
    reason: 'Engineer completed required field training.',
    status: 'PENDING',
    createdAt: '2026-10-12T09:00:00.000Z',
  },
]

const delay = () => new Promise((resolve) => window.setTimeout(resolve, 120))

export const engineerService = {
  snapshot: () => records.map((record) => ({ ...record })),
  requests: () => requests.map((request) => ({ ...request })),
  async list(role?: 'SUPER_ADMIN' | 'ADMIN', search = ''): Promise<EngineerRecord[]> {
    if (isApiConfigured()) {
      const endpoint = role === 'ADMIN' ? 'admin/partners?type=engineer' : 'super-admin/partners?type=engineer'
      const rows = await apiClient.getAuth<PartnerApiResponse[]>(endpoint)
      const mapped = rows.map(mapEngineerResponse)
      records = mapped
      return search
        ? mapped.filter((r) =>
            `${r.name} ${r.ownerAdmin} ${r.location}`.toLowerCase().includes(search.toLowerCase()),
          )
        : mapped
    }
    const current = records.map((record) => ({ ...record }))
    return search
      ? current.filter((r) =>
          `${r.name} ${r.ownerAdmin} ${r.location}`.toLowerCase().includes(search.toLowerCase()),
        )
      : current
  },
  async create(input: Omit<EngineerRecord, 'id' | 'status'>) {
    if (!input.name.trim()) throw new Error('Engineer name is required.')
    if (!input.phone.trim()) throw new Error('Phone number is required.')

    if (isApiConfigured()) {
      let createdRow: PartnerApiResponse
      const payload: {
        name: string
        phone_number: string
        email: string | null
        address: string | null
        vendor_id?: number | null
      } = {
        name: input.name.trim(),
        phone_number: input.phone.trim(),
        email: input.email?.trim() || null,
        address: input.address?.trim() || null,
      }

      if (input.relationship === 'VENDOR_BASED') {
        if (!input.vendorId) {
          throw new Error('An approved vendor is required for vendor-based engineers.')
        }
        const numVendorId = Number(input.vendorId.replace(/^v-/, ''))
        if (Number.isNaN(numVendorId) || numVendorId <= 0) {
          throw new Error(`Invalid vendor ID: ${input.vendorId}`)
        }
        payload.vendor_id = numVendorId
        createdRow = await apiClient.postAuth<PartnerApiResponse>(
          `admin/partners/${numVendorId}/service-engineers`,
          payload,
        )
      } else {
        // DIRECT relationship
        createdRow = await apiClient.postAuth<PartnerApiResponse>(
          'admin/partners/service-engineers',
          payload,
        )
      }

      const record = mapEngineerResponse(createdRow)
      record.ownerAdmin = input.ownerAdmin || record.ownerAdmin
      record.location = input.location || record.location
      record.relationship = input.relationship
      if (input.relationship === 'VENDOR_BASED') {
        record.vendor = input.vendor || record.vendor
      } else {
        record.vendor = undefined
        record.vendorId = undefined
      }
      records = [...records.filter((r) => r.id !== record.id), record]
      return { ...record }
    }

    await delay()
    if (input.relationship === 'VENDOR_BASED' && (!input.vendorId || !input.vendor?.trim())) {
      throw new Error('An approved vendor is required for vendor-based engineers.')
    }
    if (input.relationship === 'DIRECT' && (input.vendorId || input.vendor)) {
      throw new Error('Direct engineers cannot have a vendor association.')
    }
    const record: EngineerRecord = {
      ...input,
      id: `e-${Date.now()}`,
      name: input.name.trim(),
      status: 'ACTIVE',
    }
    records = [...records, record]
    return { ...record }
  },
  async applyStatus(id: string, status: EngineerStatus) {
    await delay()
    const existing = records.find((record) => record.id === id)
    if (!existing) throw new Error('Engineer record not found.')
    const updated = { ...existing, status }
    records = records.map((record) => (record.id === id ? updated : record))
    return { ...updated }
  },
  async update(
    id: string,
    input: Pick<EngineerRecord, 'name' | 'phone' | 'email' | 'address' | 'skill' | 'category'>,
  ) {
    await delay()
    const existing = records.find((record) => record.id === id)
    if (!existing) throw new Error('Engineer record not found.')
    if (!input.name.trim()) throw new Error('Engineer name is required.')
    if (!input.phone.trim()) throw new Error('Phone number is required.')
    const updated = {
      ...existing,
      ...input,
      name: input.name.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || '',
      address: input.address?.trim() || '',
      skill: input.skill?.trim() || '',
      category: input.category?.trim() || '',
    }
    records = records.map((record) => (record.id === id ? updated : record))
    return { ...updated }
  },
  async requestStatus(input: {
    engineerId: string
    requesterId: string
    requester: string
    reason: string
    action: EngineerRequestAction
  }) {
    if (!input.reason.trim()) throw new Error('A reason is required.')

    if (isApiConfigured()) {
      const numId = Number(input.engineerId.replace(/^e-/, ''))
      if (Number.isNaN(numId)) {
        throw new Error(`Invalid engineer identifier: ${input.engineerId}`)
      }
      await apiClient.postAuth(`admin/partners/${numId}/request-status-change`, {
        request_type: input.action === 'ACTIVATE' ? 'ENGINEER_ACTIVATION' : 'ENGINEER_DEACTIVATION',
        reason: input.reason.trim(),
      })
      const request: EngineerStatusRequest = {
        id: `REQ-ENG-${Date.now()}`,
        type: `SERVICE_ENGINEER_${input.action === 'ACTIVATE' ? 'ACTIVATION' : 'DEACTIVATION'}`,
        engineerId: input.engineerId,
        engineerName: input.engineerId,
        action: input.action,
        requesterId: input.requesterId,
        requester: input.requester,
        location: '',
        reason: input.reason.trim(),
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      }
      requests = [...requests, request]
      return { ...request }
    }

    await delay()
    const engineer = records.find((record) => record.id === input.engineerId)
    if (!engineer) throw new Error('Engineer record not found.')
    if (
      (input.action === 'ACTIVATE' && engineer.status !== 'INACTIVE') ||
      (input.action === 'DEACTIVATE' && engineer.status !== 'ACTIVE')
    ) {
      throw new Error('That status transition is not valid.')
    }
    if (
      requests.some(
        (request) =>
          request.engineerId === input.engineerId &&
          request.action === input.action &&
          request.status === 'PENDING',
      )
    ) {
      throw new Error('A request for this transition is already pending.')
    }
    const request: EngineerStatusRequest = {
      id: `REQ-ENG-${Date.now()}`,
      type: `SERVICE_ENGINEER_${input.action === 'ACTIVATE' ? 'ACTIVATION' : 'DEACTIVATION'}`,
      engineerId: engineer.id,
      engineerName: engineer.name,
      action: input.action,
      requesterId: input.requesterId,
      requester: input.requester,
      location: engineer.location,
      reason: input.reason.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    }
    requests = [...requests, request]
    return { ...request }
  },
}

export function engineerInAdminScope(
  engineer: EngineerRecord,
  user: { id?: string | number; name: string; location: string },
) {
  return (
    String(engineer.ownerAdminId) === String(user.id) ||
    (engineer.ownerAdmin === user.name && engineer.location === user.location)
  )
}

export function pendingEngineerRequest(engineerId: string, action?: EngineerRequestAction) {
  return requests.find(
    (request) =>
      request.engineerId === engineerId &&
      request.status === 'PENDING' &&
      (!action || request.action === action),
  )
}

export const initialEngineers = engineerService.snapshot()
export type Engineer = EngineerRecord
export function resetEngineerService() {
  records = initialEngineers.map((record) => ({ ...record }))
  requests = []
}
export { records }
export default engineerService
