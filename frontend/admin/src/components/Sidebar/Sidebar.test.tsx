// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {AuthProvider} from '../../auth/AuthProvider'
import {saveSession, type UserRole} from '../../auth/session'
import {Sidebar} from './Sidebar'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function renderSidebar(role: UserRole) {
  const user = {id: 'user-id', email: `${role}@example.com`, role}
  saveSession({token: 'jwt-token', user})
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(user), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  })))
  render(
    <AuthProvider>
      <MemoryRouter><Sidebar/></MemoryRouter>
    </AuthProvider>,
  )
}

describe('Sidebar access controls', () => {
  it('shows Users only to a superadmin', async () => {
    renderSidebar('superadmin')

    await waitFor(() => expect(screen.getByRole('link', {name: 'Пользователи'})).toBeTruthy())
  })

  it('does not render Users for an ordinary admin', async () => {
    renderSidebar('admin')

    await waitFor(() => expect(screen.getByText('admin@example.com')).toBeTruthy())
    expect(screen.queryByRole('link', {name: 'Пользователи'})).toBeNull()
  })

  it('clears the saved session on logout', async () => {
    renderSidebar('admin')
    const button = await screen.findByRole('button', {name: 'Выйти'})

    fireEvent.click(button)

    expect(localStorage.getItem('avito-admin:auth')).toBeNull()
  })
})
