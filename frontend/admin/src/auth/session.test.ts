// @vitest-environment jsdom

import {afterEach, describe, expect, it} from 'vitest'
import {clearSession, readSession, saveSession} from './session'

afterEach(() => localStorage.clear())

describe('auth session storage', () => {
  it('persists only the token and safe user fields', () => {
    saveSession({
      token: 'jwt-token',
      user: {id: 'user-id', email: 'admin@example.com', role: 'admin'},
    })

    expect(readSession()).toEqual({
      token: 'jwt-token',
      user: {id: 'user-id', email: 'admin@example.com', role: 'admin'},
    })
    expect(localStorage.getItem('avito-admin:auth')).not.toContain('password')
  })

  it('removes malformed stored data instead of trusting it', () => {
    localStorage.setItem('avito-admin:auth', '{broken')

    expect(readSession()).toBeNull()
    expect(localStorage.getItem('avito-admin:auth')).toBeNull()
  })

  it('clears the persisted session', () => {
    saveSession({
      token: 'jwt-token',
      user: {id: 'user-id', email: 'admin@example.com', role: 'admin'},
    })

    clearSession()

    expect(readSession()).toBeNull()
  })
})
