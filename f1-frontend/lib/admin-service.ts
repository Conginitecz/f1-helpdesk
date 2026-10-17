import { apiClient } from './api-client'
import { isApiConfigured } from './auth'
import { locationService } from './locations-service'

export type AdminStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_ACTIVATION'

export type Admin = {
  id: string
  name: string
  email: string
  username?: string
  firstName?: string
  lastName?: string
  phoneNumber?: string
  address?: string
  location_id?: number | null
  location: string
  status: AdminStatus
  createdAt: string
}

export type AdminInput = Pick<Admin, 'name' | 'email' | 'location' | 'status'> & {
  username?: string
  password?: string
  firstName?: string
  lastName?: string
  phone_number?: string
  phoneNumber?: string
  address?: string
  location_id?: number
}

interface AdminApiResponse {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  phone_number: string
  address: string
  location_id: number | null
  is_active: boolean
  is_deleted: boolean
  created_by_super_admin_id: number | null
  created_at: string
  updated_at: string
}

function resolveLocationName(locationId: number | null): string {
  if (!locationId) return 'Unassigned'
  const loc = locationService.snapshot().find((l) => String(l.id) === String(locationId))
  return loc ? loc.name : `Location #${locationId}`
}

function mapAdminResponse(row: AdminApiResponse): Admin {
  return {
    id: String(row.id),
    name: `${row.first_name} ${row.last_name}`.trim() || row.username,
    email: row.email,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    phoneNumber: row.phone_number,
    address: row.address,
    location_id: row.location_id,
    location: resolveLocationName(row.location_id),
    status: row.is_active ? 'ACTIVE' : 'INACTIVE',
    createdAt: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(row.created_at)),
  }
}

let admins: Admin[] = [
  { id: 'admin-1', name: 'Jordan Lee', email: 'jordan.lee@f1helpdesk.com', location: 'Downtown HQ', status: 'ACTIVE', createdAt: 'Oct 12, 2024' },
  { id: 'admin-2', name: 'Priya Patel', email: 'priya.patel@f1helpdesk.com', location: 'North Campus', status: 'ACTIVE', createdAt: 'Nov 04, 2024' },
  { id: 'admin-3', name: 'Marcus Chen', email: 'marcus.chen@f1helpdesk.com', location: 'West Operations', status: 'ACTIVE', createdAt: 'Jan 10, 2025' },
  { id: 'admin-4', name: 'Sophia Rodriguez', email: 'sophia.rodriguez@f1helpdesk.com', location: 'Downtown HQ', status: 'PENDING_ACTIVATION', createdAt: 'Feb 01, 2025' },
]

const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, 180))

export const adminService = {
  snapshot(): Admin[] {
    return admins.map((admin) => ({ ...admin }))
  },
  async list(search = ''): Promise<Admin[]> {
    if (isApiConfigured()) {
      // Ensure locations snapshot is available for location name resolution
      if (locationService.snapshot().length === 0) {
        try {
          await locationService.list()
        } catch {
          // Ignore location preload failure; will fallback to Location #id
        }
      }
      const data = await apiClient.getAuth<AdminApiResponse[]>('super-admin/admins')
      const mapped = data.map((row) => mapAdminResponse(row))
      admins = mapped
      const query = search.trim().toLowerCase()
      return query
        ? mapped.filter(
            (admin) =>
              admin.name.toLowerCase().includes(query) ||
              admin.email.toLowerCase().includes(query) ||
              admin.location.toLowerCase().includes(query),
          )
        : mapped
    }

    await pause()
    const query = search.trim().toLowerCase()
    return admins
      .filter((admin) => admin.name.toLowerCase().includes(query) || admin.email.toLowerCase().includes(query))
      .map((admin) => ({ ...admin }))
  },
  async create(input: AdminInput): Promise<Admin> {
    if (isApiConfigured()) {
      // Determine names
      let firstName = input.firstName?.trim()
      let lastName = input.lastName?.trim()
      if (!firstName || !lastName) {
        const nameParts = input.name.trim().split(/\s+/)
        if (!firstName) firstName = nameParts[0] || 'Admin'
        if (!lastName) lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Admin'
      }

      // Resolve numeric location ID
      let locationId = input.location_id
      if (!locationId && input.location) {
        let matched = locationService.snapshot().find((l) => l.name === input.location || String(l.id) === String(input.location))
        if (!matched) {
          try {
            const freshLocations = await locationService.list()
            matched = freshLocations.find((l) => l.name === input.location || String(l.id) === String(input.location))
          } catch {
            // Ignore fetch failure
          }
        }
        if (matched) locationId = Number(matched.id)
      }
      if (!locationId) {
        throw new Error('Please select a valid assigned location.')
      }

      const username =
        input.username?.trim() ||
        input.email.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '') ||
        `admin_${Date.now()}`

      const password = input.password || 'TemporaryPass123!'
      const phoneNumber = input.phoneNumber?.trim() || input.phone_number?.trim() || '(555) 000-0000'
      const address = input.address?.trim() || input.location || 'Headquarters'

      const payload = {
        email: input.email.trim().toLowerCase(),
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        address,
        location_id: locationId,
      }

      const saved = await apiClient.postAuth<AdminApiResponse>('super-admin/admins', payload)
      const created = mapAdminResponse(saved)
      admins = [...admins.filter((a) => a.id !== created.id), created]
      return { ...created }
    }

    await pause()
    const name = input.name.trim()
    const email = input.email.trim().toLowerCase()
    if (!name) throw new Error('Admin name is required.')
    if (!email) throw new Error('Admin email is required.')
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Valid email address is required.')
    if (admins.some((admin) => admin.email.toLowerCase() === email)) throw new Error('An admin with this email already exists.')
    const created = {
      id: `admin-${Date.now()}`,
      name,
      email,
      location: input.location,
      status: input.status,
      createdAt: new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date()),
    }
    admins.push(created)
    return { ...created }
  },
  async activate(id: string): Promise<Admin> {
    if (isApiConfigured()) {
      const updated = await apiClient.patchAuth<AdminApiResponse>(`super-admin/admins/${id}/activate`)
      const mapped = mapAdminResponse(updated)
      admins = admins.map((a) => (a.id === id ? mapped : a))
      return { ...mapped }
    }
    await pause()
    const existing = admins.find((a) => a.id === id)
    if (!existing) throw new Error('Admin not found.')
    const updated = { ...existing, status: 'ACTIVE' as AdminStatus }
    admins = admins.map((a) => (a.id === id ? updated : a))
    return { ...updated }
  },
  async deactivate(id: string): Promise<Admin> {
    if (isApiConfigured()) {
      const updated = await apiClient.patchAuth<AdminApiResponse>(`super-admin/admins/${id}/deactivate`)
      const mapped = mapAdminResponse(updated)
      admins = admins.map((a) => (a.id === id ? mapped : a))
      return { ...mapped }
    }
    await pause()
    const existing = admins.find((a) => a.id === id)
    if (!existing) throw new Error('Admin not found.')
    const updated = { ...existing, status: 'INACTIVE' as AdminStatus }
    admins = admins.map((a) => (a.id === id ? updated : a))
    return { ...updated }
  },
  async update(id: string, input: AdminInput): Promise<Admin> {
    if (isApiConfigured()) {
      // Backend only supports activate/deactivate status updates
      if (input.status === 'ACTIVE') {
        return this.activate(id)
      } else if (input.status === 'INACTIVE') {
        return this.deactivate(id)
      }
      const existing = admins.find((a) => a.id === id)
      if (existing) return existing
    }

    await pause()
    const name = input.name.trim()
    const email = input.email.trim().toLowerCase()
    if (!name) throw new Error('Admin name is required.')
    if (!email) throw new Error('Admin email is required.')
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Valid email address is required.')
    if (admins.some((admin) => admin.id !== id && admin.email.toLowerCase() === email)) throw new Error('An admin with this email already exists.')
    const index = admins.findIndex((admin) => admin.id === id)
    if (index < 0) throw new Error('Admin not found.')
    admins[index] = { ...admins[index], name, email, location: input.location, status: input.status }
    return { ...admins[index] }
  },
  async delete(id: string): Promise<void> {
    await pause()
    const index = admins.findIndex((admin) => admin.id === id)
    if (index < 0) throw new Error('Admin not found.')
    admins.splice(index, 1)
  },
}

export function resetAdminsForTests() {
  admins.splice(
    0,
    admins.length,
    { id: 'admin-1', name: 'Jordan Lee', email: 'jordan.lee@f1helpdesk.com', location: 'Downtown HQ', status: 'ACTIVE', createdAt: 'Oct 12, 2024' },
    { id: 'admin-2', name: 'Priya Patel', email: 'priya.patel@f1helpdesk.com', location: 'North Campus', status: 'ACTIVE', createdAt: 'Nov 04, 2024' },
    { id: 'admin-3', name: 'Marcus Chen', email: 'marcus.chen@f1helpdesk.com', location: 'West Operations', status: 'ACTIVE', createdAt: 'Jan 10, 2025' },
    { id: 'admin-4', name: 'Sophia Rodriguez', email: 'sophia.rodriguez@f1helpdesk.com', location: 'Downtown HQ', status: 'PENDING_ACTIVATION', createdAt: 'Feb 01, 2025' }
  )
}
