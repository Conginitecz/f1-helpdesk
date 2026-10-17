import { apiClient } from './api-client'
import { isApiConfigured } from './auth'

export type LocationStatus = 'ACTIVE' | 'INACTIVE'

export type Location = {
  id: string
  name: string
  status: LocationStatus
  assignedAdminCount: number
  createdAt: string
}

export type LocationInput = Pick<Location, 'name' | 'status'>

interface LocationApiResponse {
  id: number
  name: string
  is_active: boolean
  created_at: string
  updated_at: string
}

function mapLocationResponse(row: LocationApiResponse, adminCount = 0): Location {
  return {
    id: String(row.id),
    name: row.name,
    status: row.is_active ? 'ACTIVE' : 'INACTIVE',
    assignedAdminCount: adminCount,
    createdAt: new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(new Date(row.created_at)),
  }
}

let locations: Location[] = [
  { id: 'loc-1', name: 'Downtown HQ', status: 'ACTIVE', assignedAdminCount: 3, createdAt: 'Oct 12, 2024' },
  { id: 'loc-2', name: 'North Campus', status: 'ACTIVE', assignedAdminCount: 2, createdAt: 'Nov 04, 2024' },
  { id: 'loc-3', name: 'West Operations', status: 'ACTIVE', assignedAdminCount: 1, createdAt: 'Jan 10, 2025' },
]

const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, 180))

export const locationService = {
  snapshot(): Location[] {
    return locations.map((location) => ({ ...location }))
  },
  async list(search = ''): Promise<Location[]> {
    if (isApiConfigured()) {
      const data = await apiClient.getAuth<LocationApiResponse[]>('super-admin/locations')
      const mapped = data.map((row) => mapLocationResponse(row))
      locations = mapped
      const query = search.trim().toLowerCase()
      return query ? mapped.filter((loc) => loc.name.toLowerCase().includes(query)) : mapped
    }

    await pause()
    const query = search.trim().toLowerCase()
    return locations.filter((location) => location.name.toLowerCase().includes(query)).map((location) => ({ ...location }))
  },
  async create(input: LocationInput): Promise<Location> {
    const name = input.name.trim()
    if (!name) throw new Error('Location name is required.')

    if (isApiConfigured()) {
      const saved = await apiClient.postAuth<LocationApiResponse>('super-admin/locations', { name })
      const created = mapLocationResponse(saved)
      locations = [...locations.filter((l) => l.id !== created.id), created]
      return { ...created }
    }

    await pause()
    if (locations.some((location) => location.name.toLowerCase() === name.toLowerCase())) throw new Error('A location with this name already exists.')
    const created = { id: `loc-${Date.now()}`, name, status: input.status, assignedAdminCount: 0, createdAt: new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date()) }
    locations.push(created)
    return { ...created }
  },
  async update(id: string, input: LocationInput): Promise<Location> {
    const name = input.name.trim()
    if (!name) throw new Error('Location name is required.')

    if (isApiConfigured()) {
      const updatedRow = await apiClient.patchAuth<LocationApiResponse>(`super-admin/locations/${id}`, {
        name,
        is_active: input.status === 'ACTIVE',
      })
      const updated = mapLocationResponse(updatedRow)
      locations = locations.map((l) => (l.id === id ? updated : l))
      return { ...updated }
    }

    await pause()
    if (locations.some((location) => location.id !== id && location.name.toLowerCase() === name.toLowerCase())) throw new Error('A location with this name already exists.')
    const index = locations.findIndex((location) => location.id === id)
    if (index < 0) throw new Error('Location not found.')
    locations[index] = { ...locations[index], name, status: input.status }
    return { ...locations[index] }
  },
}

export function resetLocationsForTests() {
  locations.splice(0, locations.length, { id: 'loc-1', name: 'Downtown HQ', status: 'ACTIVE', assignedAdminCount: 3, createdAt: 'Oct 12, 2024' }, { id: 'loc-2', name: 'North Campus', status: 'ACTIVE', assignedAdminCount: 2, createdAt: 'Nov 04, 2024' }, { id: 'loc-3', name: 'West Operations', status: 'ACTIVE', assignedAdminCount: 1, createdAt: 'Jan 10, 2025' })
}

