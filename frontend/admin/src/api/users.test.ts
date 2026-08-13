import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest'
import {saveSession} from '../auth/session'
import type {CreateAdminInput} from './users'

interface AdminUser {
  id: string
  email: string
  role: 'admin' | 'superadmin'
  created_at: string
  updated_at: string
}

interface CreateAdminResult {
  id: string
}

interface UsersApi {
  createAdmin: (input: CreateAdminInput) => Promise<CreateAdminResult>
  deleteUser: (id: string) => Promise<void>
  getUsers: () => Promise<AdminUser[]>
}

beforeEach(() => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  })
  saveSession({
    token: 'jwt-token',
    user: {id: 'super-id', email: 'super@example.com', role: 'superadmin'},
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function loadUsersApi() {
  return await import('./users') as unknown as UsersApi
}

describe('users API boundary', () => {
  it('loads the complete user list from the protected backend route', async () => {
    const users: AdminUser[] = [{
      id: 'admin-id',
      email: 'admin@example.com',
      role: 'admin',
      created_at: '2026-08-12T09:00:00Z',
      updated_at: '2026-08-13T10:00:00Z',
    }]
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(users), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    }))
    vi.stubGlobal('fetch', fetchMock)
    const usersApi = await loadUsersApi()

    expect(usersApi.getUsers).toBeTypeOf('function')
    await expect(usersApi.getUsers()).resolves.toEqual(users)
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/users',
      expect.objectContaining({
        headers: expect.objectContaining({Authorization: 'Bearer jwt-token'}),
      }),
    )
  })

  it('creates an ordinary admin through the backend registration route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({id: 'new-admin-id'}), {
      status: 201,
      headers: {'Content-Type': 'application/json'},
    }))
    vi.stubGlobal('fetch', fetchMock)
    const usersApi = await loadUsersApi()

    await expect(usersApi.createAdmin({
      email: 'new@example.com',
      password: 'password123',
    })).resolves.toEqual({id: 'new-admin-id'})
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/auth/register',
      expect.objectContaining({
        body: JSON.stringify({email: 'new@example.com', password: 'password123'}),
        method: 'POST',
      }),
    )
  })

  it('deletes a user through the protected backend route', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, {status: 204}))
    vi.stubGlobal('fetch', fetchMock)
    const usersApi = await loadUsersApi()

    expect(usersApi.deleteUser).toBeTypeOf('function')
    await expect(usersApi.deleteUser('admin-id')).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/users/admin-id',
      expect.objectContaining({method: 'DELETE'}),
    )
  })
})
