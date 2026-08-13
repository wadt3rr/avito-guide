// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {saveSession} from '../../auth/session'
import {UsersPage} from './UsersPage'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

function saveSuperAdmin() {
  saveSession({
    token: 'jwt-token',
    user: {id: 'super-id', email: 'super@example.com', role: 'superadmin'},
  })
}

describe('UsersPage', () => {
  it('simulates creating an ordinary admin locally without a backend', async () => {
    saveSuperAdmin()
    const fetchMock = vi.fn().mockRejectedValue(new Error('network must not be used'))
    vi.stubGlobal('fetch', fetchMock)
    render(<UsersPage/>)

    fireEvent.change(screen.getByLabelText('Email'), {target: {value: 'new@example.com'}})
    fireEvent.change(screen.getByLabelText('Пароль'), {target: {value: 'password123'}})
    fireEvent.click(screen.getByRole('button', {name: 'Создать администратора'}))

    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('new@example.com'))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('')
    expect((screen.getByLabelText('Пароль') as HTMLInputElement).value).toBe('')
  })

})
