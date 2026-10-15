export type LocationStatus = 'ACTIVE' | 'INACTIVE'

export type Location = {
  id: string
  name: string
  status: LocationStatus
  assignedAdminCount: number
  createdAt: string
}

export type LocationInput = Pick<Location, 'name' | 'status'>

const locations: Location[] = [
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
    await pause()
    const query = search.trim().toLowerCase()
    return locations.filter((location) => location.name.toLowerCase().includes(query)).map((location) => ({ ...location }))
  },
  async create(input: LocationInput): Promise<Location> {
    await pause()
    const name = input.name.trim()
    if (!name) throw new Error('Location name is required.')
    if (locations.some((location) => location.name.toLowerCase() === name.toLowerCase())) throw new Error('A location with this name already exists.')
    const created = { id: `loc-${Date.now()}`, name, status: input.status, assignedAdminCount: 0, createdAt: new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date()) }
    locations.push(created)
    return { ...created }
  },
  async update(id: string, input: LocationInput): Promise<Location> {
    await pause()
    const name = input.name.trim()
    if (!name) throw new Error('Location name is required.')
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
