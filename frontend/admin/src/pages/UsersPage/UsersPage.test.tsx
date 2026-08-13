// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {saveSession} from '../../auth/session'
import type {AdminUser} from '../../api/users'
import {UsersPage} from './UsersPage'

const superadmin: AdminUser = {
  id: 'super-id',
  email: 'super@example.com',
  role: 'superadmin',
  created_at: '2026-08-12T09:00:00Z',
  updated_at: '2026-08-13T10:00:00Z',
}

const admin: AdminUser = {
  id: 'admin-id',
  email: 'admin@example.com',
  role: 'admin',
  created_at: '2026-08-11T08:00:00Z',
  updated_at: '2026-08-13T11:00:00Z',
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {'Content-Type': 'application/json'},
  })
}

function saveSuperAdmin() {
  saveSession({
    token: 'jwt-token',
    user: {id: 'super-id', email: 'super@example.com', role: 'superadmin'},
  })
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('UsersPage', () => {
  it('renders backend users as non-clickable rows and protects superadmins from deletion', async () => {
    saveSuperAdmin()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([superadmin, admin])))

    render(<UsersPage/>)

    expect(await screen.findByText('admin@example.com')).toBeTruthy()
    expect(screen.getByText('super@example.com')).toBeTruthy()
    expect(screen.getByText('Администратор')).toBeTruthy()
    expect(screen.getByText('Суперадминистратор')).toBeTruthy()
    expect(screen.getByText('admin-id')).toBeTruthy()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByRole('button', {name: 'Удалить admin@example.com'})).toBeTruthy()
    expect(screen.queryByRole('button', {name: 'Удалить super@example.com'})).toBeNull()
  })

  it('creates an admin in a modal and refetches the server list', async () => {
    saveSuperAdmin()
    let getRequests = 0
    const createdAdmin: AdminUser = {
      ...admin,
      id: 'new-admin-id',
      email: 'new@example.com',
    }
    const fetchMock = vi.fn((url: string | URL | Request, init?: RequestInit) => {
      const path = String(url)
      if (init?.method === 'POST') return Promise.resolve(jsonResponse({id: 'new-admin-id'}, 201))
      if (path.endsWith('/api/v1/users')) {
        getRequests += 1
        return Promise.resolve(jsonResponse(getRequests === 1 ? [superadmin] : [superadmin, createdAdmin]))
      }
      return Promise.resolve(new Response(null, {status: 404}))
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<UsersPage/>)
    await screen.findByText('super@example.com')
    fireEvent.click(screen.getByRole('button', {name: 'Добавить пользователя'}))

    expect(screen.getByRole('dialog', {name: 'Новый администратор'})).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'new@example.com'}})
    fireEvent.change(screen.getByLabelText('Пароль'), {target: {value: 'password123'}})
    fireEvent.click(screen.getByRole('button', {name: 'Создать администратора'}))

    expect(await screen.findByText('new@example.com')).toBeTruthy()
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(getRequests).toBe(2)
  })

  it('cancels deletion without sending a delete request', async () => {
    saveSuperAdmin()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([admin]))
    vi.stubGlobal('fetch', fetchMock)

    render(<UsersPage/>)
    fireEvent.click(await screen.findByRole('button', {name: 'Удалить admin@example.com'}))

    expect(screen.getByRole('dialog', {name: 'Удалить пользователя?'})).toBeTruthy()
    expect(screen.getByText('Вы уверены? Это удалит пользователя и все его сценарии.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', {name: 'Отмена'}))

    expect(screen.queryByRole('dialog', {name: 'Удалить пользователя?'})).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('deletes an admin from the site modal and refetches the server list', async () => {
    saveSuperAdmin()
    let getRequests = 0
    const fetchMock = vi.fn((_url: string | URL | Request, init?: RequestInit) => {
      if (init?.method === 'DELETE') return Promise.resolve(new Response(null, {status: 204}))
      getRequests += 1
      return Promise.resolve(jsonResponse(getRequests === 1 ? [admin] : []))
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<UsersPage/>)
    fireEvent.click(await screen.findByRole('button', {name: 'Удалить admin@example.com'}))
    fireEvent.click(screen.getByRole('button', {name: /^Удалить$/}))

    expect(await screen.findByText('Пользователей пока нет')).toBeTruthy()
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/users/admin-id',
      expect.objectContaining({method: 'DELETE'}),
    )
    expect(getRequests).toBe(2)
  })

  it('recovers from a load error and shows the empty state', async () => {
    saveSuperAdmin()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('failed', {status: 500}))
      .mockResolvedValueOnce(jsonResponse([]))
    vi.stubGlobal('fetch', fetchMock)

    render(<UsersPage/>)

    expect((await screen.findByRole('alert')).textContent).toContain('Не удалось загрузить пользователей')
    fireEvent.click(screen.getByRole('button', {name: 'Повторить'}))
    expect(await screen.findByText('Пользователей пока нет')).toBeTruthy()
  })

  it('keeps the row and reports a delete error', async () => {
    saveSuperAdmin()
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse([admin]))
      .mockResolvedValueOnce(new Response('failed', {status: 500}))
    vi.stubGlobal('fetch', fetchMock)

    render(<UsersPage/>)
    fireEvent.click(await screen.findByRole('button', {name: 'Удалить admin@example.com'}))
    fireEvent.click(screen.getByRole('button', {name: /^Удалить$/}))

    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Не удалось удалить пользователя'))
    expect(screen.getByRole('dialog', {name: 'Удалить пользователя?'})).toBeTruthy()
    expect(screen.getAllByText('admin@example.com')).toHaveLength(2)
  })
})
