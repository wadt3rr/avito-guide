export type ScenarioStatus = 'published' | 'draft'

export interface IScenarioStep {
  id: string
  title: string
  text: string
  target: string
  timeout: string
}

export interface IScenario {
  id: string
  title: string
  description: string
  path: string
  status: ScenarioStatus
  canOpen?: boolean
  steps: IScenarioStep[]
}

export function createEmptyStep(index: number): IScenarioStep {
  return {
    id: `step-${Date.now().toString(36)}-${index}`,
    title: `Шаг ${index + 1}`,
    text: '',
    target: 'form-title',
    timeout: '5',
  }
}
