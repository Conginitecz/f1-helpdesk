/**
 * F1 Help Desk — Real authentication service
 *
 * Replaces lib/mock-auth.ts for production use.
 * lib/mock-auth.ts is intentionally preserved — the app falls back to it
 * when NEXT_PUBLIC_API_URL is not set or the backend is unreachable.
 *
 * Authentication flow
 * -------------------
 * 1. POST /auth/login  → { access_token, user: { id, role } }
 * 2. saveToken(access_token) into sessionStorage
 * 3. GET  /auth/me     → { id, role, display_name, location_id, location_name }
 * 4. Derive AppUser from MeResponse for the application
 *
 * Session restoration (page refresh)
 * -----------------------------------
 * loadToken() → if present → GET /auth/me → restore session
 * If token is missing, expired, or invalid → 401 → clear token → show login
 *
 * Logout
 * ------
 * POST /auth/logout (stateless acknowledgement) → clearToken()
 */

import { apiClient, saveToken, loadToken, clearToken, ApiError, ApiNetworkError } from './api-client'

// ─── Backend response types ───────────────────────────────────────────────────

/** Shape of POST /auth/login response. */
interface LoginApiResponse {
  access_token: string
  token_type: 'Bearer'
  expires_in: string
  user: { id: number; role: string }
}

/** Shape of GET /auth/me response (added in Phase 2A). */
interface MeApiResponse {
  id: number
  role: string
  display_name: string
  username: string
  email: string
  location_id: number | null
  location_name: string | null
}

// ─── Application user type ───────────────────────────────────────────────────

/**
 * The user object the application works with.
 * Mirrors the shape used throughout app/page.tsx so the rest of the app
 * needs no changes.
 */
export type AppRole = 'SUPER_ADMIN' | 'ADMIN'

export interface AppUser {
  /** Numeric DB id — needed for authenticated API calls. */
  id: number
  /** Display name (first_name + last_name). */
  name: string
  /** Application role (uppercase). */
  role: AppRole
  /**
   * Location name for Admins; 'Global' for Super Admins.
   * Used for display and scope-filtering in the existing UI.
   */
  location: string
  /** Location numeric id for Admins; null for Super Admins. */
  location_id: number | null
}

// ─── Role normalisation ───────────────────────────────────────────────────────

/**
 * Backend role values are lowercase ('super_admin', 'admin').
 * Frontend uses uppercase ('SUPER_ADMIN', 'ADMIN').
 */
function toAppRole(backendRole: string): AppRole {
  if (backendRole === 'super_admin') return 'SUPER_ADMIN'
  if (backendRole === 'admin') return 'ADMIN'
  throw new Error(`Unknown backend role: ${backendRole}`)
}

function meToAppUser(me: MeApiResponse): AppUser {
  return {
    id: me.id,
    name: me.display_name,
    role: toAppRole(me.role),
    location: me.location_name ?? 'Global',
    location_id: me.location_id,
  }
}

// ─── Auth operations ──────────────────────────────────────────────────────────

export type AuthResult =
  | { ok: true; user: AppUser }
  | { ok: false; error: string; isNetwork?: boolean }

/**
 * Authenticates with the real backend.
 * On success: stores JWT in sessionStorage, fetches profile, returns AppUser.
 * On failure: returns a user-facing error string; never throws.
 */
export async function realLogin(email: string, password: string): Promise<AuthResult> {
  try {
    const loginData = await apiClient.post<LoginApiResponse>('auth/login', { email, password })
    saveToken(loginData.access_token)

    // Fetch profile immediately — needed for display name and location.
    const me = await apiClient.getAuth<MeApiResponse>('auth/me')
    return { ok: true, user: meToAppUser(me) }
  } catch (error) {
    if (error instanceof ApiNetworkError) {
      return {
        ok: false,
        error: 'Cannot reach the server. Check your connection or try again shortly.',
        isNetwork: true,
      }
    }
    if (error instanceof ApiError) {
      if (error.isUnauthorized) {
        return { ok: false, error: 'Invalid email or password.' }
      }
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'An unexpected error occurred. Please try again.' }
  }
}

/**
 * Attempts to restore a session from sessionStorage.
 * Returns AppUser if the stored token is still valid; null otherwise.
 * Called on application mount (page refresh).
 */
export async function restoreSession(): Promise<AppUser | null> {
  const token = loadToken()
  if (!token) return null

  try {
    const me = await apiClient.getAuth<MeApiResponse>('auth/me')
    return meToAppUser(me)
  } catch {
    // Expired, malformed, or invalid token — clear it silently.
    clearToken()
    return null
  }
}

/**
 * Logs the user out.
 * Clears the stored token. POSTs to /auth/logout as a stateless courtesy;
 * the backend simply acknowledges (no server-side session to invalidate).
 * Never throws — logout should always succeed from the user's perspective.
 */
export async function realLogout(): Promise<void> {
  clearToken()
  try {
    await apiClient.post('auth/logout')
  } catch {
    // Logout is best-effort; the token is already cleared locally.
  }
}

/**
 * Returns true if NEXT_PUBLIC_API_URL is configured and appears non-empty.
 * Used to decide whether to use real auth vs mock auth.
 */
export function isApiConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_API_URL
  return typeof url === 'string' && url.trim().length > 0
}
