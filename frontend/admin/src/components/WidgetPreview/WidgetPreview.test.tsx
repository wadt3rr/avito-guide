// @vitest-environment jsdom

import {cleanup, render, screen, waitFor} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import type {IScenario} from '../../data/scenarios'
import {WidgetPreview} from './WidgetPreview'

afterEach(cleanup)

const scenario: IScenario = {
  id: '',
  type: 'modal',
  title: 'Черновик',
  description: '',
  path: '/my',
  status: 'draft',
  steps: [{
    id: 'content',
    title: 'Привет',
    text: 'Текст модального окна',
    target: '',
    timeout: '0',
  }],
}

describe('WidgetPreview', () => {
  it('shows a concise message when the widget is unavailable', async () => {
    render(<WidgetPreview scenario={scenario}/>)
    const frame = screen.getByTitle('Предпросмотр виджета') as HTMLIFrameElement

    window.dispatchEvent(new MessageEvent('message', {
      data: {type: 'avito-widget-preview-error'},
      origin: window.location.origin,
      source: frame.contentWindow,
    }))

    expect(await screen.findByText('Виджет недоступен')).toBeTruthy()
    expect(screen.queryByText(/8082/)).toBeNull()
  })

  it('sends the current draft to the real widget after the frame is ready', async () => {
    render(<WidgetPreview scenario={scenario}/>)
    const frame = screen.getByTitle('Предпросмотр виджета') as HTMLIFrameElement
    const postMessage = vi.spyOn(frame.contentWindow!, 'postMessage')

    window.dispatchEvent(new MessageEvent('message', {
      data: {type: 'avito-widget-preview-ready'},
      origin: window.location.origin,
      source: frame.contentWindow,
    }))

    await waitFor(() => expect(postMessage).toHaveBeenCalledWith(
      {
        type: 'avito-widget-preview-render',
        scenario: expect.objectContaining({
          type: 'modal',
          steps: [expect.objectContaining({title: 'Привет'})],
        }),
      },
      window.location.origin,
    ))
  })
})
