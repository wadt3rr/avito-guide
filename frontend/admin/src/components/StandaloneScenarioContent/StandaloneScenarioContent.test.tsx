// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {StandaloneScenarioContent} from './StandaloneScenarioContent'

afterEach(cleanup)

describe('StandaloneScenarioContent', () => {
  it('edits the one banner content block without exposing tooltip settings', () => {
    const onChange = vi.fn()
    render(
      <StandaloneScenarioContent
        onChange={onChange}
        step={{id: 'one', title: 'Заголовок', text: 'Текст', target: '', timeout: '0'}}
        type="banner"
      />,
    )

    fireEvent.change(screen.getByLabelText('Заголовок баннера'), {
      target: {value: 'Новый заголовок'},
    })

    expect(onChange).toHaveBeenCalledWith({
      id: 'one',
      title: 'Новый заголовок',
      text: 'Текст',
      target: '',
      timeout: '0',
    })
    expect(screen.queryByText(/целевой элемент/i)).toBeNull()
    expect(screen.getByLabelText('Заголовок баннера').getAttribute('maxlength')).toBe('100')
    expect(screen.getByLabelText('Текст сообщения').getAttribute('maxlength')).toBe('50')
  })
})
