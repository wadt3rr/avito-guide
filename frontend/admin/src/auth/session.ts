export type UserRole = 'admin' | 'superadmin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface AuthSession {
  token: string
  user: AuthUser
}

const sessionKey = 'avito-admin:auth'

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AuthSession>
  const user = candidate.user as Partial<AuthUser> | undefined
  return typeof candidate.token === 'string'
    && candidate.token.length > 0
    && typeof user?.id === 'string'
    && typeof user.email === 'string'
    && (user.role === 'admin' || user.role === 'superadmin')
}

export function readSession(): AuthSession | null {
  const raw = localStorage.getItem(sessionKey)
  if (!raw) return null

  try {
    const value: unknown = JSON.parse(raw)
    if (isAuthSession(value)) return value
  } catch {
    // Invalid browser data is treated as an expired session.
  }

  localStorage.removeItem(sessionKey)
  return null
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(sessionKey, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(sessionKey)
}
