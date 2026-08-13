import {clearSession, readSession} from '../auth/session'

export const AUTH_UNAUTHORIZED_EVENT = 'avito-auth:unauthorized'

const apiOrigin = (import.meta.env.VITE_API_URL ?? 'http://localhost:8081').replace(/\/$/, '')

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = readSession()
  const explicitAuthorization = new Headers(init.headers).get('Authorization')
  const requestToken = explicitAuthorization?.startsWith('Bearer ')
    ? explicitAuthorization.slice('Bearer '.length)
    : session?.token
  const response = await fetch(path.startsWith('http') ? path : `${apiOrigin}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init.body ? {'Content-Type': 'application/json'} : {}),
      ...(session ? {Authorization: `Bearer ${session.token}`} : {}),
      ...init.headers,
    },
  })

  if (response.status === 401) {
    const currentSession = readSession()
    if (requestToken && currentSession?.token === requestToken) {
      clearSession()
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))
    }
  }

  return response
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init)
  if (!response.ok) {
    const message = (await response.text()).trim() || `API вернуло ошибку ${response.status}`
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
