import type {
    IScenario,
    IScenarioStep,
    ScenarioStatus,
} from '../data/scenarios'
import {normalizeScenarioForSave, normalizeScenarioType} from '../data/scenarioTypes'

interface IApiScenarioStep {
    id: string
    scenario_id: string
    step_order: number
    title: string
    description?: string | null
    content: string
    selector: string
    action_type: string
    condition: string
    timeout_sec: number
}

interface IApiScenario {
    id: string
    title: string
    type?: string
    description: string | null
    status: string
    published_at: string | null
    url_pattern: string
    match_context: Record<string, string>
    priority: number
    steps?: IApiScenarioStep[]
    created_at: string
    updated_at: string
}

interface IApiScenarioStepPayload {
    id?: string
    step_order: number
    title: string
    content: string
    selector: string
    action_type: string
    condition: string
    timeout_sec: number
}

interface IApiScenarioPayload {
    title: string
    type: IScenario['type']
    description: string
    status: ScenarioStatus
    steps: IApiScenarioStepPayload[]
}

interface IApiScenarioPatch extends IApiScenarioPayload {
    published?: boolean
    url_pattern: string
}

export interface IScenarioStepAnalytics {
    stepId: string
    stepOrder: number
    title: string
    completed: number
}

export interface IScenarioAnalytics {
    scenarioId: string
    started: number
    finished: number
    conversion: number
    steps: IScenarioStepAnalytics[]
}

export interface IScenarioAnalyticsReport {
    blob: Blob
    filename: string
}

interface IApiScenarioStepAnalytics {
    step_id: string
    step_order: number
    title: string
    completed: number
}

interface IApiScenarioAnalytics {
    scenario_id: string
    started: number
    finished: number
    conversion: number
    steps?: IApiScenarioStepAnalytics[] | null
}

export type ScenarioPublicationAction = 'publish' | 'unpublish'

const apiOrigin = (import.meta.env.VITE_API_URL ?? 'http://localhost:8081').replace(
    /\/$/,
    '',
)
const scenariosUrl = `${apiOrigin}/api/v1/scenarios`
const apiTimeoutMs = 10_000
const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const anchorSelectorPattern = /^\[data-onboarding-id="([^"]+)"\]$/

export class ScenarioApiError extends Error {
    status: number

    constructor(message: string, status: number) {
        super(message)
        this.name = 'ScenarioApiError'
        this.status = status
    }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
    const controller = new AbortController()
    const timeoutId = globalThis.setTimeout(() => controller.abort(), apiTimeoutMs)

    try {
        const response = await fetch(url, {
            ...init,
            signal: controller.signal,
            headers: {
                Accept: 'application/json',
                ...(init?.body ? {'Content-Type': 'application/json'} : {}),
                ...init?.headers,
            },
        })

        if (!response.ok) {
            const responseText = await response.text()
            throw new ScenarioApiError(
                responseText.trim() || `API вернул ошибку ${response.status}`,
                response.status,
            )
        }

        return response.json() as Promise<T>
    } catch (error) {
        if (controller.signal.aborted) {
            throw new ScenarioApiError('API не ответило за 10 секунд.', 408)
        }
        throw error
    } finally {
        globalThis.clearTimeout(timeoutId)
    }
}

function toScenarioStatus(scenario: IApiScenario): ScenarioStatus {
    return scenario.published_at || scenario.status === 'published'
        ? 'published'
        : 'draft'
}

function selectorToTarget(selector: string) {
    return anchorSelectorPattern.exec(selector)?.[1] ?? selector
}

function targetToSelector(target: string) {
    const value = target.trim()
    if (!value) return ''
    if (value.startsWith('.') || value.startsWith('#') || value.startsWith('[')) {
        return value
    }

    return `[data-onboarding-id="${CSS.escape(value)}"]`
}

function apiStepToScenarioStep(step: IApiScenarioStep): IScenarioStep {
    return {
        id: step.id,
        title: step.title,
        text: step.content,
        target: selectorToTarget(step.selector),
        timeout: String(step.timeout_sec),
    }
}

function apiScenarioToScenario(scenario: IApiScenario): IScenario {
    const status = toScenarioStatus(scenario)

    return normalizeScenarioForSave({
        id: scenario.id,
        type: normalizeScenarioType(scenario.type),
        title: scenario.title,
        description: scenario.description ?? '',
        path: !scenario.url_pattern || scenario.url_pattern === '*' ? '' : scenario.url_pattern,
        status,
        canOpen: status === 'published',
        steps: [...(scenario.steps ?? [])]
            .sort((firstStep, secondStep) => firstStep.step_order - secondStep.step_order)
            .map(apiStepToScenarioStep),
    })
}

function scenarioStepToPayload(
    step: IScenarioStep,
    index: number,
): IApiScenarioStepPayload {
    const timeout = Number.parseInt(step.timeout, 10)

    return {
        ...(uuidPattern.test(step.id) ? {id: step.id} : {}),
        step_order: index + 1,
        title: step.title,
        content: step.text,
        selector: targetToSelector(step.target),
        action_type: 'next',
        condition: 'always',
        timeout_sec: Number.isFinite(timeout) && timeout >= 0 ? timeout : 0,
    }
}

function scenarioToPayload(scenario: IScenario): IApiScenarioPayload {
    const normalizedScenario = normalizeScenarioForSave(scenario)
    return {
        title: normalizedScenario.title.trim(),
        type: normalizedScenario.type,
        description: normalizedScenario.description.trim(),
        status: normalizedScenario.status,
        steps: normalizedScenario.steps.map(scenarioStepToPayload),
    }
}

export async function getScenarios(): Promise<IScenario[]> {
    const scenarios = await request<IApiScenario[]>(scenariosUrl)
    const detailedScenarios = await Promise.all(
        scenarios.map((scenario) => getScenarioById(scenario.id)),
    )

    return detailedScenarios
}

export async function getScenarioById(id: string): Promise<IScenario> {
    if (!uuidPattern.test(id)) {
        throw new ScenarioApiError('Некорректный идентификатор сценария.', 400)
    }

    const scenario = await request<IApiScenario>(`${scenariosUrl}/${id}`)
    return apiScenarioToScenario(scenario)
}

export async function getScenarioAnalytics(
    id: string,
): Promise<IScenarioAnalytics> {
    const analytics = await request<IApiScenarioAnalytics>(
        `${scenariosUrl}/${id}/analytics`,
    )

    return {
        scenarioId: analytics.scenario_id,
        started: analytics.started,
        finished: analytics.finished,
        conversion: analytics.conversion,
        steps: (analytics.steps ?? [])
            .map((step) => ({
                stepId: step.step_id,
                stepOrder: step.step_order,
                title: step.title,
                completed: step.completed,
            }))
            .sort((firstStep, secondStep) => firstStep.stepOrder - secondStep.stepOrder),
    }
}

export async function getScenarioAnalyticsReport(
    id: string,
): Promise<IScenarioAnalyticsReport> {
    const controller = new AbortController()
    const timeoutId = globalThis.setTimeout(() => controller.abort(), apiTimeoutMs)

    try {
        const response = await fetch(`${scenariosUrl}/${id}/analytics/report`, {
            headers: {Accept: 'application/pdf'},
            signal: controller.signal,
        })

        if (!response.ok) {
            const responseText = await response.text()
            throw new ScenarioApiError(
                responseText.trim() || `API вернул ошибку ${response.status}`,
                response.status,
            )
        }

        const disposition = response.headers.get('Content-Disposition') ?? ''
        const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1]
            ?? `analytics-${id}.pdf`

        return {
            blob: await response.blob(),
            filename,
        }
    } catch (error) {
        if (controller.signal.aborted) {
            throw new ScenarioApiError('API не ответило за 10 секунд.', 408)
        }
        throw error
    } finally {
        globalThis.clearTimeout(timeoutId)
    }
}

export async function createScenario(
    scenario: IScenario,
    publish = false,
): Promise<IScenario> {
    const createdScenario = await request<IApiScenario>(scenariosUrl, {
        method: 'POST',
        body: JSON.stringify(scenarioToPayload(scenario)),
    })

    return updateScenario(
        {...scenario, id: createdScenario.id},
        publish ? 'publish' : undefined,
    )
}

export async function updateScenario(
    scenario: IScenario,
    publicationAction?: ScenarioPublicationAction,
): Promise<IScenario> {
    const status =
        publicationAction === 'publish'
            ? 'published'
            : publicationAction === 'unpublish'
                ? 'draft'
                : scenario.status
    const payload: IApiScenarioPatch = {
        ...scenarioToPayload({
            ...scenario,
            status,
        }),
        url_pattern: scenario.path.trim() || '*',
        ...(publicationAction
            ? {published: publicationAction === 'publish'}
            : {}),
    }

    const updatedScenario = await request<IApiScenario>(
        `${scenariosUrl}/${scenario.id}`,
        {
            method: 'PATCH',
            body: JSON.stringify(payload),
        },
    )

    return apiScenarioToScenario(updatedScenario)
}
