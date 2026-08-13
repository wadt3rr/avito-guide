// @vitest-environment jsdom

import {cleanup, render, screen, waitFor} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'

vi.hoisted(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as typeof ResizeObserver
})

import {appRoutes} from './App'
import {AuthProvider} from './auth/AuthProvider'
import {saveSession, type UserRole} from './auth/session'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function renderApp(path: string, role?: UserRole) {
  if (role) {
    const user = {id: 'user-id', email: `${role}@example.com`, role}
    saveSession({token: 'jwt-token', user})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(user), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    })))
  }
  const router = createMemoryRouter(appRoutes, {initialEntries: [path]})
  return render(<AuthProvider><RouterProvider router={router}/></AuthProvider>)
}

describe('admin application routes', () => {
  it('redirects an unauthenticated route attempt to login', async () => {
    renderApp('/analytics')

    await waitFor(() => expect(screen.getByRole('heading', {name: 'Войти'})).toBeTruthy())
  })

  it('blocks an ordinary admin from the Users page', async () => {
    renderApp('/users', 'admin')

    await waitFor(() => expect(screen.getByRole('heading', {name: 'Нет доступа'})).toBeTruthy())
  })

  it('renders the Users page for a superadmin', async () => {
    renderApp('/users', 'superadmin')

    await waitFor(() => expect(screen.getByRole('heading', {name: 'Пользователи'})).toBeTruthy())
  })
})
