import type {AuthUser} from '../auth/session'
import {apiJson} from './client'

export interface CreateAdminInput {
  email: string
  password: string
}

export interface CreateAdminResult {
  id: string
}

export interface AdminUser extends AuthUser {
  created_at: string
  updated_at: string
}

export function getUsers() {
  return apiJson<AdminUser[]>('/api/v1/users')
}

export function createAdmin(input: CreateAdminInput) {
  return apiJson<CreateAdminResult>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteUser(id: string) {
  return apiJson<void>(`/api/v1/users/${id}`, {method: 'DELETE'})
}
