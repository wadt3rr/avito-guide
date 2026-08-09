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

  it('does not call a missing backend resolve endpoint when data-api is configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const configuredSource = createSource({
      apiUrl: 'http://localhost:8081',
      debug: false,
    });
    const scenario = await configuredSource.resolve({ path: '/my' });

    expect(scenario?.type).toBe('modal');
    expect(fetchMock).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
