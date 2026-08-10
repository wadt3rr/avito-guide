// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen} from '@testing-library/react'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {ScenarioTypeSelector} from './ScenarioTypeSelector'

afterEach(cleanup)

describe('ScenarioTypeSelector', () => {
  it('lets a new scenario choose another type', () => {
    const onChange = vi.fn()
    render(<ScenarioTypeSelector disabled={false} onChange={onChange} value="tooltip"/>)

    fireEvent.click(screen.getByRole('radio', {name: 'Модальное окно'}))

    expect(onChange).toHaveBeenCalledWith('modal')
  })

  it('shows but locks the type of a saved scenario', () => {
    render(<ScenarioTypeSelector disabled onChange={vi.fn()} value="banner"/>)

    expect((screen.getByRole('radio', {name: 'Баннер'}) as HTMLInputElement).disabled).toBe(true)
    expect(screen.getByText(/нельзя изменить после создания/i)).toBeTruthy()
  })
})
