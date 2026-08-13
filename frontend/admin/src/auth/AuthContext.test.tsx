// @vitest-environment jsdom

import {cleanup, render, screen, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {AUTH_UNAUTHORIZED_EVENT} from '../api/client'
import {AuthProvider} from './AuthProvider'
import {useAuth} from './auth-context'
import {saveSession} from './session'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function AuthProbe() {
  const {status, user} = useAuth()
  return <p>{status}:{user?.email ?? 'guest'}</p>
}

describe('AuthProvider', () => {
  it('restores a persisted development session without calling auth/me', async () => {
    saveSession({
      token: 'dev-local-session',
      user: {id: 'dev:admin@example.com', email: 'admin@example.com', role: 'admin'},
    })
    const fetchMock = vi.fn().mockRejectedValue(new Error('network must not be used'))
    vi.stubGlobal('fetch', fetchMock)

    render(<AuthProvider><AuthProbe/></AuthProvider>)

    await waitFor(() => expect(screen.getByText('authenticated:admin@example.com')).toBeTruthy())
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('clears the user when the API reports an unauthorized response', async () => {
    saveSession({
      token: 'jwt-token',
      user: {id: 'user-id', email: 'admin@example.com', role: 'admin'},
    })
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network must not be used')))
    render(<AuthProvider><AuthProbe/></AuthProvider>)
    await waitFor(() => expect(screen.getByText('authenticated:admin@example.com')).toBeTruthy())

    window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT))

    await waitFor(() => expect(screen.getByText('anonymous:guest')).toBeTruthy())
    expect(localStorage.getItem('avito-admin:auth')).toBeNull()
  })
})
