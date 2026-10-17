import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  inventoryService,
  mapInventoryResponse,
  type InventoryApiResponse,
} from '../lib/inventory-service'

describe('Inventory Service', () => {
  it('maps backend response correctly into UI inventory item', () => {
    const raw: InventoryApiResponse = {
      id: 42,
      name: 'Cat6 Ethernet Cable Reel',
      type_id: 1,
      category_id: 2,
      units: 15,
      price_per_unit: '85.50',
      tax_applicable: true,
      tax_percentage: '5.00',
      location_id: 5,
      location_name: 'Test Location 5',
      created_by_admin_id: 20,
      created_by_super_admin_id: null,
      is_active: true,
      created_at: '2026-10-15T00:00:00Z',
      updated_at: '2026-10-15T01:00:00Z',
    }
    const mapped = mapInventoryResponse(raw)
    assert.strictEqual(mapped.id, '42')
    assert.strictEqual(mapped.name, 'Cat6 Ethernet Cable Reel')
    assert.strictEqual(mapped.quantity, 15)
    assert.strictEqual(mapped.pricePerUnit, '85.50')
    assert.strictEqual(mapped.value, '$85.50')
    assert.strictEqual(mapped.locationId, 5)
    assert.strictEqual(mapped.location, 'Test Location 5')
    assert.strictEqual(mapped.status, 'ACTIVE')
    assert.strictEqual(mapped.taxApplicable, true)
    assert.strictEqual(mapped.taxPercentage, '5.00')
  })

  it('validates price_per_unit format on creation', async () => {
    await assert.rejects(
      async () => {
        await inventoryService.create('ADMIN', {
          name: 'Valid Name',
          price_per_unit: 'invalid-price',
        })
      },
      /Unit price must be a decimal string like 12.50/,
    )

    await assert.rejects(
      async () => {
        await inventoryService.create('ADMIN', {
          name: 'Valid Name',
          price_per_unit: '12.345', // more than 2 decimals
        })
      },
      /Unit price must be a decimal string like 12.50/,
    )
  })

  it('validates item name cannot be empty on creation', async () => {
    await assert.rejects(
      async () => {
        await inventoryService.create('ADMIN', {
          name: '   ',
          price_per_unit: '12.50',
        })
      },
      /Item name is required./,
    )
  })

  it('creates inventory item and adds to local snapshot', async () => {
    const created = await inventoryService.create('ADMIN', {
      name: 'Wireless Access Point',
      units: 8,
      price_per_unit: '199.99',
      category: 'Networking',
    })

    assert.strictEqual(created.name, 'Wireless Access Point')
    assert.strictEqual(created.quantity, 8)
    assert.strictEqual(created.pricePerUnit, '199.99')
    assert.strictEqual(created.status, 'ACTIVE')

    const snapshot = inventoryService.snapshot()
    const found = snapshot.find((i) => i.name === 'Wireless Access Point')
    assert.ok(found)
  })

  it('updates existing inventory item', async () => {
    const list = await inventoryService.list('SUPER_ADMIN')
    assert.ok(list.length > 0)
    const target = list[0]

    const updated = await inventoryService.update(target.id, {
      name: `${target.name} - Updated`,
      units: target.quantity + 5,
      is_active: false,
    })

    assert.strictEqual(updated.name, `${target.name} - Updated`)
    assert.strictEqual(updated.quantity, target.quantity + 5)
    assert.strictEqual(updated.status, 'INACTIVE')
  })

  it('filters inventory items by search query', async () => {
    const results = await inventoryService.list('SUPER_ADMIN', undefined, 'CCTV')
    for (const item of results) {
      const match = `${item.name} ${item.category} ${item.location}`.toLowerCase().includes('cctv')
      assert.strictEqual(match, true)
    }
  })
})
