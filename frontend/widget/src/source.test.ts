import { describe, expect, it, vi } from 'vitest';
import { createSource } from './source';

const source = createSource({ apiUrl: null, debug: false });

describe('mock scenario source', () => {
  it.each([
    ['/create', 'tooltip', 4],
    ['/my', 'modal', 1],
    ['/orders', 'banner', 1],
  ] as const)('returns a %s demo as %s', async (path, type, stepCount) => {
    const scenario = await source.resolve({ path });

    expect(scenario?.type).toBe(type);
    expect(scenario?.steps).toHaveLength(stepCount);
  });

  it('resolves through the backend when data-api is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, {status: 204}));
    vi.stubGlobal('fetch', fetchMock);

    const configuredSource = createSource({
      apiUrl: 'http://localhost:8081',
      debug: false,
    });
    const scenario = await configuredSource.resolve({ path: '/my' });

    expect(scenario).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8081/api/v1/embed/resolve',
      expect.objectContaining({method: 'POST'}),
    );
    vi.unstubAllGlobals();
  });
});
