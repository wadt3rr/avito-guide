import {describe, expect, it} from 'vitest'
import type {IScenario} from './scenarios'
import {
  buildPreviewScenario,
  changeScenarioType,
  getStepPlaceholders,
  MAX_SCENARIO_DESCRIPTION_LENGTH,
  MAX_SCENARIO_TITLE_LENGTH,
  MAX_STEP_CONTENT_LENGTH,
  MAX_STEP_TITLE_LENGTH,
  normalizeScenarioForSave,
  normalizeScenarioType,
  validateScenario,
} from './scenarioTypes'

function draft(overrides: Partial<IScenario> = {}): IScenario {
  return {
    id: '',
    type: 'tooltip',
    title: 'Черновик',
    description: '',
    path: '/create',
    status: 'draft',
    steps: [
      {
        id: 'step-one',
        title: 'Первый заголовок',
        text: 'Первый текст',
        target: 'form-title',
        timeout: '5',
      },
      {
        id: 'step-two',
        title: 'Второй заголовок',
        text: 'Второй текст',
        target: 'form-price',
        timeout: '10',
      },
    ],
    ...overrides,
  }
}

describe('scenario type draft rules', () => {
  it('rejects missing and unknown scenario types', () => {
    expect(() => normalizeScenarioType(undefined)).toThrow('Unsupported scenario type')
    expect(() => normalizeScenarioType('carousel')).toThrow('Unsupported scenario type')
    expect(normalizeScenarioType('modal')).toBe('modal')
  })

  it('collapses a new tooltip draft to one standalone content block', () => {
    const modal = changeScenarioType(draft(), 'modal')

    expect(modal.type).toBe('modal')
    expect(modal.steps).toEqual([
      {
        id: 'step-one',
        title: 'Первый заголовок',
        text: 'Первый текст',
        target: '',
        timeout: '0',
      },
    ])
  })

  it('does not change the structure of a saved scenario', () => {
    const saved = draft({id: 'saved-scenario'})

    expect(changeScenarioType(saved, 'banner')).toBe(saved)
  })

  it.each(['modal', 'banner'] as const)(
    'always serializes %s with exactly one standalone step',
    (type) => {
      const normalized = normalizeScenarioForSave(draft({type}))

      expect(normalized.steps).toHaveLength(1)
      expect(normalized.steps[0]?.target).toBe('')
      expect(normalized.steps[0]?.timeout).toBe('0')
    },
  )
})

describe('real widget preview payload', () => {
  it('uses the abstract preview anchor instead of a draft site selector', () => {
    const preview = buildPreviewScenario(draft())

    expect(preview.type).toBe('tooltip')
    expect(preview.steps).toHaveLength(1)
    expect(preview.steps[0]?.selector).toBe('[data-onboarding-id="preview-target"]')
    expect(preview.steps[0]?.title).toBe('Первый заголовок')
  })

  it('sends exactly one selector-free block for a banner', () => {
    const preview = buildPreviewScenario(draft({type: 'banner'}))

    expect(preview.type).toBe('banner')
    expect(preview.steps).toHaveLength(1)
    expect(preview.steps[0]?.selector).toBe('')
    expect(preview.steps[0]?.timeout_sec).toBe(0)
  })

  it.each(['tooltip', 'modal', 'banner'] as const)(
    'uses the visible %s placeholders when draft content is empty',
    (type) => {
      const placeholders = getStepPlaceholders(type)
      const preview = buildPreviewScenario(draft({
        type,
        title: '',
        steps: [{
          id: 'empty-step',
          title: '',
          text: '',
          target: type === 'tooltip' ? 'form-title' : '',
          timeout: type === 'tooltip' ? '5' : '0',
        }],
      }))

      expect(preview.title).toBe('Название сценария')
      expect(preview.steps[0]?.title).toBe(placeholders.title)
      expect(preview.steps[0]?.content).toBe(placeholders.content)
    },
  )
})

describe('scenario validation', () => {
  it('rejects values that exceed the database column limits', () => {
    expect(validateScenario(draft({title: 'T'.repeat(MAX_SCENARIO_TITLE_LENGTH + 1)}), 'save'))
      .toBe('Название сценария не должно превышать 100 символов.')
    expect(validateScenario(
      draft({description: 'D'.repeat(MAX_SCENARIO_DESCRIPTION_LENGTH + 1)}),
      'save',
    )).toBe('Описание не должно превышать 250 символов.')
    expect(validateScenario(draft({
      steps: [{
        ...draft().steps[0]!,
        title: 'S'.repeat(MAX_STEP_TITLE_LENGTH + 1),
      }],
    }), 'save')).toBe('Название шага 1 не должно превышать 100 символов.')
    expect(validateScenario(draft({
      steps: [{
        ...draft().steps[0]!,
        text: 'C'.repeat(MAX_STEP_CONTENT_LENGTH + 1),
      }],
    }), 'save')).toBe('Текст шага 1 не должен превышать 300 символов.')
  })

  it('allows an incomplete draft but blocks publishing it', () => {
    const incomplete = draft({steps: []})

    expect(validateScenario(incomplete, 'save')).toBeNull()
    expect(validateScenario(incomplete, 'publish')).toBe(
      'Добавьте хотя бы один шаг перед публикацией.',
    )
  })

  it('does not allow saving broken content into an already published scenario', () => {
    expect(validateScenario(
      draft({status: 'published', steps: []}),
      'save',
    )).toBe('Добавьте хотя бы один шаг перед публикацией.')
  })

  it('requires complete content and a target before publishing', () => {
    expect(validateScenario(draft({
      steps: [{...draft().steps[0]!, text: ''}],
    }), 'publish')).toBe('Заполните текст шага 1.')
    expect(validateScenario(draft({
      steps: [{...draft().steps[0]!, target: ''}],
    }), 'publish')).toBe('Выберите целевой элемент для шага 1.')
  })
})
