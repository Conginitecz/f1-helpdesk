import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  validateMockLogin,
  loginWithMockCredentials,
  type MockRole,
} from '../lib/mock-auth'
import { saveToken, loadToken, clearToken } from '../lib/api-client'

describe('Authentication & Session Handling', () => {
  it('validates mock credentials correctly', () => {
    assert.strictEqual(validateMockLogin('', ''), 'Email address is required.')
    assert.strictEqual(validateMockLogin('invalid-email', 'password'), 'Enter a valid email address.')
    assert.strictEqual(validateMockLogin('admin@f1helpdesk.com', ''), 'Password is required.')
    assert.strictEqual(validateMockLogin('admin@f1helpdesk.com', 'password'), null)
  })

  it('authenticates Super Admin with mock credentials', async () => {
    const res = await loginWithMockCredentials('superadmin@f1helpdesk.com', 'password')
    assert.strictEqual(res.ok, true)
    if (res.ok) {
      assert.strictEqual(res.session.user.role, 'SUPER_ADMIN')
      assert.strictEqual(res.session.user.name, 'Jordan Lee')
      assert.strictEqual(res.session.user.location, 'Global')
    }
  })

  it('authenticates Admin with mock credentials', async () => {
    const res = await loginWithMockCredentials('admin@f1helpdesk.com', 'password')
    assert.strictEqual(res.ok, true)
    if (res.ok) {
      assert.strictEqual(res.session.user.role, 'ADMIN')
      assert.strictEqual(res.session.user.location, 'Downtown HQ')
    }
  })

  it('rejects invalid password', async () => {
    const res = await loginWithMockCredentials('admin@f1helpdesk.com', 'wrongpassword')
    assert.strictEqual(res.ok, false)
    if (!res.ok) {
      assert.strictEqual(res.error, 'Invalid email or password. Try one of the demo accounts below.')
    }
  })

  it('manages authorization token via token helpers', () => {
    if (typeof (globalThis as any).sessionStorage === 'undefined') {
      const store = new Map<string, string>()
      ;(globalThis as any).sessionStorage = {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, v),
        removeItem: (k: string) => store.delete(k),
        clear: () => store.clear(),
      }
    }
    const originalToken = loadToken()
    try {
      saveToken('test-jwt-token-xyz')
      assert.strictEqual(loadToken(), 'test-jwt-token-xyz')
      clearToken()
      assert.strictEqual(loadToken(), null)
    } finally {
      if (originalToken) saveToken(originalToken)
    }
  })
})
