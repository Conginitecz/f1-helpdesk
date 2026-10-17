/**
 * F1 Help Desk — API client
 *
 * Thin, typed wrapper around the browser Fetch API.
 * Base URL is read from NEXT_PUBLIC_API_URL (set in .env.local).
 * All authenticated requests attach the Bearer token from sessionStorage.
 *
 * Error model
 * -----------
 * - Network / offline errors  → throws ApiNetworkError
 * - Non-2xx HTTP responses    → throws ApiError (contains statusCode + message)
 * - 2xx with a body           → returns typed response data
 * - 2xx with no body (204)    → returns undefined
 *
 * Token storage
 * -------------
 * sessionStorage is used intentionally:
 * - Survives same-tab page refreshes (unlike in-memory React state).
 * - Cleared automatically when the tab is closed (better XSS isolation than localStorage).
 * - Simpler than httpOnly cookies which require backend cookie-setting endpoints
 *   and credential: 'include' CORS configuration.
 * Trade-off: a successful XSS attack within the tab can still read the token.
 * For an internal operations console this is an accepted risk.
 * Never store the token in a globally accessible variable.
 */

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '')
}

const TOKEN_KEY = 'f1_access_token'

// ─── Token helpers ───────────────────────────────────────────────────────────

/** Persist the JWT. Called right after a successful login. */
export function saveToken(token: string): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(TOKEN_KEY, token)
}

/** Retrieve the stored JWT, or null if absent / not in a browser context. */
export function loadToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem(TOKEN_KEY)
}

/** Remove the stored JWT. Called on logout. */
export function clearToken(): void {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.removeItem(TOKEN_KEY)
}

// ─── Error types ─────────────────────────────────────────────────────────────

/** Thrown when the network request itself fails (offline, DNS, CORS). */
export class ApiNetworkError extends Error {
  constructor(cause: unknown) {
    super(
      cause instanceof Error
        ? `Network error: ${cause.message}`
        : 'Network error: unable to reach the server',
    )
    this.name = 'ApiNetworkError'
  }
}

/** Thrown when the server responds with a non-2xx status. */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401
  }
  get isForbidden(): boolean {
    return this.statusCode === 403
  }
  get isNotFound(): boolean {
    return this.statusCode === 404
  }
  get isConflict(): boolean {
    return this.statusCode === 409
  }
  get isServerError(): boolean {
    return this.statusCode >= 500
  }
}

// ─── Core fetch helper ───────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Request body; will be JSON-serialised. */
  body?: unknown
  /** When true, attaches the stored Bearer token as Authorization header. */
  authenticated?: boolean
  /** Override headers (merged with defaults). */
  headers?: Record<string, string>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, authenticated = false, headers: extraHeaders = {} } = options

  const baseUrl = getBaseUrl()
  if (!baseUrl) {
    throw new ApiError(0, 'NEXT_PUBLIC_API_URL is not configured. Check .env.local.')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...extraHeaders,
  }

  if (authenticated) {
    const token = loadToken()
    if (!token) {
      throw new ApiError(401, 'No authentication token found. Please sign in.')
    }
    headers['Authorization'] = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${baseUrl}/${path.replace(/^\//, '')}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (cause) {
    throw new ApiNetworkError(cause)
  }

  // 204 No Content — valid success with no body
  if (response.status === 204) {
    return undefined as T
  }

  // Parse body regardless of status (errors also carry JSON bodies from NestJS)
  let data: unknown
  try {
    data = await response.json()
  } catch {
    // Body is not JSON (e.g. plain text error from proxy)
    if (!response.ok) {
      throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`)
    }
    return undefined as T
  }

  if (!response.ok) {
    // NestJS error shape: { statusCode, message, error? }
    const errorData = data as { statusCode?: number; message?: string | string[] }
    const msg = Array.isArray(errorData.message)
      ? errorData.message.join('; ')
      : (errorData.message ?? `HTTP ${response.status}`)
    throw new ApiError(response.status, msg)
  }

  return data as T
}

// ─── Public API surface ───────────────────────────────────────────────────────

export const apiClient = {
  /** Unauthenticated GET. */
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' })
  },

  /** Authenticated GET — attaches stored Bearer token. */
  getAuth<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET', authenticated: true })
  },

  /** Unauthenticated POST (e.g., login). */
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body })
  },

  /** Authenticated POST. */
  postAuth<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'POST', body, authenticated: true })
  },

  /** Authenticated PATCH. */
  patchAuth<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: 'PATCH', body, authenticated: true })
  },

  /** Authenticated DELETE. */
  deleteAuth<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE', authenticated: true })
  },
}
