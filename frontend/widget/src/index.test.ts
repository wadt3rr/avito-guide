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
    expect(widgetMocks.resolve).toHaveBeenNthCalledWith(1, { path: '/create' });
    expect(widgetMocks.resolve).toHaveBeenNthCalledWith(2, { path: '/my' });
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
