// @vitest-environment jsdom

import {cleanup, render, screen, waitFor} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {AuthProvider} from './AuthProvider'
import {ProtectedRoute} from './ProtectedRoute'
import {saveSession} from './session'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function renderRoutes(initialPath = '/scenarios') {
  const router = createMemoryRouter([
    {path: '/login', element: <h1>Вход</h1>},
    {
      element: <ProtectedRoute/>,
      children: [{path: '/scenarios', element: <h1>Сценарии</h1>}],
    },
  ], {initialEntries: [initialPath]})
  return render(<AuthProvider><RouterProvider router={router}/></AuthProvider>)
}

describe('ProtectedRoute', () => {
  it('redirects a guest to login', async () => {
    renderRoutes()

    await waitFor(() => expect(screen.getByRole('heading', {name: 'Вход'})).toBeTruthy())
  })

  it('renders a protected page after validating the stored token', async () => {
    saveSession({
      token: 'jwt-token',
      user: {id: 'user-id', email: 'admin@example.com', role: 'admin'},
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'user-id', email: 'admin@example.com', role: 'admin',
    }), {status: 200, headers: {'Content-Type': 'application/json'}})))

    renderRoutes()

    await waitFor(() => expect(screen.getByRole('heading', {name: 'Сценарии'})).toBeTruthy())
  })
})
