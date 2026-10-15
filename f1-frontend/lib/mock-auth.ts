export type MockRole = 'SUPER_ADMIN' | 'ADMIN'

export type MockUser = {
  name: string
  role: MockRole
  location: string
}

export type MockSession = {
  user: MockUser
}

export type MockLoginResult =
  | { ok: true; session: MockSession }
  | { ok: false; error: string }

const demoAccounts = [
  { email: 'superadmin@f1helpdesk.com', password: 'password', user: { name: 'Jordan Lee', role: 'SUPER_ADMIN' as const, location: 'Global' } },
  { email: 'admin@f1helpdesk.com', password: 'password', user: { name: 'Olivia Martin', role: 'ADMIN' as const, location: 'Downtown HQ' } },
]

export function validateMockLogin(email: string, password: string): string | null {
  if (!email.trim()) return 'Email address is required.'
  if (!/^\S+@\S+\.\S+$/.test(email)) return 'Enter a valid email address.'
  if (!password) return 'Password is required.'
  return null
}

export async function loginWithMockCredentials(email: string, password: string): Promise<MockLoginResult> {
  await new Promise((resolve) => window.setTimeout(resolve, 450))
  const account = demoAccounts.find((candidate) => candidate.email === email.trim().toLowerCase() && candidate.password === password)
  if (!account) return { ok: false, error: 'Invalid email or password. Try one of the demo accounts below.' }
  return { ok: true, session: { user: account.user } }
}

export const mockAccountEmails = demoAccounts.map(({ email }) => email)

// Development-only credentials. This service is not production authentication.
export const mockAccountPassword = 'password'
