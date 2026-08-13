import type {AuthSession, AuthUser} from './session'

// FRONTEND_AUTH_STUB: remove this module and its call sites when real auth is connected.
export const DEV_SUPERADMIN_EMAIL = 'superadmin@test.local'
export const isDevAuthEnabled = import.meta.env.DEV

export function createDevSession(email: string): AuthSession {
  const normalizedEmail = email.trim().toLowerCase()
  const role = normalizedEmail === DEV_SUPERADMIN_EMAIL ? 'superadmin' : 'admin'

  return {
    token: 'dev-local-session',
    user: {
      id: `dev:${normalizedEmail}`,
      email: normalizedEmail,
      role,
    },
  }
}

export function createDevAdmin(email: string): AuthUser {
  const normalizedEmail = email.trim().toLowerCase()
  return {
    id: `dev:${normalizedEmail}`,
    email: normalizedEmail,
    role: 'admin',
  }
}
