// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {createMemoryRouter, RouterProvider} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {ScenarioEditorPage} from './ScenarioEditorPage'

vi.mock('../../components/WidgetPreview/WidgetPreview', () => ({
  WidgetPreview: () => null,
}))

vi.mock('../../components/ScenarioSteps/ScenarioSteps', () => ({
  ScenarioSteps: () => null,
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

function renderEditor(initialPath = '/scenarios/new') {
  const router = createMemoryRouter([
    {path: '/scenarios/new', element: <ScenarioEditorPage/>},
    {path: '/scenarios/:scenarioId', element: <ScenarioEditorPage/>},
    {path: '/scenarios', element: <h1>Список сценариев</h1>},
  ], {initialEntries: [initialPath]})

  render(<RouterProvider router={router}/>)
  return router
}

describe('ScenarioEditorPage safety', () => {
  it('keeps the editor open when the user rejects losing unsaved changes', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderEditor()
    fireEvent.change(screen.getByLabelText('Название сценария'), {
      target: {value: 'Несохранённый сценарий'},
    })

    fireEvent.click(screen.getByRole('button', {name: 'Все сценарии'}))

    expect(confirm).toHaveBeenCalledOnce()
    expect(await screen.findByRole('heading', {name: 'Несохранённый сценарий'})).toBeTruthy()
    expect(screen.queryByRole('heading', {name: 'Список сценариев'})).toBeNull()
  })

  it('warns the browser before closing a dirty editor', () => {
    renderEditor()
    fireEvent.change(screen.getByLabelText('Название сценария'), {
      target: {value: 'Несохранённый сценарий'},
    })
    const event = new Event('beforeunload', {cancelable: true})

    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('shows an invalid-link error without calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderEditor('/scenarios/not-a-uuid')

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Некорректная ссылка на сценарий.',
    )
    expect(screen.queryByRole('button', {name: 'Повторить'})).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
