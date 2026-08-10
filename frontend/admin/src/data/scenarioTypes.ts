import {createEmptyStep, type IScenario, type IScenarioStep, type ScenarioType} from './scenarios'

export const MAX_SCENARIO_TITLE_LENGTH = 100
export const MAX_SCENARIO_DESCRIPTION_LENGTH = 250
export const MAX_STEP_TITLE_LENGTH = 100
export const MAX_STEP_CONTENT_LENGTH = 50

export type ScenarioValidationIntent = 'publish' | 'save'

export interface IWidgetPreviewStep {
  id: string
  step_order: number
  title: string
  content: string
  selector: string
  action_type: 'next'
  timeout_sec: number
}

export interface IWidgetPreviewScenario {
  id: string
  type: ScenarioType
  title: string
  steps: IWidgetPreviewStep[]
}

export function normalizeScenarioType(value: unknown): ScenarioType {
  return value === 'modal' || value === 'banner' || value === 'tooltip'
    ? value
    : 'tooltip'
}

function toStandaloneStep(step: IScenarioStep): IScenarioStep {
  return {
    ...step,
    target: '',
    timeout: '0',
  }
}

function toTooltipStep(step: IScenarioStep): IScenarioStep {
  return {
    ...step,
    target: step.target || 'form-title',
    timeout: step.timeout === '0' ? '5' : step.timeout,
  }
}

function firstStep(scenario: IScenario): IScenarioStep {
  return scenario.steps[0] ?? createEmptyStep(0)
}

export function changeScenarioType(
  scenario: IScenario,
  type: ScenarioType,
): IScenario {
  if (scenario.id || scenario.type === type) return scenario

  return {
    ...scenario,
    type,
    steps: [
      type === 'tooltip'
        ? toTooltipStep(firstStep(scenario))
        : toStandaloneStep(firstStep(scenario)),
    ],
  }
}

export function normalizeScenarioForSave(scenario: IScenario): IScenario {
  const type = normalizeScenarioType(scenario.type)
  if (type === 'tooltip') {
    return {...scenario, type}
  }

  return {
    ...scenario,
    type,
    steps: [toStandaloneStep(firstStep(scenario))],
  }
}

export function validateScenario(
  scenario: IScenario,
  intent: ScenarioValidationIntent,
): string | null {
  if (!scenario.title.trim()) {
    return 'Введите название сценария.'
  }
  if (scenario.title.length > MAX_SCENARIO_TITLE_LENGTH) {
    return 'Название сценария не должно превышать 100 символов.'
  }
  if (scenario.description.length > MAX_SCENARIO_DESCRIPTION_LENGTH) {
    return 'Описание не должно превышать 250 символов.'
  }

  for (const [index, step] of scenario.steps.entries()) {
    const stepNumber = index + 1
    if (step.title.length > MAX_STEP_TITLE_LENGTH) {
      return `Название шага ${stepNumber} не должно превышать 100 символов.`
    }
    if (step.text.length > MAX_STEP_CONTENT_LENGTH) {
      return `Текст шага ${stepNumber} не должен превышать 50 символов.`
    }

    const timeout = Number(step.timeout)
    if (!Number.isInteger(timeout) || timeout < 0) {
      return `Таймаут шага ${stepNumber} должен быть целым неотрицательным числом.`
    }
  }

  if (intent === 'save' && scenario.status !== 'published') return null
  if (scenario.steps.length === 0) {
    return 'Добавьте хотя бы один шаг перед публикацией.'
  }

  for (const [index, step] of scenario.steps.entries()) {
    const stepNumber = index + 1
    if (!step.title.trim()) {
      return `Заполните название шага ${stepNumber}.`
    }
    if (!step.text.trim()) {
      return `Заполните текст шага ${stepNumber}.`
    }
    if (scenario.type === 'tooltip' && !step.target.trim()) {
      return `Выберите целевой элемент для шага ${stepNumber}.`
    }
  }

  return null
}

export function buildPreviewScenario(scenario: IScenario): IWidgetPreviewScenario {
  const normalized = normalizeScenarioForSave(scenario)
  const step = firstStep(normalized)
  const title = step.title.trim() || (
    normalized.type === 'tooltip'
      ? 'Подсказка у элемента'
      : normalized.type === 'modal'
        ? 'Модальное окно'
        : 'Информационный баннер'
  )
  const content = step.text.trim() || 'Здесь будет текст сообщения для пользователя.'

  return {
    id: normalized.id || 'admin-widget-preview',
    type: normalized.type,
    title: normalized.title.trim() || title,
    steps: [{
      id: step.id || 'admin-widget-preview-step',
      step_order: 1,
      title,
      content,
      selector: normalized.type === 'tooltip'
        ? '[data-onboarding-id="preview-target"]'
        : '',
      action_type: 'next',
      timeout_sec: 0,
    }],
  }
}
