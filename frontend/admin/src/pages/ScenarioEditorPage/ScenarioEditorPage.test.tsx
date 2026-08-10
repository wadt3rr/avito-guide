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
  it('deletes an existing scenario after explicit confirmation', async () => {
    const scenarioId = '123e4567-e89b-42d3-a456-426614174000'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: scenarioId,
        type: 'banner',
        title: 'Важное сообщение',
        description: '',
        status: 'draft',
        published_at: null,
        url_pattern: '/my',
        match_context: {},
        priority: 0,
        steps: [{
          id: '223e4567-e89b-42d3-a456-426614174000',
          scenario_id: scenarioId,
          step_order: 1,
          title: 'Сообщение',
          content: 'Проверьте объявление',
          selector: '',
          action_type: 'next',
          condition: 'always',
          timeout_sec: 0,
        }],
        created_at: '2026-08-10T10:00:00Z',
        updated_at: '2026-08-10T10:00:00Z',
      }), {headers: {'Content-Type': 'application/json'}}))
      .mockResolvedValueOnce(new Response(null, {status: 204}))
    vi.stubGlobal('fetch', fetchMock)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderEditor(`/scenarios/${scenarioId}`)

    fireEvent.click(await screen.findByRole('button', {name: 'Удалить сценарий'}))

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('безвозвратно'))
    expect(await screen.findByRole('heading', {name: 'Список сценариев'})).toBeTruthy()
    expect(fetchMock).toHaveBeenLastCalledWith(
      `http://localhost:8081/api/v1/scenarios/${scenarioId}`,
      expect.objectContaining({method: 'DELETE'}),
    )
  })

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
