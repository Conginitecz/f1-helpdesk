import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  masterDataService,
  masterDataTypeLabel,
  mapMasterDataResponse,
  MASTER_DATA_TYPES,
  type MasterDataApiResponse,
} from '../lib/master-data-service'

describe('Master Data Service', () => {
  it('provides friendly labels for all master data types', () => {
    for (const type of MASTER_DATA_TYPES) {
      const label = masterDataTypeLabel(type)
      assert.ok(label && label.length > 0)
    }
    assert.strictEqual(masterDataTypeLabel('service_engineer_skill'), 'Engineer Skills')
    assert.strictEqual(masterDataTypeLabel('service_engineer_category'), 'Engineer Categories')
    assert.strictEqual(masterDataTypeLabel('inventory_category'), 'Inventory Categories')
  })

  it('maps backend response accurately', () => {
    const raw: MasterDataApiResponse = {
      id: 10,
      type: 'service_engineer_skill',
      text: 'Fiber Optic Splicing',
      is_active: true,
      created_at: '2026-10-15T00:00:00Z',
      updated_at: '2026-10-15T01:00:00Z',
    }
    const mapped = mapMasterDataResponse(raw)
    assert.strictEqual(mapped.id, '10')
    assert.strictEqual(mapped.type, 'service_engineer_skill')
    assert.strictEqual(mapped.text, 'Fiber Optic Splicing')
    assert.strictEqual(mapped.isActive, true)
  })

  it('filters master data by type and role', async () => {
    const skills = await masterDataService.list('SUPER_ADMIN', 'service_engineer_skill')
    assert.ok(skills.length > 0)
    for (const item of skills) {
      assert.strictEqual(item.type, 'service_engineer_skill')
    }

    const adminSkills = await masterDataService.list('ADMIN', 'service_engineer_skill')
    for (const item of adminSkills) {
      assert.strictEqual(item.isActive, true)
    }
  })

  it('creates a new master data entry', async () => {
    const uniqueText = `Custom Skill ${Date.now()}`
    const created = await masterDataService.create({
      type: 'service_engineer_skill',
      text: uniqueText,
    })
    assert.strictEqual(created.type, 'service_engineer_skill')
    assert.strictEqual(created.text, uniqueText)
    assert.strictEqual(created.isActive, true)

    const list = await masterDataService.list('SUPER_ADMIN', 'service_engineer_skill')
    assert.ok(list.some((i) => i.text === uniqueText))
  })

  it('rejects duplicate master data entries within same type', async () => {
    const existing = (await masterDataService.list('SUPER_ADMIN', 'service_engineer_skill'))[0]
    await assert.rejects(
      async () => {
        await masterDataService.create({
          type: 'service_engineer_skill',
          text: existing.text,
        })
      },
      /A row with this type and text already exists/,
    )
  })

  it('updates master data entry text', async () => {
    const list = await masterDataService.list('SUPER_ADMIN', 'inventory_category')
    const target = list[0]
    const newText = `${target.text} (Updated)`

    const updated = await masterDataService.update(target.id, newText)
    assert.strictEqual(updated.text, newText)
    assert.strictEqual(updated.id, target.id)
  })

  it('rejects empty text on update', async () => {
    const list = await masterDataService.list('SUPER_ADMIN', 'inventory_category')
    await assert.rejects(
      async () => {
        await masterDataService.update(list[0].id, '   ')
      },
      /Master data entry text cannot be empty./,
    )
  })
})
