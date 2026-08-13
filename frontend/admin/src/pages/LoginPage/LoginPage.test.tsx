// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {AuthProvider} from '../../auth/AuthProvider'
import {LoginPage} from './LoginPage'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function renderLogin(from = '/scenarios') {
  const router = createMemoryRouter([
    {path: '/login', element: <LoginPage/>},
    {path: '/scenarios', element: <h1>Сценарии</h1>},
  ], {initialEntries: [{pathname: '/login', state: {from}}]})

  return render(<AuthProvider><RouterProvider router={router}/></AuthProvider>)
}

describe('LoginPage', () => {
  it('logs the development superadmin in locally without a backend', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network must not be used'))
    vi.stubGlobal('fetch', fetchMock)
    renderLogin('/scenarios')

    fireEvent.change(screen.getByLabelText('Email'), {target: {value: ' SUPERADMIN@test.local '}})
    fireEvent.change(screen.getByLabelText('Пароль'), {target: {value: 'password123'}})
    fireEvent.click(screen.getByRole('button', {name: 'Войти'}))

    await waitFor(() => expect(screen.getByRole('heading', {name: 'Сценарии'})).toBeTruthy())
    expect(JSON.parse(localStorage.getItem('avito-admin:auth') ?? '{}')).toEqual({
      token: 'dev-local-session',
      user: {
        id: 'dev:superadmin@test.local',
        email: 'superadmin@test.local',
        role: 'superadmin',
      },
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('logs every other development email in as an ordinary admin', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('network must not be used'))
    vi.stubGlobal('fetch', fetchMock)
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'admin@example.com'}})
    fireEvent.change(screen.getByLabelText('Пароль'), {target: {value: 'anything'}})
    fireEvent.click(screen.getByRole('button', {name: 'Войти'}))

    await waitFor(() => expect(screen.getByRole('heading', {name: 'Сценарии'})).toBeTruthy())
    expect(JSON.parse(localStorage.getItem('avito-admin:auth') ?? '{}').user.role).toBe('admin')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
