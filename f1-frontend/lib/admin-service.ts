export type AdminStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING_ACTIVATION'

export type Admin = {
  id: string
  name: string
  email: string
  location: string
  status: AdminStatus
  createdAt: string
}

export type AdminInput = Pick<Admin, 'name' | 'email' | 'location' | 'status'>

const admins: Admin[] = [
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
    await pause()
    const query = search.trim().toLowerCase()
    return admins.filter((admin) => admin.name.toLowerCase().includes(query) || admin.email.toLowerCase().includes(query)).map((admin) => ({ ...admin }))
  },
  async create(input: AdminInput): Promise<Admin> {
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
  async update(id: string, input: AdminInput): Promise<Admin> {
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
