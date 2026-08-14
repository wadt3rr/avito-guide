// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { createSource } from './source';

describe('scenario source', () => {
  it('distinguishes an empty response from an HTTP failure', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(null, {status: 204}))
      .mockResolvedValueOnce(new Response('failed', {status: 503}));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const errors: unknown[] = [];
    const onError = (event: Event) => errors.push((event as CustomEvent).detail);
    window.addEventListener('avito-onboarding:error', onError);

    const configuredSource = createSource({
      apiUrl: 'http://localhost:8081',
      debug: false,
    });
    const scenario = await configuredSource.resolve({ path: '/my' }, controller.signal);
    await configuredSource.resolve({ path: '/my' }, controller.signal);

    expect(scenario).toBeNull();
    expect(errors).toEqual([{
      code: 'scenario_http_error',
      message: 'Scenario request failed with status 503.',
      status: 503,
    }]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/embed/resolve',
      expect.objectContaining({method: 'POST', signal: controller.signal}),
    );
    window.removeEventListener('avito-onboarding:error', onError);
    vi.unstubAllGlobals();
  });
});
