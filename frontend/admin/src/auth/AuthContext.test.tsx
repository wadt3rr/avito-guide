// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {AuthProvider} from './AuthProvider'
import {useAuth} from './auth-context'
import {saveSession} from './session'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function AuthProbe() {
  const {login, status, user} = useAuth()
  return (
    <>
      <p>{status}:{user?.email ?? 'guest'}</p>
      <button onClick={() => void login('new@example.com', 'password123')}>Login new user</button>
    </>
  )
}

describe('AuthProvider', () => {
  it('restores a persisted session through auth/me and refreshes the user', async () => {
    saveSession({
      token: 'jwt-token',
      user: {id: 'dev:admin@example.com', email: 'admin@example.com', role: 'admin'},
    })
    const currentUser = {id: 'user-id', email: 'admin@example.com', role: 'superadmin'}
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(currentUser), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    }))
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><AuthProbe/></AuthProvider>)

    await waitFor(() => expect(screen.getByText('authenticated:admin@example.com')).toBeTruthy())
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({Authorization: 'Bearer jwt-token'}),
      }),
    )
    expect(JSON.parse(localStorage.getItem('avito-admin:auth') ?? '{}')).toEqual({
      token: 'jwt-token',
      user: currentUser,
    })
  })

  it('clears the user when auth/me rejects the stored token', async () => {
    saveSession({
      token: 'jwt-token',
      user: {id: 'user-id', email: 'admin@example.com', role: 'admin'},
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unauthorized', {status: 401})))

    render(<AuthProvider><AuthProbe/></AuthProvider>)
    await waitFor(() => expect(screen.getByText('anonymous:guest')).toBeTruthy())
    expect(localStorage.getItem('avito-admin:auth')).toBeNull()
  })

  it('clears the stored session when auth/me fails with a transient server error', async () => {
    const savedSession = {
      token: 'jwt-token',
      user: {id: 'user-id', email: 'admin@example.com', role: 'admin' as const},
    }
    saveSession(savedSession)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('failed', {status: 503})))

    render(<AuthProvider><AuthProbe/></AuthProvider>)

    await waitFor(() => expect(screen.getByText('anonymous:guest')).toBeTruthy())
    expect(localStorage.getItem('avito-admin:auth')).toBeNull()
  })

  it('does not let a late auth/me response overwrite a newer login', async () => {
    saveSession({
      token: 'old-token',
      user: {id: 'old-id', email: 'old@example.com', role: 'admin'},
    })
    let resolveOldValidation!: (response: Response) => void
    const oldValidation = new Promise<Response>((resolve) => {
      resolveOldValidation = resolve
    })
    const newUser = {id: 'new-id', email: 'new@example.com', role: 'admin'}
    const fetchMock = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const authorization = new Headers(init?.headers).get('Authorization')
      if (String(url).endsWith('/api/v1/auth/login')) {
        return Promise.resolve(new Response(JSON.stringify({token: 'new-token'}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        }))
      }
      if (authorization === 'Bearer new-token') {
        return Promise.resolve(new Response(JSON.stringify(newUser), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        }))
      }
      return oldValidation
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><AuthProbe/></AuthProvider>)
    fireEvent.click(screen.getByRole('button', {name: 'Login new user'}))
    await waitFor(() => expect(screen.getByText('authenticated:new@example.com')).toBeTruthy())

    resolveOldValidation(new Response(JSON.stringify({
      id: 'old-id', email: 'old@example.com', role: 'admin',
    }), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3))
    expect(screen.getByText('authenticated:new@example.com')).toBeTruthy()
    expect(JSON.parse(localStorage.getItem('avito-admin:auth') ?? '{}')).toEqual({
      token: 'new-token',
      user: newUser,
    })
  })
})
