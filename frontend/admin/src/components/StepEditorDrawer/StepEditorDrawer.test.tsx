// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {StepEditorDrawer} from './StepEditorDrawer'

afterEach(cleanup)

describe('StepEditorDrawer limits', () => {
  it('uses the database limits for step title and content', () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const {unmount} = render(
      <StepEditorDrawer
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        scenarioPath="/create"
        step={{
          id: 'step-one',
          title: 'Шаг',
          text: 'Текст',
          target: 'form-title',
          timeout: '5',
        }}
        stepNumber={1}
      />,
    )

    expect(screen.getByLabelText('Название подсказки').getAttribute('maxlength')).toBe('100')
    expect(screen.getByLabelText('Текст').getAttribute('maxlength')).toBe('300')
    const closeButton = screen.getByRole('button', {name: 'Закрыть'})
    const saveButton = screen.getByRole('button', {name: 'Сохранить шаг'})
    expect(document.activeElement).toBe(closeButton)
    saveButton.focus()
    fireEvent.keyDown(saveButton, {key: 'Tab'})
    expect(document.activeElement).toBe(closeButton)

    unmount()
    expect(document.activeElement).toBe(trigger)
  })

  it('shows placeholders without writing them into an empty step', () => {
    render(
      <StepEditorDrawer
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onSave={vi.fn()}
        scenarioPath="/create"
        step={{id: 'empty', title: '', text: '', target: 'form-title', timeout: '5'}}
        stepNumber={1}
      />,
    )

    const title = screen.getByLabelText('Название подсказки') as HTMLInputElement
    const content = screen.getByLabelText('Текст') as HTMLTextAreaElement
    expect(title.value).toBe('')
    expect(title.placeholder).toBe('Заголовок подсказки')
    expect(content.value).toBe('')
    expect(content.placeholder).toBe('Текст подсказки')
  })
})
