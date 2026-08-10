import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  deleteScenario,
  getScenarioAnalyticsReport,
  getScenarioById,
  getScenarios,
  ScenarioApiError,
} from './scenarios'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('scenario API boundary', () => {
  it('deletes a scenario through the backend API', async () => {
    const scenarioId = '123e4567-e89b-42d3-a456-426614174000'
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, {status: 204}))
    vi.stubGlobal('fetch', fetchMock)

    await deleteScenario(scenarioId)

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:8081/api/v1/scenarios/${scenarioId}`,
      expect.objectContaining({method: 'DELETE'}),
    )
  })

  it('downloads the analytics PDF for the requested scenario id', async () => {
    const scenarioId = '123e4567-e89b-42d3-a456-426614174000'
    const pdf = new Blob(['%PDF-report'], {type: 'application/pdf'})
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(pdf, {
        headers: {
          'Content-Disposition': `attachment; filename="analytics-${scenarioId}.pdf"`,
          'Content-Type': 'application/pdf',
        },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const report = await getScenarioAnalyticsReport(scenarioId)

    expect(fetchMock).toHaveBeenCalledWith(
      `http://localhost:8081/api/v1/scenarios/${scenarioId}/analytics/report`,
      expect.objectContaining({
        headers: expect.objectContaining({Accept: 'application/pdf'}),
      }),
    )
    expect(report.filename).toBe(`analytics-${scenarioId}.pdf`)
    await expect(report.blob.text()).resolves.toBe('%PDF-report')
  })

  it('rejects an invalid scenario id before making a request', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(getScenarioById('not-a-uuid')).rejects.toEqual(
      expect.objectContaining<Partial<ScenarioApiError>>({status: 400}),
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('aborts a request that does not answer within ten seconds', async () => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn((_url: string | URL | Request, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        const fallbackTimer = setTimeout(
          () => reject(new Error('request was not aborted')),
          11_000,
        )
        init?.signal?.addEventListener('abort', () => {
          clearTimeout(fallbackTimer)
          reject(new DOMException('aborted', 'AbortError'))
        })
      }),
    ))

    const rejection = getScenarios().catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(11_000)

    await expect(rejection).resolves.toEqual(
      expect.objectContaining<Partial<ScenarioApiError>>({status: 408}),
    )
  })
})
