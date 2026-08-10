// @vitest-environment jsdom

import {cleanup, render, screen} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it} from 'vitest'
import {ScenariosCard} from './ScenariosCard'

afterEach(cleanup)

describe('ScenariosCard', () => {
  it('opens the editor from one full-card link without action buttons', () => {
    render(
      <MemoryRouter>
        <ScenariosCard
          id="scenario-id"
          path="/orders"
          status="published"
          steps={3}
          title="Передача заказа"
        />
      </MemoryRouter>,
    )

    const link = screen.getByRole('link', {name: /Передача заказа/})
    expect(link.getAttribute('href')).toBe('/scenarios/scenario-id')
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
