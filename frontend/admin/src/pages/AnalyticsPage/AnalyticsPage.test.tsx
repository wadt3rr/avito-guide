// @vitest-environment jsdom

import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react'
import {MemoryRouter} from 'react-router-dom'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {
    getScenarioAnalytics,
    getScenarioAnalyticsReport,
    getScenarios,
} from '../../api/scenarios'
import {AnalyticsPage} from './AnalyticsPage'

vi.mock('../../api/scenarios', () => ({
    getScenarioAnalytics: vi.fn(),
    getScenarioAnalyticsReport: vi.fn(),
    getScenarios: vi.fn(),
}))

afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

const firstScenarioId = '123e4567-e89b-42d3-a456-426614174000'
const secondScenarioId = '123e4567-e89b-42d3-a456-426614174001'

function mockAnalyticsData(includeSecondScenario = false) {
    const scenarios = [{
        id: firstScenarioId,
        type: 'tooltip' as const,
        title: 'Доставка товара',
        description: '',
        path: '',
        status: 'published' as const,
        canOpen: true,
        steps: [],
    }]
    if (includeSecondScenario) {
        scenarios.push({
            id: secondScenarioId,
            type: 'tooltip',
            title: 'Получение заказа',
            description: '',
            path: '',
            status: 'published',
            canOpen: true,
            steps: [],
        })
    }
    vi.mocked(getScenarios).mockResolvedValue(scenarios)
    vi.mocked(getScenarioAnalytics).mockImplementation(async (scenarioId) => ({
        scenarioId,
        started: 10,
        finished: 6,
        conversion: 60,
        steps: [],
    }))
}

function renderAnalyticsPage() {
    render(
        <MemoryRouter>
            <AnalyticsPage/>
        </MemoryRouter>,
    )
}

describe('AnalyticsPage PDF report', () => {
    it('downloads the backend PDF for the selected scenario', async () => {
        const reportBlob = new Blob(['%PDF-report'], {type: 'application/pdf'})
        mockAnalyticsData(true)
        vi.mocked(getScenarioAnalyticsReport).mockResolvedValue({
            blob: reportBlob,
            filename: 'analytics-delivery.pdf',
        })
        const createObjectURL = vi.fn().mockReturnValue('blob:analytics-report')
        const revokeObjectURL = vi.fn()
        vi.stubGlobal('URL', {createObjectURL, revokeObjectURL})
        renderAnalyticsPage()
        const appendedNodes: (string | Node)[] = []
        vi.spyOn(document.body, 'append').mockImplementation((...nodes: (string | Node)[]) => {
            appendedNodes.push(...nodes)
        })
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)

        fireEvent.change(await screen.findByRole('combobox'), {
            target: {value: secondScenarioId},
        })
        const reportButton = await screen.findByRole('button', {name: 'Получить отчёт в PDF'})
        await waitFor(() => expect(reportButton.hasAttribute('disabled')).toBe(false))
        fireEvent.click(reportButton)

        await waitFor(() => expect(appendedNodes).toHaveLength(1))
        expect(getScenarioAnalyticsReport).toHaveBeenCalledWith(secondScenarioId)
        expect(appendedNodes[0]).toEqual(expect.objectContaining({
            download: 'analytics-delivery.pdf',
            href: 'blob:analytics-report',
        }))
        expect(createObjectURL).toHaveBeenCalledWith(reportBlob)
        await waitFor(() => expect(revokeObjectURL).toHaveBeenCalledWith('blob:analytics-report'))
    })

    it('disables the button while the report request is pending', async () => {
        mockAnalyticsData()
        vi.mocked(getScenarioAnalyticsReport).mockReturnValue(new Promise(() => undefined))
        renderAnalyticsPage()

        const reportButton = await screen.findByRole('button', {name: 'Получить отчёт в PDF'})
        await waitFor(() => expect(reportButton.hasAttribute('disabled')).toBe(false))
        fireEvent.click(reportButton)

        expect(await screen.findByRole('button', {name: 'Формируем отчёт…'}))
            .toEqual(expect.objectContaining({disabled: true}))
    })

    it('shows an error and enables retry when the report request fails', async () => {
        mockAnalyticsData()
        vi.mocked(getScenarioAnalyticsReport).mockRejectedValue(new Error('backend unavailable'))
        renderAnalyticsPage()

        const reportButton = await screen.findByRole('button', {name: 'Получить отчёт в PDF'})
        await waitFor(() => expect(reportButton.hasAttribute('disabled')).toBe(false))
        fireEvent.click(reportButton)

        expect((await screen.findByRole('alert')).textContent)
            .toBe('Не удалось получить PDF. Попробуйте ещё раз.')
        expect(reportButton.hasAttribute('disabled')).toBe(false)
    })
})
