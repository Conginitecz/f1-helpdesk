import { apiClient, ApiError } from './api-client'
import { isApiConfigured } from './auth'
import { adminService } from './admin-service'

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL' | 'REJECTED'
export type VendorStatusRequest = {
  id: string
  vendorId: string
  vendorName: string
  action: 'ACTIVATE' | 'DEACTIVATE'
  requester: string
  location: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export type VendorOnboardingStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
export type VendorRecord = {
  id: string
  name: string
  owner: string
  location: string
  status: VendorStatus
  onboardingStatus: VendorOnboardingStatus
  operationalStatus: 'ACTIVE' | 'INACTIVE'
  engineers: number
  contactEmail: string
  phone: string
  description: string
}

export interface PartnerApiResponse {
  id: number
  partner_type_id: number
  name: string
  phone_number: string
  email: string | null
  address: string | null
  skill_id: number | null
  category_id: number | null
  reference_type_id: number | null
  reference_id: number | null
  is_active: boolean
  lifecycle_status: 'PENDING_APPROVAL' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | null
  is_deleted: boolean
  created_by_admin_id: number
  created_at: string
  updated_at: string
}

function mapVendorResponse(row: PartnerApiResponse): VendorRecord {
  const admins = adminService.snapshot()
  const matchedAdmin = admins.find((a) => String(a.id) === String(row.created_by_admin_id))
  const ownerName = matchedAdmin ? matchedAdmin.name : `Admin #${row.created_by_admin_id}`
  const locationName = matchedAdmin ? matchedAdmin.location : 'Downtown HQ'

  let status: VendorStatus = 'PENDING_APPROVAL'
  if (row.lifecycle_status === 'ACTIVE') status = 'ACTIVE'
  else if (row.lifecycle_status === 'INACTIVE') status = 'INACTIVE'
  else if (row.lifecycle_status === 'REJECTED') status = 'REJECTED'
  else if (row.lifecycle_status === 'PENDING_APPROVAL') status = 'PENDING_APPROVAL'
  else status = row.is_active ? 'ACTIVE' : 'INACTIVE'

  const onboardingStatus: VendorOnboardingStatus =
    status === 'REJECTED' ? 'REJECTED' : status === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'APPROVED'

  const operationalStatus: 'ACTIVE' | 'INACTIVE' = row.is_active ? 'ACTIVE' : 'INACTIVE'

  return {
    id: String(row.id),
    name: row.name,
    owner: ownerName,
    location: locationName,
    status,
    onboardingStatus,
    operationalStatus,
    engineers: 0,
    contactEmail: row.email ?? '',
    phone: row.phone_number ?? '',
    description: row.address ?? '',
  }
}

let statusRequests: VendorStatusRequest[] = []

let records: VendorRecord[] = [
  {
    id: 'v-1',
    name: 'Apex Technical Services',
    owner: 'Olivia Martin',
    location: 'Downtown HQ',
    status: 'ACTIVE',
    onboardingStatus: 'APPROVED',
    operationalStatus: 'ACTIVE',
    engineers: 8,
    contactEmail: 'ops@apextechnical.com',
    phone: '(512) 555-0184',
    description: 'Industrial HVAC and data hall cooling services.',
  },
  {
    id: 'v-2',
    name: 'Northstar Field Support',
    owner: 'Noah Williams',
    location: 'North Campus',
    status: 'PENDING_APPROVAL',
    onboardingStatus: 'PENDING_APPROVAL',
    operationalStatus: 'INACTIVE',
    engineers: 0,
    contactEmail: 'contact@northstar.example',
    phone: '',
    description: 'Regional field support coverage.',
  },
  {
    id: 'v-3',
    name: 'BluePeak Maintenance',
    owner: 'Olivia Martin',
    location: 'Downtown HQ',
    status: 'INACTIVE',
    onboardingStatus: 'APPROVED',
    operationalStatus: 'INACTIVE',
    engineers: 3,
    contactEmail: 'dispatch@bluepeak.example',
    phone: '',
    description: 'Facilities maintenance and repair.',
  },
  {
    id: 'v-4',
    name: 'Summit Repair Co.',
    owner: 'Noah Williams',
    location: 'West Operations',
    status: 'REJECTED',
    onboardingStatus: 'REJECTED',
    operationalStatus: 'INACTIVE',
    engineers: 0,
    contactEmail: 'hello@summit.example',
    phone: '',
    description: 'Equipment repair services.',
  },
]

const delay = () => new Promise((resolve) => window.setTimeout(resolve, 120))

export const vendorService = {
  snapshot() {
    return records.map((record) => ({ ...record }))
  },
  async list(role?: 'SUPER_ADMIN' | 'ADMIN', search = ''): Promise<VendorRecord[]> {
    if (isApiConfigured()) {
      const endpoint = role === 'ADMIN' ? 'admin/partners?type=vendor' : 'super-admin/partners?type=vendor'
      const rows = await apiClient.getAuth<PartnerApiResponse[]>(endpoint)
      const mapped = rows.map(mapVendorResponse)
      records = mapped
      return search
        ? mapped.filter((r) =>
            `${r.name} ${r.owner} ${r.location}`.toLowerCase().includes(search.toLowerCase()),
          )
        : mapped
    }
    const current = records.map((record) => ({ ...record }))
    return search
      ? current.filter((r) =>
          `${r.name} ${r.owner} ${r.location}`.toLowerCase().includes(search.toLowerCase()),
        )
      : current
  },
  async create(input: Omit<VendorRecord, 'id' | 'status' | 'onboardingStatus' | 'operationalStatus' | 'engineers'>) {
    if (isApiConfigured()) {
      const payload = {
        name: input.name.trim(),
        phone_number: input.phone.trim() || '555-0100',
        email: input.contactEmail.trim() || null,
        address: input.description.trim() || null,
        reason: input.description.trim() || 'Vendor onboarding submission.',
      }
      const createdRow = await apiClient.postAuth<PartnerApiResponse>('admin/partners', payload)

      const record = mapVendorResponse(createdRow)
      record.owner = input.owner || record.owner
      record.location = input.location || record.location
      records = [...records.filter((r) => r.id !== record.id), record]
      return { ...record }
    }

    await delay()
    if (records.some((record) => record.name.toLowerCase() === input.name.trim().toLowerCase()))
      throw new Error('A vendor with this name already exists.')
    const record: VendorRecord = {
      ...input,
      id: `v-${Date.now()}`,
      status: 'PENDING_APPROVAL',
      onboardingStatus: 'PENDING_APPROVAL',
      operationalStatus: 'INACTIVE',
      engineers: 0,
      name: input.name.trim(),
      contactEmail: input.contactEmail.trim(),
      phone: input.phone.trim(),
      description: input.description.trim(),
    }
    records = [...records, record]
    return { ...record }
  },
  async applyStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    await delay()
    const existing = records.find((record) => record.id === id)
    if (!existing) throw new Error('Vendor record not found.')
    const updated: VendorRecord = { ...existing, status, operationalStatus: status }
    records = records.map((record) => (record.id === id ? updated : record))
    return { ...updated }
  },
  async approveOnboarding(id: string) {
    await delay()
    const existing = records.find((record) => record.id === id)
    if (!existing) throw new Error('Vendor record not found.')
    const updated: VendorRecord = {
      ...existing,
      onboardingStatus: 'APPROVED' as const,
      status: 'ACTIVE' as const,
      operationalStatus: 'ACTIVE' as const,
    }
    records = records.map((record) => (record.id === id ? updated : record))
    return { ...updated }
  },
  async rejectOnboarding(id: string) {
    await delay()
    const existing = records.find((record) => record.id === id)
    if (!existing) throw new Error('Vendor record not found.')
    const updated: VendorRecord = {
      ...existing,
      onboardingStatus: 'REJECTED' as const,
      status: 'REJECTED' as const,
      operationalStatus: 'INACTIVE' as const,
    }
    records = records.map((record) => (record.id === id ? updated : record))
    return { ...updated }
  },
  async update(id: string, input: Pick<VendorRecord, 'name' | 'contactEmail' | 'phone' | 'description'>) {
    await delay()
    const existing = records.find((record) => record.id === id)
    if (!existing) throw new Error('Vendor record not found.')
    if (records.some((record) => record.id !== id && record.name.toLowerCase() === input.name.trim().toLowerCase()))
      throw new Error('A vendor with this name already exists.')
    const updated: VendorRecord = {
      ...existing,
      ...input,
      name: input.name.trim(),
      contactEmail: input.contactEmail.trim(),
      phone: input.phone.trim(),
      description: input.description.trim(),
    }
    records = records.map((record) => (record.id === id ? updated : record))
    return { ...updated }
  },
}

export type { VendorRecord as Vendor }
export const initialVendors = vendorService.snapshot()

export function resetVendorService() {
  records = initialVendors.map((record) => ({ ...record }))
}

export function isVendorEmail(value: string) {
  return /^\S+@\S+\.\S+$/.test(value.trim())
}

export function validateVendorInput(input: { name: string; contactEmail: string }) {
  if (!input.name.trim()) return 'Vendor name is required.'
  if (!input.contactEmail.trim()) return 'Contact email is required.'
  if (!isVendorEmail(input.contactEmail)) return 'Enter a valid contact email.'
  return null
}

export type VendorForm = { name: string; contactEmail: string; phone: string; description: string }
export const emptyVendorForm: VendorForm = { name: '', contactEmail: '', phone: '', description: '' }
export function toVendorForm(record: VendorRecord): VendorForm {
  return { name: record.name, contactEmail: record.contactEmail, phone: record.phone, description: record.description }
}

export { records }

export function getVendorStatusLabel(status: VendorStatus) {
  return status === 'PENDING_APPROVAL' ? 'Pending approval' : status[0] + status.slice(1).toLowerCase()
}

export function vendorScopeAllows(userLocation: string, record: VendorRecord) {
  return userLocation === 'Global' || record.location === userLocation
}

export async function saveVendorRecord(id: string | null, input: VendorForm) {
  return id ? vendorService.update(id, input) : vendorService.create({ ...input, owner: '', location: '' })
}

export function vendorStatusIsMutable(_status: VendorStatus) {
  return false
}

export function vendorDirectory(recordsInput: VendorRecord[]) {
  return recordsInput
}

export function vendorApprovalRequired(record: VendorRecord) {
  return record.status === 'PENDING_APPROVAL'
}

export function vendorIdentity(record: VendorRecord) {
  return `${record.name} (${record.id.toUpperCase()})`
}

export function cloneVendor(record: VendorRecord) {
  return { ...record }
}

export function vendorCanEdit(userRole: 'SUPER_ADMIN' | 'ADMIN') {
  return userRole === 'ADMIN'
}

export function vendorCanCreate(userRole: 'SUPER_ADMIN' | 'ADMIN') {
  return userRole === 'ADMIN'
}

export function vendorCanView(userRole: 'SUPER_ADMIN' | 'ADMIN') {
  return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
}

export function vendorIsPending(record: VendorRecord) {
  return record.status === 'PENDING_APPROVAL'
}

export function vendorIsOperational(record: VendorRecord) {
  return record.status === 'ACTIVE'
}

export function vendorIsRestricted(record: VendorRecord) {
  return record.status === 'INACTIVE' || record.status === 'REJECTED'
}

export function vendorEngineerLabel(record: VendorRecord) {
  return record.engineers === 0 ? '0 (Ineligible)' : `${record.engineers} Engineers`
}

export function vendorSummary(recordsInput: VendorRecord[]) {
  return {
    total: recordsInput.length,
    active: recordsInput.filter((record) => record.status === 'ACTIVE').length,
    pending: recordsInput.filter((record) => record.status === 'PENDING_APPROVAL').length,
    inactive: recordsInput.filter((record) => record.status === 'INACTIVE' || record.status === 'REJECTED').length,
  }
}

export function vendorFormFor(record?: VendorRecord): VendorForm {
  return record ? toVendorForm(record) : { ...emptyVendorForm }
}

export function vendorHasDuplicateName(input: string, exceptId?: string) {
  return records.some(
    (record) => record.id !== exceptId && record.name.toLowerCase() === input.trim().toLowerCase(),
  )
}

export function vendorMutationPolicy() {
  return 'Admin profile edits require centralized onboarding or lifecycle approval for status changes.'
}

export function vendorStatusForNewRecord(): VendorStatus {
  return 'PENDING_APPROVAL'
}

export function vendorOwnerPreserved(record: VendorRecord) {
  return record.owner
}

export function vendorLocationPreserved(record: VendorRecord) {
  return record.location
}

export function vendorRecordExists(id: string) {
  return records.some((record) => record.id === id)
}

export function vendorRecordCount() {
  return records.length
}

export function vendorRecords() {
  return vendorService.snapshot()
}

export function vendorRecordById(id: string) {
  return records.find((record) => record.id === id)
}

export function vendorDisplayStatus(record: VendorRecord) {
  return getVendorStatusLabel(record.status)
}

export function vendorCreateDefaults(owner: string, location: string): VendorRecord {
  return {
    id: '',
    name: '',
    owner,
    location,
    status: 'PENDING_APPROVAL',
    onboardingStatus: 'PENDING_APPROVAL',
    operationalStatus: 'INACTIVE',
    engineers: 0,
    contactEmail: '',
    phone: '',
    description: '',
  }
}

export function vendorEditDefaults(record: VendorRecord) {
  return toVendorForm(record)
}

export function vendorCanChangeStatus(_role: 'SUPER_ADMIN' | 'ADMIN') {
  return false
}

export function vendorAuditMessage(record: VendorRecord) {
  return `${record.name} remains ${getVendorStatusLabel(record.status)} until approved through Requests.`
}

export function vendorEmailValid(email: string) {
  return isVendorEmail(email)
}

export function vendorNameValid(name: string) {
  return Boolean(name.trim())
}

export function vendorFormValid(input: VendorForm) {
  return !validateVendorInput(input)
}

export function vendorStatusRequests() {
  return statusRequests.map((request) => ({ ...request }))
}

export function pendingVendorStatusRequest(vendorId: string, action: VendorStatusRequest['action']) {
  return statusRequests.find(
    (request) => request.vendorId === vendorId && request.action === action && request.status === 'PENDING',
  )
}

export async function createVendorStatusRequest(input: Omit<VendorStatusRequest, 'id' | 'status' | 'createdAt'>) {
  if (isApiConfigured()) {
    const numericId = Number(input.vendorId.replace(/^v-/, ''))
    if (!Number.isNaN(numericId)) {
      await apiClient.postAuth(`admin/partners/${numericId}/request-status-change`, {
        request_type: input.action === 'ACTIVATE' ? 'VENDOR_ACTIVATION' : 'VENDOR_DEACTIVATION',
        reason: `Request to ${input.action.toLowerCase()} vendor.`,
      })
    }
  }
  await delay()
  if (pendingVendorStatusRequest(input.vendorId, input.action))
    throw new Error('A request for this status transition is already pending.')
  const request: VendorStatusRequest = {
    ...input,
    id: `REQ-${Date.now()}`,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  }
  statusRequests = [...statusRequests, request]
  return { ...request }
}
