// @vitest-environment jsdom

import {cleanup, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {ScenarioDetailsForm} from './ScenarioDetailsForm'

afterEach(cleanup)

describe('ScenarioDetailsForm limits', () => {
  it('stops text at the database column limits', () => {
    render(
      <ScenarioDetailsForm
        description=""
        onChange={vi.fn()}
        path=""
        title=""
      />,
    )

    expect(screen.getByLabelText('Название сценария').getAttribute('maxlength')).toBe('100')
    expect(screen.getByLabelText('Описание').getAttribute('maxlength')).toBe('250')
  })
})
