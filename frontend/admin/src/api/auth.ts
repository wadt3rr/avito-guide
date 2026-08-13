import type {AuthUser} from '../auth/session'
import {apiJson} from './client'

interface AuthTokenResponse {
  token: string
}

export function authenticate(email: string, password: string) {
  return apiJson<AuthTokenResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({email, password}),
  })
}

export function getCurrentUser(token?: string) {
  return apiJson<AuthUser>('/api/v1/auth/me', token ? {
    headers: {Authorization: `Bearer ${token}`},
  } : undefined)
}
