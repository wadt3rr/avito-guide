import type {AuthUser} from '../auth/session'
import {createDevAdmin, isDevAuthEnabled} from '../auth/dev-auth'
import {apiJson} from './client'

export interface CreateAdminInput {
  email: string
  password: string
}

export function createAdmin(input: CreateAdminInput) {
  if (isDevAuthEnabled) return Promise.resolve(createDevAdmin(input.email))

  return apiJson<AuthUser>('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
