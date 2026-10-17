import { apiClient, ApiError } from './api-client'
import { isApiConfigured } from './auth'
import { adminService } from './admin-service'
import { vendorService } from './vendors-service'
import { engineerService } from './engineers-service'

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type RequestType =
  | 'VENDOR_ONBOARDING'
  | 'VENDOR_ACTIVATION'
  | 'VENDOR_DEACTIVATION'
  | 'SERVICE_ENGINEER_ACTIVATION'
  | 'SERVICE_ENGINEER_DEACTIVATION'

export type RequestRecord = {
  id: string
  type: RequestType
  entityId: string
  entity: string
  action: string
  currentStatus: string
  requestedStatus: string
  requester: string
  requesterId: string
  location: string
  reason: string
  status: RequestStatus
  decisionFeedback?: string
  createdAt: string
  decidedAt?: string
}

export interface StatusRequestApiResponse {
  id: number
  entity_type: string
  entity_id: number
  requested_action: string
  request_type: string | null
  reason: string | null
  requested_by_admin_id: number
  status: string
  resolved_by_super_admin_id: number | null
  created_at: string
  resolved_at: string | null
}

function mapStatusRequestResponse(row: StatusRequestApiResponse): RequestRecord {
  let mappedType: RequestType = 'VENDOR_ONBOARDING'
  if (row.request_type === 'VENDOR_ACTIVATION') mappedType = 'VENDOR_ACTIVATION'
  else if (row.request_type === 'VENDOR_DEACTIVATION') mappedType = 'VENDOR_DEACTIVATION'
  else if (row.request_type === 'ENGINEER_ACTIVATION') mappedType = 'SERVICE_ENGINEER_ACTIVATION'
  else if (row.request_type === 'ENGINEER_DEACTIVATION') mappedType = 'SERVICE_ENGINEER_DEACTIVATION'
  else if (row.request_type === 'VENDOR_ONBOARDING') mappedType = 'VENDOR_ONBOARDING'

  const admins = adminService.snapshot()
  const matchedAdmin = admins.find((a) => String(a.id) === String(row.requested_by_admin_id))
  const requesterName = matchedAdmin ? matchedAdmin.name : `Admin #${row.requested_by_admin_id}`
  const locationName = matchedAdmin ? matchedAdmin.location : 'Downtown HQ'

  const vendors = vendorService.snapshot()
  const engineers = engineerService.snapshot()
  let entityName = `${row.entity_type} #${row.entity_id}`
  let currentStatus = 'Pending approval'
  let requestedStatus = 'Active after approval'
  let actionLabel = row.requested_action || 'Status change'

  if (
    mappedType === 'VENDOR_ONBOARDING' ||
    mappedType === 'VENDOR_ACTIVATION' ||
    mappedType === 'VENDOR_DEACTIVATION'
  ) {
    const v = vendors.find((item) => String(item.id) === String(row.entity_id))
    if (v) entityName = v.name
    if (mappedType === 'VENDOR_ONBOARDING') {
      actionLabel = 'Onboard vendor'
      currentStatus = 'Pending approval'
      requestedStatus = 'Active after approval'
    } else if (mappedType === 'VENDOR_ACTIVATION') {
      actionLabel = 'Activate vendor'
      currentStatus = 'Inactive'
      requestedStatus = 'Active'
    } else {
      actionLabel = 'Deactivate vendor'
      currentStatus = 'Active'
      requestedStatus = 'Inactive'
    }
  } else {
    const e = engineers.find((item) => String(item.id) === String(row.entity_id))
    if (e) entityName = e.name
    if (mappedType === 'SERVICE_ENGINEER_ACTIVATION') {
      actionLabel = 'Activate engineer'
      currentStatus = 'Inactive'
      requestedStatus = 'Active'
    } else {
      actionLabel = 'Deactivate engineer'
      currentStatus = 'Active'
      requestedStatus = 'Inactive'
    }
  }

  let recordStatus: RequestStatus = 'PENDING'
  const rawStatus = (row.status || '').toUpperCase()
  if (rawStatus === 'APPROVED') recordStatus = 'APPROVED'
  else if (rawStatus === 'REJECTED') recordStatus = 'REJECTED'

  return {
    id: `REQ-${row.id}`,
    type: mappedType,
    entityId: String(row.entity_id),
    entity: entityName,
    action: actionLabel,
    currentStatus,
    requestedStatus,
    requester: requesterName,
    requesterId: String(row.requested_by_admin_id),
    location: locationName,
    reason: row.reason || '',
    status: recordStatus,
    createdAt: row.created_at,
    decidedAt: row.resolved_at ?? undefined,
  }
}

let records: RequestRecord[] = [
  {
    id: 'REQ-VND-101',
    type: 'VENDOR_ONBOARDING',
    entityId: 'v-2',
    entity: 'Northstar Field Support',
    action: 'Onboard vendor',
    currentStatus: 'Pending approval',
    requestedStatus: 'Active after approval',
    requester: 'Noah Williams',
    requesterId: 'a-2',
    location: 'North Campus',
    reason: 'Regional field support coverage is required for the new facility.',
    status: 'PENDING',
    createdAt: '2026-10-13T16:18:00.000Z',
  },
  {
    id: 'REQ-ENG-101',
    type: 'SERVICE_ENGINEER_ACTIVATION',
    entityId: 'e-3',
    entity: 'Ethan Brooks',
    action: 'Activate engineer',
    currentStatus: 'Inactive',
    requestedStatus: 'Active',
    requester: 'Olivia Martin',
    requesterId: 'a-1',
    location: 'Downtown HQ',
    reason: 'Engineer completed required field training.',
    status: 'PENDING',
    createdAt: '2026-10-12T09:00:00.000Z',
  },
]

const copy = () => records.map((record) => ({ ...record }))
const delay = () => new Promise((resolve) => window.setTimeout(resolve, 100))

export const requestService = {
  snapshot: copy,
  forRequester: (requester: string) => copy().filter((record) => record.requester === requester),
  pending: () => copy().filter((record) => record.status === 'PENDING'),
  async list(role?: 'SUPER_ADMIN' | 'ADMIN'): Promise<RequestRecord[]> {
    if (isApiConfigured()) {
      const endpoint = role === 'SUPER_ADMIN' ? 'super-admin/status-requests' : 'admin/status-requests'
      const rows = await apiClient.getAuth<StatusRequestApiResponse[]>(endpoint)
      const mapped = rows.map(mapStatusRequestResponse)
      records = mapped
      return mapped
    }
    return copy()
  },
  async create(input: Omit<RequestRecord, 'id' | 'status' | 'createdAt' | 'decidedAt' | 'decisionFeedback'>) {
    if (!input.reason.trim()) throw new Error('A request reason is required.')

    if (isApiConfigured()) {
      let backendRequestType = input.type as string
      if (input.type === 'SERVICE_ENGINEER_ACTIVATION') backendRequestType = 'ENGINEER_ACTIVATION'
      else if (input.type === 'SERVICE_ENGINEER_DEACTIVATION') backendRequestType = 'ENGINEER_DEACTIVATION'

      const numericEntityId = Number(input.entityId.replace(/^[ve]-/, ''))
      if (Number.isNaN(numericEntityId)) {
        throw new Error(`Invalid entity identifier: ${input.entityId}`)
      }
      const res = await apiClient.postAuth<StatusRequestApiResponse>(`admin/partners/${numericEntityId}/request-status-change`, {
        request_type: backendRequestType,
        reason: input.reason.trim(),
      })
      const record = mapStatusRequestResponse(res)
      records = [...records.filter((r) => r.id !== record.id), record]
      return { ...record }
    }

    await delay()
    if (records.some((record) => record.entityId === input.entityId && record.type === input.type && record.status === 'PENDING')) {
      throw new Error('A request for this transition is already pending.')
    }
    const record: RequestRecord = {
      ...input,
      id: `REQ-${Date.now()}`,
      status: 'PENDING',
      reason: input.reason.trim(),
      createdAt: new Date().toISOString(),
    }
    records = [...records, record]
    return { ...record }
  },
  async decide(id: string, decision: 'APPROVED' | 'REJECTED', feedback: string) {
    if (decision === 'REJECTED' && !feedback.trim()) throw new Error('Rejection feedback is required.')

    if (isApiConfigured()) {
      const rawId = Number(id.replace(/^REQ-/, ''))
      if (Number.isNaN(rawId)) {
        throw new Error(`Invalid request ID: ${id}`)
      }
      const endpoint = decision === 'APPROVED' ? `super-admin/status-requests/${rawId}/approve` : `super-admin/status-requests/${rawId}/reject`
      const res = await apiClient.patchAuth<StatusRequestApiResponse>(endpoint)
      const updated = mapStatusRequestResponse(res)
      records = records.map((r) => (r.id === updated.id ? updated : r))
      return updated
    }

    await delay()
    const record = records.find((item) => item.id === id)
    if (!record) throw new Error('Request not found.')
    if (record.status !== 'PENDING') throw new Error('This request has already been decided.')

    records = records.map((item) =>
      item.id === id
        ? {
            ...item,
            status: decision,
            decisionFeedback: feedback.trim(),
            decidedAt: new Date().toISOString(),
          }
        : item,
    )
    return records.find((item) => item.id === id)!
  },
}

export function requestTypeLabel(type: RequestType) {
  return type
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function resetRequestService() {
  records = []
}

export default requestService
