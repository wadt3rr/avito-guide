// @vitest-environment jsdom

import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {StepEditorDrawer} from './StepEditorDrawer'

afterEach(cleanup)

describe('StepEditorDrawer limits', () => {
  it('uses the database limits for step title and content', () => {
    render(
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
    expect(screen.getByLabelText('Текст').getAttribute('maxlength')).toBe('50')
  })
})
