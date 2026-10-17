import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import { saveToken, clearToken, ApiError } from '../lib/api-client'
import { locationService } from '../lib/locations-service'
import { adminService } from '../lib/admin-service'
import { vendorService } from '../lib/vendors-service'
import { engineerService } from '../lib/engineers-service'
import { requestService } from '../lib/requests-service'
import { inventoryService } from '../lib/inventory-service'
import { configurationService } from '../lib/config-service'
import { masterDataService } from '../lib/master-data-service'

describe('Service HTTP Contracts & No-Silent-Fallback Verification', () => {
  const originalFetch = globalThis.fetch
  const originalEnvUrl = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.test.local'
    saveToken('test-bearer-token-live-contract')
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    if (originalEnvUrl !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = originalEnvUrl
    } else {
      delete process.env.NEXT_PUBLIC_API_URL
    }
    clearToken()
  })

  // ─── 1. Locations Service ──────────────────────────────────────────────────
  it('locationService.list and create dispatch correct HTTP contract', async () => {
    const requests: Array<{ url: string; method: string; body?: unknown }> = []

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      requests.push({ url, method, body })

      if (method === 'GET' && url.endsWith('/super-admin/locations')) {
        return new Response(
          JSON.stringify([
            { id: 10, name: 'Austin DC', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (method === 'POST' && url.endsWith('/super-admin/locations')) {
        return new Response(
          JSON.stringify({ id: 11, name: 'Dallas DC', is_active: true, created_at: '2026-01-02T00:00:00Z', updated_at: '2026-01-02T00:00:00Z' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('Not Found', { status: 404 })
    }

    const list = await locationService.list()
    assert.strictEqual(list.length, 1)
    assert.strictEqual(list[0].id, '10')
    assert.strictEqual(list[0].name, 'Austin DC')

    const created = await locationService.create({ name: 'Dallas DC', status: 'ACTIVE' })
    assert.strictEqual(created.id, '11')
    assert.strictEqual(created.name, 'Dallas DC')

    assert.strictEqual(requests[0].url, 'http://api.test.local/super-admin/locations')
    assert.strictEqual(requests[0].method, 'GET')
    assert.strictEqual(requests[1].url, 'http://api.test.local/super-admin/locations')
    assert.strictEqual(requests[1].method, 'POST')
    assert.deepStrictEqual(requests[1].body, { name: 'Dallas DC' })
  })

  it('locationService rethrows on 500 error without silent fallback to mock data', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 500, message: 'Database query timeout' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await locationService.list()
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 500)
        assert.strictEqual(err.message, 'Database query timeout')
        return true
      },
    )
  })

  // ─── 2. Admins Service ─────────────────────────────────────────────────────
  it('adminService dispatches list, create, activate, and deactivate correctly', async () => {
    const requests: Array<{ url: string; method: string; body?: unknown }> = []

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      requests.push({ url, method, body })

      if (method === 'GET' && url.endsWith('/super-admin/admins')) {
        return new Response(
          JSON.stringify([
            {
              id: 20,
              email: 'admin.twenty@test.com',
              username: 'adm20',
              first_name: 'Alex',
              last_name: 'Vance',
              phone_number: '555-0100',
              address: 'DC-1',
              location_id: 5,
              is_active: true,
              is_deleted: false,
              created_by_super_admin_id: 1,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
            },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (method === 'PATCH' && url.endsWith('/super-admin/admins/20/deactivate')) {
        return new Response(
          JSON.stringify({
            id: 20,
            email: 'admin.twenty@test.com',
            username: 'adm20',
            first_name: 'Alex',
            last_name: 'Vance',
            phone_number: '555-0100',
            address: 'DC-1',
            location_id: 5,
            is_active: false,
            is_deleted: false,
            created_by_super_admin_id: 1,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('Not Found', { status: 404 })
    }

    const admins = await adminService.list()
    assert.strictEqual(admins.length, 1)
    assert.strictEqual(admins[0].id, '20')
    assert.strictEqual(admins[0].name, 'Alex Vance')

    const deactivated = await adminService.deactivate('20')
    assert.strictEqual(deactivated.status, 'INACTIVE')

    assert.strictEqual(requests[0].url, 'http://api.test.local/super-admin/admins')
    assert.strictEqual(requests[0].method, 'GET')
    assert.strictEqual(requests[1].url, 'http://api.test.local/super-admin/admins/20/deactivate')
    assert.strictEqual(requests[1].method, 'PATCH')
  })

  it('adminService rethrows on error without silent fallback to mock data', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 503, message: 'Service Unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await adminService.list()
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 503)
        return true
      },
    )
  })

  // ─── 3. Vendors Service ────────────────────────────────────────────────────
  it('vendorService applies role-based endpoint routing and create payload mapping', async () => {
    const urls: string[] = []
    let postBody: unknown

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      urls.push(url)
      if (init?.method === 'POST') {
        postBody = JSON.parse(String(init.body))
        return new Response(
          JSON.stringify({
            id: 55,
            name: 'Apex Mechanical',
            phone_number: '555-0199',
            email: 'apex@example.com',
            address: 'Industrial District',
            is_active: false,
            lifecycle_status: 'PENDING_APPROVAL',
            is_deleted: false,
            created_by_admin_id: 20,
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Role-specific listing checks
    await vendorService.list('ADMIN')
    assert.strictEqual(urls[0], 'http://api.test.local/admin/partners?type=vendor')

    await vendorService.list('SUPER_ADMIN')
    assert.strictEqual(urls[1], 'http://api.test.local/super-admin/partners?type=vendor')

    // Create check
    const created = await vendorService.create({
      name: 'Apex Mechanical',
      owner: 'Admin 20',
      location: 'Downtown HQ',
      contactEmail: 'apex@example.com',
      phone: '555-0199',
      description: 'Industrial District',
    })

    assert.strictEqual(created.id, '55')
    assert.strictEqual(created.status, 'PENDING_APPROVAL')
    assert.strictEqual(urls[2], 'http://api.test.local/admin/partners')
    assert.deepStrictEqual(postBody, {
      name: 'Apex Mechanical',
      phone_number: '555-0199',
      email: 'apex@example.com',
      address: 'Industrial District',
      reason: 'Industrial District',
    })
  })

  it('vendorService rethrows on 403 Forbidden without silent fallback', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 403, message: 'Forbidden resource' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await vendorService.list('ADMIN')
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 403)
        return true
      },
    )
  })

  // ─── 4. Engineers Service ──────────────────────────────────────────────────
  it('engineerService handles direct vs vendor-based creation paths', async () => {
    const calls: Array<{ url: string; method: string; body: unknown }> = []

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      const body = init?.body ? JSON.parse(String(init.body)) : null
      calls.push({ url, method, body })

      return new Response(
        JSON.stringify({
          id: 99,
          name: 'Tech Specialist',
          phone_number: '555-0144',
          email: 'tech@example.com',
          address: 'Main Facility',
          is_active: true,
          lifecycle_status: 'ACTIVE',
          is_deleted: false,
          created_by_admin_id: 20,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // Direct Engineer Creation
    await engineerService.create({
      name: 'Tech Specialist Direct',
      phone: '555-0144',
      relationship: 'DIRECT',
      ownerAdmin: 'Admin 20',
      ownerAdminId: '20',
      location: 'Downtown HQ',
      locationId: '5',
      skill: 'Network',
      category: 'Senior',
    })
    assert.strictEqual(calls[0].url, 'http://api.test.local/admin/partners/service-engineers')
    assert.strictEqual(calls[0].method, 'POST')

    // Vendor-based Engineer Creation
    await engineerService.create({
      name: 'Tech Specialist Vendor',
      phone: '555-0144',
      relationship: 'VENDOR_BASED',
      vendor: 'Vendor Corp',
      vendorId: 'v-42',
      ownerAdmin: 'Admin 20',
      ownerAdminId: '20',
      location: 'Downtown HQ',
      locationId: '5',
      skill: 'Electrical',
      category: 'Junior',
    })
    assert.strictEqual(calls[1].url, 'http://api.test.local/admin/partners/42/service-engineers')
    assert.strictEqual(calls[1].method, 'POST')
  })

  it('engineerService rethrows on 500 error without silent fallback to mock data', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 500, message: 'Internal Server Error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await engineerService.list()
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 500)
        return true
      },
    )
  })

  // ─── 5. Requests Service ───────────────────────────────────────────────────
  it('requestService routes approval and rejection with correct PATCH endpoints', async () => {
    const patchedUrls: string[] = []

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (init?.method === 'PATCH') {
        patchedUrls.push(url)
        return new Response(
          JSON.stringify({
            id: 12,
            entity_type: 'partner',
            entity_id: 42,
            requested_action: 'onboard',
            request_type: 'VENDOR_ONBOARDING',
            reason: 'Onboard vendor.',
            requested_by_admin_id: 20,
            status: url.includes('/approve') ? 'approved' : 'rejected',
            resolved_by_super_admin_id: 1,
            created_at: '2026-01-01T00:00:00Z',
            resolved_at: '2026-01-01T01:00:00Z',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const approved = await requestService.decide('REQ-12', 'APPROVED', '')
    assert.strictEqual(approved.status, 'APPROVED')
    assert.strictEqual(patchedUrls[0], 'http://api.test.local/super-admin/status-requests/12/approve')

    const rejected = await requestService.decide('REQ-12', 'REJECTED', 'Incomplete compliance documents.')
    assert.strictEqual(rejected.status, 'REJECTED')
    assert.strictEqual(patchedUrls[1], 'http://api.test.local/super-admin/status-requests/12/reject')
  })

  it('requestService rethrows error without silent fallback', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 502, message: 'Bad Gateway' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await requestService.list('SUPER_ADMIN')
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 502)
        return true
      },
    )
  })

  // ─── 6. Inventory Service ──────────────────────────────────────────────────
  it('inventoryService routes role-based queries and creates inventory item', async () => {
    const urls: string[] = []
    let postedPayload: unknown

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      urls.push(url)
      if (init?.method === 'POST') {
        postedPayload = JSON.parse(String(init.body))
        return new Response(
          JSON.stringify({
            id: 88,
            name: 'Cat6 Cable Reel',
            type_id: 1,
            category_id: 2,
            location_id: 5,
            units: 10,
            price_per_unit: '45.00',
            tax_applicable: true,
            tax_percentage: '8.25',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await inventoryService.list('ADMIN')
    assert.strictEqual(urls[0], 'http://api.test.local/admin/inventory')

    await inventoryService.list('SUPER_ADMIN', 5)
    assert.strictEqual(urls[1], 'http://api.test.local/super-admin/inventory?location_id=5')

    const created = await inventoryService.create('ADMIN', {
      name: 'Cat6 Cable Reel',
      price_per_unit: '45.00',
      units: 10,
      tax_applicable: true,
      tax_percentage: '8.25',
    })
    assert.strictEqual(created.id, '88')
    assert.strictEqual(urls[2], 'http://api.test.local/admin/inventory')
    assert.deepStrictEqual(postedPayload, {
      name: 'Cat6 Cable Reel',
      price_per_unit: '45.00',
      units: 10,
      tax_applicable: true,
      tax_percentage: '8.25',
    })
  })

  it('inventoryService rethrows on 500 error without silent fallback to mock data', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 500, message: 'Database query error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await inventoryService.list('ADMIN')
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 500)
        return true
      },
    )
  })

  // ─── 7. Configuration Service ──────────────────────────────────────────────
  it('configurationService dispatches GET and PATCH config correctly', async () => {
    const requests: Array<{ url: string; method: string; body?: unknown }> = []

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      requests.push({ url, method, body })

      if (method === 'GET') {
        return new Response(
          JSON.stringify([
            { id: 1, config_key: 'session_idle_timeout_minutes', config_value: '30', updated_at: '2026-01-01T00:00:00Z' },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (method === 'PATCH') {
        return new Response(
          JSON.stringify({ id: 1, config_key: 'session_idle_timeout_minutes', config_value: '45', updated_at: '2026-01-01T01:00:00Z' }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('Not Found', { status: 404 })
    }

    const configs = await configurationService.list()
    assert.strictEqual(configs.length, 1)
    assert.strictEqual(configs[0].key, 'session_idle_timeout_minutes')
    assert.strictEqual(configs[0].value, '30')

    const updated = await configurationService.update('session_idle_timeout_minutes', '45')
    assert.strictEqual(updated.value, '45')

    assert.strictEqual(requests[0].url, 'http://api.test.local/super-admin/config')
    assert.strictEqual(requests[0].method, 'GET')
    assert.strictEqual(requests[1].url, 'http://api.test.local/super-admin/config/session_idle_timeout_minutes')
    assert.strictEqual(requests[1].method, 'PATCH')
    assert.deepStrictEqual(requests[1].body, { config_value: '45' })
  })

  it('configurationService rethrows on error without silent fallback to mock data', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 500, message: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await configurationService.list()
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 500)
        return true
      },
    )
  })

  // ─── 8. Master Data Service ────────────────────────────────────────────────
  it('masterDataService routes role-based queries and mutations correctly', async () => {
    const requests: Array<{ url: string; method: string; body?: unknown }> = []

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method || 'GET'
      const body = init?.body ? JSON.parse(String(init.body)) : undefined
      requests.push({ url, method, body })

      if (method === 'GET') {
        return new Response(
          JSON.stringify([
            { id: 1, type: 'service_engineer_skill', text: 'HVAC Certification', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
          ]),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (method === 'POST') {
        return new Response(
          JSON.stringify({ id: 2, type: 'service_engineer_skill', text: 'Electrical', is_active: true, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('Not Found', { status: 404 })
    }

    // Role-specific listing checks
    const adminItems = await masterDataService.list('ADMIN', 'service_engineer_skill')
    assert.strictEqual(requests[0].url, 'http://api.test.local/admin/master-data?type=service_engineer_skill')
    assert.strictEqual(adminItems[0].text, 'HVAC Certification')

    await masterDataService.list('SUPER_ADMIN', 'inventory_category')
    assert.strictEqual(requests[1].url, 'http://api.test.local/super-admin/master-data?type=inventory_category')

    // Create entry
    const created = await masterDataService.create({ type: 'service_engineer_skill', text: 'Electrical' })
    assert.strictEqual(created.id, '2')
    assert.strictEqual(created.text, 'Electrical')
    assert.strictEqual(requests[2].url, 'http://api.test.local/super-admin/master-data')
    assert.strictEqual(requests[2].method, 'POST')
    assert.deepStrictEqual(requests[2].body, { type: 'service_engineer_skill', text: 'Electrical' })
  })

  it('masterDataService rethrows on 500 error without silent fallback to mock data', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 500, message: 'Database connection failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })

    await assert.rejects(
      async () => {
        await masterDataService.list('SUPER_ADMIN')
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 500)
        return true
      },
    )
  })
})
