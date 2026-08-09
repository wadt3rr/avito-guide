// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { Analytics } from './analytics';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('backend analytics contract', () => {
  it('posts one backend-compatible event to the existing analytics endpoint', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: undefined,
    });

    const analytics = new Analytics(
      { apiUrl: 'http://localhost:8081', debug: false },
      { sessionId: 'session-test' },
    );
    analytics.track('scenario_started', 'scenario-id', null);
    analytics.destroy();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:8081/api/v1/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: 'scenario-id',
        session_id: 'session-test',
        event_type: 'started',
      }),
      keepalive: true,
    });
  });

  it('maps supported events and drops widget-only diagnostics', () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: undefined,
    });

    const analytics = new Analytics(
      { apiUrl: 'http://localhost:8081', debug: false },
      { sessionId: 'session-test' },
    );
    analytics.track('step_shown', 'scenario-id', 'step-id');
    analytics.track('step_failed', 'scenario-id', 'step-id');
    analytics.track('step_completed', 'scenario-id', 'step-id');
    analytics.track('scenario_dismissed', 'scenario-id', 'step-id');
    analytics.destroy();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls.map((call) => JSON.parse(call[1].body as string))).toEqual([
      {
        scenario_id: 'scenario-id',
        session_id: 'session-test',
        step_id: 'step-id',
        event_type: 'step_completed',
      },
      {
        scenario_id: 'scenario-id',
        session_id: 'session-test',
        step_id: 'step-id',
        event_type: 'skipped',
      },
    ]);
  });
});
