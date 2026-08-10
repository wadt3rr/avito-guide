import {afterEach, describe, expect, it, vi} from 'vitest'
import {
  getScenarioById,
  getScenarios,
  ScenarioApiError,
} from './scenarios'

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('scenario API boundary', () => {
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
