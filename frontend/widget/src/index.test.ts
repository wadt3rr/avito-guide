// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResolveContext, Scenario } from './types';

const widgetMocks = vi.hoisted(() => ({
  resolve: vi.fn(),
  runners: [] as Array<{
    scenario: Scenario;
    mode: string | undefined;
    start: ReturnType<typeof vi.fn>;
    stop: ReturnType<typeof vi.fn>;
  }>,
}));

vi.mock('./analytics', () => ({ Analytics: class {} }));
vi.mock('./progress', () => ({
  getAnonId: () => 'anon-test',
  getSessionId: () => 'session-test',
}));
vi.mock('./source', () => ({
  createSource: () => ({ resolve: widgetMocks.resolve }),
}));
vi.mock('./runner', () => ({
  Runner: class {
    constructor(scenario: Scenario, _analytics: unknown, options?: { mode?: string }) {
      const instance = {
        scenario,
        mode: options?.mode,
        start: vi.fn().mockResolvedValue(undefined),
        stop: vi.fn(),
      };
      widgetMocks.runners.push(instance);
      return instance;
    }
  },
}));

const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

function scenario(id: string): Scenario {
  return {
    id,
    type: 'modal',
    title: id,
    steps: [
      {
        id: `${id}-step`,
        step_order: 1,
        title: id,
        content: id,
        action_type: 'next',
        timeout_sec: 0,
      },
    ],
  };
}

afterEach(() => {
  history.pushState = originalPushState;
  history.replaceState = originalReplaceState;
  originalReplaceState.call(history, null, '', '/');
  delete window.AvitoOnboarding;
  widgetMocks.resolve.mockReset();
  widgetMocks.runners.length = 0;
  vi.resetModules();
});

describe('widget SPA lifecycle', () => {
  it('coalesces automatic and manual starts while the same resolve is pending', async () => {
    let finishResolve: ((value: Scenario | null) => void) | undefined;
    widgetMocks.resolve.mockImplementation(
      () => new Promise<Scenario | null>((resolve) => {
        finishResolve = resolve;
      }),
    );

    await import('./index');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    void window.AvitoOnboarding?.start();
    void window.AvitoOnboarding?.start();

    await vi.waitFor(() => expect(widgetMocks.resolve).toHaveBeenCalledOnce());
    finishResolve?.(null);
  });

  it('uses the latest page context in one resolve after SPA navigation', async () => {
    widgetMocks.resolve.mockResolvedValue(null);

    await import('./index');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.waitFor(() => expect(widgetMocks.resolve).toHaveBeenCalledOnce());
    widgetMocks.resolve.mockClear();

    history.pushState(null, '', '/my?vertical=jobs');
    window.AvitoOnboarding?.identify({ vertical: 'jobs' });
    void window.AvitoOnboarding?.start();

    await vi.waitFor(() => expect(widgetMocks.resolve).toHaveBeenCalledOnce());
    expect(widgetMocks.resolve).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/my',
        url: '/my',
        context: { vertical: 'jobs' },
      }),
      expect.any(AbortSignal),
    );
  });

  it('stops the old scenario and resolves a new one after pushState navigation', async () => {
    originalReplaceState.call(history, null, '', '/create');
    widgetMocks.resolve.mockImplementation((context: ResolveContext) =>
      Promise.resolve(scenario(`scenario-${context.path}`)),
    );

    await import('./index');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.waitFor(() => expect(widgetMocks.runners).toHaveLength(1));

    history.pushState(null, '', '/my');

    await vi.waitFor(() => expect(widgetMocks.runners).toHaveLength(2));
    expect(widgetMocks.runners[0].stop).toHaveBeenCalledOnce();
    expect(widgetMocks.runners[1].scenario.id).toBe('scenario-/my');
    expect(widgetMocks.runners[1].start).toHaveBeenCalledOnce();
    expect(widgetMocks.resolve).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ path: '/create' }),
      expect.any(AbortSignal),
    );
    expect(widgetMocks.resolve).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ path: '/my' }),
      expect.any(AbortSignal),
    );
  });

  it('resolves again when context changes on the same pathname', async () => {
    originalReplaceState.call(history, null, '', '/my');
    widgetMocks.resolve.mockImplementation((context: ResolveContext) =>
      Promise.resolve(scenario(`scenario-${context.context?.vertical ?? 'none'}`)),
    );

    await import('./index');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.waitFor(() => expect(widgetMocks.runners).toHaveLength(1));

    window.AvitoOnboarding?.identify({ vertical: 'jobs' });
    await window.AvitoOnboarding?.start();

    expect(widgetMocks.resolve).toHaveBeenCalledTimes(2);
    expect(widgetMocks.resolve).toHaveBeenLastCalledWith(
      expect.objectContaining({ context: { vertical: 'jobs' } }),
      expect.any(AbortSignal),
    );
    expect(widgetMocks.runners).toHaveLength(2);
    expect(widgetMocks.runners[0].stop).toHaveBeenCalledOnce();
  });

  it('ignores a stale scenario resolved for the previous pathname', async () => {
    originalReplaceState.call(history, null, '', '/create');
    let resolveCreate: ((value: Scenario) => void) | undefined;
    widgetMocks.resolve.mockImplementation((context: ResolveContext) => {
      if (context.path === '/create') {
        return new Promise<Scenario>((resolve) => {
          resolveCreate = resolve;
        });
      }
      return Promise.resolve(scenario(`scenario-${context.path}`));
    });

    await import('./index');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.waitFor(() => expect(widgetMocks.resolve).toHaveBeenCalledOnce());

    history.pushState(null, '', '/my');
    await vi.waitFor(() => expect(widgetMocks.runners).toHaveLength(1));
    resolveCreate?.(scenario('scenario-/create'));
    await Promise.resolve();

    expect(widgetMocks.runners).toHaveLength(1);
    expect(widgetMocks.runners[0].scenario.id).toBe('scenario-/my');
  });

  it('aborts a pending resolve after navigation changes its identity', async () => {
    const signals: AbortSignal[] = [];
    widgetMocks.resolve.mockImplementation((_context: ResolveContext, signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<Scenario | null>(() => undefined);
    });

    await import('./index');
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await vi.waitFor(() => expect(signals).toHaveLength(1));

    history.pushState(null, '', '/orders');

    await vi.waitFor(() => expect(signals).toHaveLength(2));
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });
});

describe('widget manual preview API', () => {
  it('replaces the active scenario with a runner that cannot record visitor state', async () => {
    widgetMocks.resolve.mockResolvedValue(null);
    await import('./index');
    document.dispatchEvent(new Event('DOMContentLoaded'));

    await window.AvitoOnboarding?.preview(scenario('draft-one'));
    expect(widgetMocks.runners).toHaveLength(1);
    expect(widgetMocks.runners[0].mode).toBe('preview');

    await window.AvitoOnboarding?.preview(scenario('draft-two'));
    expect(widgetMocks.runners).toHaveLength(2);
    expect(widgetMocks.runners[0].stop).toHaveBeenCalledOnce();
    expect(widgetMocks.runners[1].scenario.id).toBe('draft-two');
    expect(widgetMocks.runners[1].start).toHaveBeenCalledOnce();
  });
});
