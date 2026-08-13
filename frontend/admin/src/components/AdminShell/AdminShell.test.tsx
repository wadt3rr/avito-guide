// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {AuthProvider} from '../../auth/AuthProvider'
import {saveSession} from '../../auth/session'
import {AdminShell} from './AdminShell'

afterEach(() => {
  cleanup()
  document.body.style.overflow = ''
  localStorage.clear()
  vi.unstubAllGlobals()
})

function renderShell(initialPath = '/scenarios') {
  const user = {id: 'user-id', email: 'admin@example.com', role: 'admin' as const}
  saveSession({token: 'jwt-token', user})
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(user), {
    status: 200,
    headers: {'Content-Type': 'application/json'},
  })))
  const router = createMemoryRouter([
    {
      element: <AdminShell/>,
      children: [
        {path: '/analytics', element: <h1>Аналитика страницы</h1>},
        {path: '/scenarios', element: <h1>Сценарии страницы</h1>},
      ],
    },
  ], {initialEntries: [initialPath]})

  return {
    router,
    ...render(<AuthProvider><RouterProvider router={router}/></AuthProvider>),
  }
}

describe('AdminShell mobile navigation', () => {
  it('does not mount the backdrop while the drawer is closed', () => {
    const {container} = renderShell()

    expect(container.querySelector('[aria-label="Закрыть меню"]')).toBeNull()
  })

  it('opens the drawer from the menu button and moves focus into navigation', () => {
    renderShell()
    const menuButton = screen.getByRole('button', {name: 'Открыть меню'})

    fireEvent.click(menuButton)

    expect(menuButton.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('complementary').classList.contains('sidebar--mobile-open')).toBe(true)
    expect(document.body.style.overflow).toBe('hidden')
    expect(document.activeElement).toBe(screen.getByRole('link', {name: 'Аналитика'}))
  })

  it('closes from the backdrop and restores focus to the menu button', () => {
    renderShell()
    const menuButton = screen.getByRole('button', {name: 'Открыть меню'})
    fireEvent.click(menuButton)

    fireEvent.click(screen.getByRole('button', {name: 'Закрыть меню'}))

    expect(menuButton.getAttribute('aria-expanded')).toBe('false')
    expect(document.body.style.overflow).toBe('')
    expect(document.activeElement).toBe(menuButton)
  })

  it('closes from Escape', () => {
    renderShell()
    const menuButton = screen.getByRole('button', {name: 'Открыть меню'})
    fireEvent.click(menuButton)

    fireEvent.keyDown(document, {key: 'Escape'})

    expect(menuButton.getAttribute('aria-expanded')).toBe('false')
  })

  it('closes after navigating to another section', () => {
    renderShell('/analytics')
    const menuButton = screen.getByRole('button', {name: 'Открыть меню'})
    fireEvent.click(menuButton)

    fireEvent.click(screen.getByRole('link', {name: 'Сценарии'}))

    expect(screen.getByRole('heading', {name: 'Сценарии страницы'})).toBeTruthy()
    expect(menuButton.getAttribute('aria-expanded')).toBe('false')
  })

  it('opens after a touch swipe from the left edge', () => {
    const {container} = renderShell()
    const shell = container.querySelector('.admin-shell') as HTMLElement

    fireEvent.pointerDown(shell, {clientX: 20, clientY: 100, pointerType: 'touch'})
    fireEvent.pointerUp(shell, {clientX: 90, clientY: 112, pointerType: 'touch'})

    expect(screen.getByRole('button', {name: 'Открыть меню'}).getAttribute('aria-expanded'))
      .toBe('true')
  })
})
