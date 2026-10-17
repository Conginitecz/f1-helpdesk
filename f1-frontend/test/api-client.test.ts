import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert'
import {
  apiClient,
  saveToken,
  clearToken,
  ApiError,
  ApiNetworkError,
} from '../lib/api-client'

describe('HTTP API Client (api-client.ts)', () => {
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

  it('throws ApiError if NEXT_PUBLIC_API_URL is not configured', async () => {
    delete process.env.NEXT_PUBLIC_API_URL
    await assert.rejects(
      async () => {
        await apiClient.get('test/path')
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 0)
        assert.match(err.message, /NEXT_PUBLIC_API_URL is not configured/)
        return true
      },
    )
  })

  it('performs unauthenticated GET with correct URL and default headers', async () => {
    let capturedUrl = ''
    let capturedOptions: RequestInit | undefined

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = String(input)
      capturedOptions = init
      return new Response(JSON.stringify({ success: true, count: 5 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await apiClient.get<{ success: boolean; count: number }>('health/check')
    assert.deepStrictEqual(data, { success: true, count: 5 })
    assert.strictEqual(capturedUrl, 'http://api.test.local/health/check')
    assert.strictEqual(capturedOptions?.method, 'GET')
    const headers = capturedOptions?.headers as Record<string, string>
    assert.strictEqual(headers['Content-Type'], 'application/json')
    assert.strictEqual(headers['Accept'], 'application/json')
    assert.strictEqual(headers['Authorization'], undefined)
  })

  it('throws 401 ApiError for authenticated calls when no token is present', async () => {
    await assert.rejects(
      async () => {
        await apiClient.getAuth('super-admin/locations')
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 401)
        assert.strictEqual(err.isUnauthorized, true)
        assert.match(err.message, /No authentication token found/)
        return true
      },
    )
  })

  it('attaches Bearer token header for authenticated calls', async () => {
    saveToken('test-jwt-token-abc-123')
    let capturedAuth = ''

    globalThis.fetch = async (_input: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>
      capturedAuth = headers?.['Authorization'] || ''
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const res = await apiClient.getAuth<{ ok: boolean }>('super-admin/me')
    assert.deepStrictEqual(res, { ok: true })
    assert.strictEqual(capturedAuth, 'Bearer test-jwt-token-abc-123')
  })

  it('serializes request body for POST, POST Auth, and PATCH Auth', async () => {
    saveToken('token-xyz')
    const captured: Array<{ url: string; method: string; body: unknown; auth?: string }> = []

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>
      captured.push({
        url: String(input),
        method: init?.method || 'GET',
        body: init?.body ? JSON.parse(String(init.body)) : null,
        auth: headers?.['Authorization'],
      })
      return new Response(JSON.stringify({ id: 101 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    await apiClient.post('auth/login', { email: 'user@example.com', password: 'secret' })
    await apiClient.postAuth('super-admin/locations', { name: 'Austin HQ' })
    await apiClient.patchAuth('super-admin/config/default_timezone', { config_value: 'UTC' })

    assert.strictEqual(captured.length, 3)
    assert.strictEqual(captured[0].url, 'http://api.test.local/auth/login')
    assert.strictEqual(captured[0].method, 'POST')
    assert.deepStrictEqual(captured[0].body, { email: 'user@example.com', password: 'secret' })
    assert.strictEqual(captured[0].auth, undefined)

    assert.strictEqual(captured[1].url, 'http://api.test.local/super-admin/locations')
    assert.strictEqual(captured[1].method, 'POST')
    assert.deepStrictEqual(captured[1].body, { name: 'Austin HQ' })
    assert.strictEqual(captured[1].auth, 'Bearer token-xyz')

    assert.strictEqual(captured[2].url, 'http://api.test.local/super-admin/config/default_timezone')
    assert.strictEqual(captured[2].method, 'PATCH')
    assert.deepStrictEqual(captured[2].body, { config_value: 'UTC' })
    assert.strictEqual(captured[2].auth, 'Bearer token-xyz')
  })

  it('handles 204 No Content responses cleanly as undefined', async () => {
    globalThis.fetch = async () => new Response(null, { status: 204 })
    const result = await apiClient.post('auth/logout')
    assert.strictEqual(result, undefined)
  })

  it('converts non-2xx responses with JSON error payload into ApiError', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          statusCode: 409,
          message: 'An equivalent pending request already exists',
          error: 'Conflict',
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        },
      )

    await assert.rejects(
      async () => {
        await apiClient.post('admin/partners/request-status-change', {})
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 409)
        assert.strictEqual(err.isConflict, true)
        assert.strictEqual(err.message, 'An equivalent pending request already exists')
        return true
      },
    )
  })

  it('formats array error messages from class-validator cleanly', async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          statusCode: 400,
          message: ['name must not be empty', 'phone_number must be valid'],
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      )

    await assert.rejects(
      async () => {
        await apiClient.post('admin/partners', {})
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 400)
        assert.strictEqual(err.message, 'name must not be empty; phone_number must be valid')
        return true
      },
    )
  })

  it('handles non-JSON error responses gracefully', async () => {
    globalThis.fetch = async () =>
      new Response('Gateway Timeout', {
        status: 504,
        statusText: 'Gateway Timeout',
      })

    await assert.rejects(
      async () => {
        await apiClient.get('some/service')
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiError)
        assert.strictEqual(err.statusCode, 504)
        assert.strictEqual(err.isServerError, true)
        assert.strictEqual(err.message, 'HTTP 504: Gateway Timeout')
        return true
      },
    )
  })

  it('wraps low-level fetch failures in ApiNetworkError', async () => {
    globalThis.fetch = async () => {
      throw new TypeError('fetch failed: connection refused')
    }

    await assert.rejects(
      async () => {
        await apiClient.get('some/service')
      },
      (err: unknown) => {
        assert.ok(err instanceof ApiNetworkError)
        assert.match(err.message, /Network error: fetch failed: connection refused/)
        return true
      },
    )
  })
})
