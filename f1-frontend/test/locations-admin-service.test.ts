import { describe, it } from 'node:test'
import assert from 'node:assert'
import { locationService } from '../lib/locations-service'
import { adminService } from '../lib/admin-service'

describe('Locations & Admin Management Services', () => {
  it('lists locations and snapshots', async () => {
    const locations = await locationService.list()
    assert.ok(locations.length > 0)
    const snapshot = locationService.snapshot()
    assert.strictEqual(snapshot.length, locations.length)
  })

  it('creates and toggles status of a location', async () => {
    const created = await locationService.create({
      name: 'South Hub Facility',
      status: 'ACTIVE',
    })
    assert.strictEqual(created.name, 'South Hub Facility')
    assert.strictEqual(created.status, 'ACTIVE')

    const updated = await locationService.update(created.id, {
      name: 'South Hub Facility',
      status: 'INACTIVE',
    })
    assert.strictEqual(updated.status, 'INACTIVE')
  })

  it('lists admins and verifies location scoping attributes', async () => {
    const admins = await adminService.list()
    assert.ok(admins.length > 0)
    for (const admin of admins) {
      assert.ok(admin.name)
      assert.ok(admin.email)
      assert.ok(admin.location)
    }
  })

  it('creates a new operational admin', async () => {
    const email = `test.admin.${Date.now()}@example.com`
    const created = await adminService.create({
      name: 'Regional Admin',
      email,
      location: 'Downtown HQ',
      status: 'ACTIVE',
    })
    assert.strictEqual(created.name, 'Regional Admin')
    assert.strictEqual(created.email, email)
    assert.strictEqual(created.location, 'Downtown HQ')

    const updated = await adminService.deactivate(created.id)
    assert.strictEqual(updated.status, 'INACTIVE')
    const reactivated = await adminService.activate(created.id)
    assert.strictEqual(reactivated.status, 'ACTIVE')
  })

  it('rejects admin creation with duplicate email', async () => {
    const existing = (await adminService.list())[0]
    await assert.rejects(
      async () => {
        await adminService.create({
          name: 'Duplicate Admin',
          email: existing.email,
          location: 'Downtown HQ',
          status: 'ACTIVE',
        })
      },
      /already exists/,
    )
  })
})
