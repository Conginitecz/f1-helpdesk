import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  vendorService,
  vendorScopeAllows,
  validateVendorInput,
} from '../lib/vendors-service'
import {
  engineerService,
  engineerInAdminScope,
} from '../lib/engineers-service'
import {
  requestService,
  requestTypeLabel,
} from '../lib/requests-service'

describe('Vendors, Engineers & Status Requests Integration', () => {
  it('validates vendor form inputs', () => {
    assert.strictEqual(
      validateVendorInput({ name: '', contactEmail: '' }),
      'Vendor name is required.',
    )
    assert.strictEqual(
      validateVendorInput({ name: 'Valid Vendor', contactEmail: 'invalid-email' }),
      'Enter a valid contact email.',
    )
    assert.strictEqual(
      validateVendorInput({ name: 'Valid Vendor', contactEmail: 'contact@vendor.com' }),
      null,
    )
  })

  it('creates vendor with PENDING_APPROVAL onboarding status and Admin location scope', async () => {
    const created = await vendorService.create({
      name: `Vendor Corp ${Date.now()}`,
      owner: 'Test Admin',
      location: 'Downtown HQ',
      contactEmail: 'corp@example.com',
      phone: '555-0199',
      description: 'Regional maintenance provider',
    })
    assert.strictEqual(created.status, 'PENDING_APPROVAL')
    assert.strictEqual(created.onboardingStatus, 'PENDING_APPROVAL')
    assert.strictEqual(created.operationalStatus, 'INACTIVE')
    assert.strictEqual(created.location, 'Downtown HQ')

    assert.strictEqual(vendorScopeAllows('Downtown HQ', created), true)
    assert.strictEqual(vendorScopeAllows('North Campus', created), false)
  })

  it('creates direct engineer scoped to admin location', async () => {
    const created = await engineerService.create({
      name: 'Elena Rostova',
      phone: '555-0182',
      relationship: 'DIRECT',
      ownerAdminId: 'Test Admin',
      ownerAdmin: 'Test Admin',
      locationId: 'Downtown HQ',
      location: 'Downtown HQ',
      skill: 'HVAC',
      category: 'Lead',
    })
    assert.strictEqual(created.name, 'Elena Rostova')
    assert.strictEqual(created.relationship, 'DIRECT')
    assert.strictEqual(created.status, 'ACTIVE')

    const inScope = engineerInAdminScope(created, {
      name: 'Test Admin',
      location: 'Downtown HQ',
    })
    assert.strictEqual(inScope, true)
  })

  it('handles lifecycle status requests and decisions cleanly', async () => {
    const uniqueEntityId = `v-test-${Date.now()}`
    const req = await requestService.create({
      type: 'VENDOR_ACTIVATION',
      entityId: uniqueEntityId,
      entity: 'Test Partner',
      action: 'Activate vendor',
      currentStatus: 'Inactive',
      requestedStatus: 'Active',
      requester: 'Test Admin',
      requesterId: 'admin-1',
      location: 'Downtown HQ',
      reason: 'Contract renewed for 2027.',
    })
    assert.strictEqual(req.status, 'PENDING')
    assert.strictEqual(req.reason, 'Contract renewed for 2027.')

    // Rejection requires feedback
    await assert.rejects(
      async () => {
        await requestService.decide(req.id, 'REJECTED', '   ')
      },
      /Rejection feedback is required./,
    )

    // Successful decision
    const approved = await requestService.decide(req.id, 'APPROVED', '')
    assert.strictEqual(approved.status, 'APPROVED')
  })

  it('formats request type labels properly', () => {
    assert.strictEqual(requestTypeLabel('VENDOR_ONBOARDING'), 'Vendor Onboarding')
    assert.strictEqual(requestTypeLabel('VENDOR_DEACTIVATION'), 'Vendor Deactivation')
    assert.strictEqual(requestTypeLabel('SERVICE_ENGINEER_ACTIVATION'), 'Service Engineer Activation')
  })
})
