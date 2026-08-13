import type {AuthSession, AuthUser} from '../auth/session'
import {createDevSession, isDevAuthEnabled} from '../auth/dev-auth'
import {apiJson} from './client'

export function authenticate(email: string, password: string) {
  if (isDevAuthEnabled) return Promise.resolve(createDevSession(email))

  return apiJson<AuthSession>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({email, password}),
  })
}

export function getCurrentUser() {
  return apiJson<AuthUser>('/api/v1/auth/me')
}
