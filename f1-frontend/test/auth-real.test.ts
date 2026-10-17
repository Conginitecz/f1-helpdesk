import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import {
  realLogin,
  restoreSession,
  realLogout,
  isApiConfigured,
} from '../lib/auth'
import { saveToken, loadToken, clearToken } from '../lib/api-client'

describe('Real Authentication Service (auth.ts)', () => {
  const originalFetch = globalThis.fetch
  const originalEnvUrl = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.test.local'
    clearToken()
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

  it('isApiConfigured accurately reflects environment variable presence', () => {
    // process.env.NEXT_PUBLIC_API_URL = 'http://localhost:xxxx'
    assert.strictEqual(isApiConfigured(), true)

    // process.env.NEXT_PUBLIC_API_URL = ''
    assert.strictEqual(isApiConfigured(), false)

    // process.env.NEXT_PUBLIC_API_URL = '   '
    assert.strictEqual(isApiConfigured(), false)

    // delete process.env.NEXT_PUBLIC_API_URL
    assert.strictEqual(isApiConfigured(), false)
  })

  it('realLogin succeeds: stores JWT, fetches profile, and returns normalized AppUser', async () => {
    const calls: Array<{ url: string; auth?: string }> = []

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const headers = init?.headers as Record<string, string>
      calls.push({ url, auth: headers?.['Authorization'] })

      if (url.endsWith('/auth/login')) {
        return new Response(
          JSON.stringify({
            access_token: 'signed-jwt-token-777',
            token_type: 'Bearer',
            expires_in: '1h',
            user: { id: 1, role: 'super_admin' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      if (url.endsWith('/auth/me')) {
        return new Response(
          JSON.stringify({
            id: 1,
            role: 'super_admin',
            display_name: 'Jordan Lee',
            username: 'superadmin',
            email: 'superadmin@f1helpdesk.com',
            location_id: null,
            location_name: null,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }

      return new Response('Not Found', { status: 404 })
    }

    const res = await realLogin('superadmin@f1helpdesk.com', 'Pass123!')
    assert.strictEqual(res.ok, true)
    if (res.ok) {
      assert.strictEqual(res.user.id, 1)
      assert.strictEqual(res.user.name, 'Jordan Lee')
      assert.strictEqual(res.user.role, 'SUPER_ADMIN')
      assert.strictEqual(res.user.location, 'Global')
      assert.strictEqual(res.user.location_id, null)
    }

    // Verify token was stored in sessionStorage
    assert.strictEqual(loadToken(), 'signed-jwt-token-777')

    // Verify auth/me attached the newly stored token
    assert.strictEqual(calls.length, 2)
    assert.strictEqual(calls[0].url, 'http://api.test.local/auth/login')
    assert.strictEqual(calls[1].url, 'http://api.test.local/auth/me')
    assert.strictEqual(calls[1].auth, 'Bearer signed-jwt-token-777')
  })

  it('realLogin handles location admin role and location mapping', async () => {
    globalThis.fetch = async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith('/auth/login')) {
        return new Response(
          JSON.stringify({
            access_token: 'admin-jwt-token-888',
            token_type: 'Bearer',
            expires_in: '1h',
            user: { id: 2, role: 'admin' },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      if (url.endsWith('/auth/me')) {
        return new Response(
          JSON.stringify({
            id: 2,
            role: 'admin',
            display_name: 'Olivia Martin',
            username: 'admin',
            email: 'admin@f1helpdesk.com',
            location_id: 5,
            location_name: 'Downtown HQ',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
      }
      return new Response('Not Found', { status: 404 })
    }

    const res = await realLogin('admin@f1helpdesk.com', 'Pass123!')
    assert.strictEqual(res.ok, true)
    if (res.ok) {
      assert.strictEqual(res.user.id, 2)
      assert.strictEqual(res.user.name, 'Olivia Martin')
      assert.strictEqual(res.user.role, 'ADMIN')
      assert.strictEqual(res.user.location, 'Downtown HQ')
      assert.strictEqual(res.user.location_id, 5)
    }
  })

  it('realLogin returns friendly error on 401 Unauthorized', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 401, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })

    const res = await realLogin('wrong@example.com', 'badpass')
    assert.strictEqual(res.ok, false)
    if (!res.ok) {
      assert.strictEqual(res.error, 'Invalid email or password.')
    }
    assert.strictEqual(loadToken(), null)
  })

  it('realLogin returns network error details when backend unreachable', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed: ECONNREFUSED')
    }

    const res = await realLogin('any@example.com', 'pass')
    assert.strictEqual(res.ok, false)
    if (!res.ok) {
      assert.strictEqual(res.isNetwork, true)
      assert.match(res.error, /Cannot reach the server/)
    }
  })

  it('restoreSession returns null when no token is in storage', async () => {
    const user = await restoreSession()
    assert.strictEqual(user, null)
  })

  it('restoreSession restores AppUser when stored token is valid', async () => {
    saveToken('active-token-999')

    globalThis.fetch = async (input: RequestInfo | URL) => {
      assert.ok(String(input).endsWith('/auth/me'))
      return new Response(
        JSON.stringify({
          id: 1,
          role: 'super_admin',
          display_name: 'Jordan Lee',
          username: 'superadmin',
          email: 'superadmin@f1helpdesk.com',
          location_id: null,
          location_name: null,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const user = await restoreSession()
    assert.ok(user)
    assert.strictEqual(user?.name, 'Jordan Lee')
    assert.strictEqual(user?.role, 'SUPER_ADMIN')
    assert.strictEqual(loadToken(), 'active-token-999')
  })

  it('restoreSession clears token and returns null if backend returns 401', async () => {
    saveToken('expired-token-000')

    globalThis.fetch = async () =>
      new Response(JSON.stringify({ statusCode: 401, message: 'Token expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })

    const user = await restoreSession()
    assert.strictEqual(user, null)
    assert.strictEqual(loadToken(), null)
  })

  it('realLogout clears stored token and sends acknowledgement request', async () => {
    saveToken('token-to-clear')
    let logoutCalled = false

    globalThis.fetch = async (input: RequestInfo | URL) => {
      if (String(input).endsWith('/auth/logout')) {
        logoutCalled = true
        return new Response(null, { status: 204 })
      }
      return new Response('Not Found', { status: 404 })
    }

    await realLogout()
    assert.strictEqual(loadToken(), null)
    assert.strictEqual(logoutCalled, true)
  })
})
