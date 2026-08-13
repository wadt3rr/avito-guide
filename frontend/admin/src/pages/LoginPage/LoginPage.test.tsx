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
  it('blocks a second login while a stored session is being validated', () => {
    localStorage.setItem('avito-admin:auth', JSON.stringify({
      token: 'old-token',
      user: {id: 'old-id', email: 'old@example.com', role: 'admin'},
    }))
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => undefined)))

    renderLogin()

    expect(screen.getByRole('button', {name: 'Входим…'})).toHaveProperty('disabled', true)
  })

  it('logs in through the backend and loads the current user with the returned token', async () => {
    const user = {id: 'super-id', email: 'superadmin@example.com', role: 'superadmin'}
    const fetchMock = vi.fn((url: string | URL | Request) => {
      if (String(url).endsWith('/api/v1/auth/login')) {
        return Promise.resolve(new Response(JSON.stringify({token: 'jwt-token'}), {
          status: 200,
          headers: {'Content-Type': 'application/json'},
        }))
      }
      return Promise.resolve(new Response(JSON.stringify(user), {
        status: 200,
        headers: {'Content-Type': 'application/json'},
      }))
    })
    vi.stubGlobal('fetch', fetchMock)
    renderLogin('/scenarios')

    fireEvent.change(screen.getByLabelText('Email'), {target: {value: ' superadmin@example.com '}})
    fireEvent.change(screen.getByLabelText('Пароль'), {target: {value: 'password123'}})
    fireEvent.click(screen.getByRole('button', {name: 'Войти'}))

    await waitFor(() => expect(screen.getByRole('heading', {name: 'Сценарии'})).toBeTruthy())
    expect(JSON.parse(localStorage.getItem('avito-admin:auth') ?? '{}')).toEqual({
      token: 'jwt-token',
      user,
    })
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://localhost:8081/api/v1/auth/login',
      expect.objectContaining({
        body: JSON.stringify({email: 'superadmin@example.com', password: 'password123'}),
        method: 'POST',
      }),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:8081/api/v1/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({Authorization: 'Bearer jwt-token'}),
      }),
    )
  })

  it('shows invalid credentials returned by the backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('invalid credentials', {status: 401}))
    vi.stubGlobal('fetch', fetchMock)
    renderLogin()

    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'admin@example.com'}})
    fireEvent.change(screen.getByLabelText('Пароль'), {target: {value: 'wrong-password'}})
    fireEvent.click(screen.getByRole('button', {name: 'Войти'}))

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Неверный email или пароль'))
    expect(localStorage.getItem('avito-admin:auth')).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
