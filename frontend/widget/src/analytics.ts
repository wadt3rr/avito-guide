import type {BackendAnalyticsEvent, BackendEventType, EventType, WidgetConfig} from './types';

const FLUSH_INTERVAL_MS = 3000;

export interface TrackerIdentity {
  sessionId: string;
}

const BACKEND_EVENT_TYPES: Partial<Record<EventType, BackendEventType>> = {
  scenario_started: 'started',
  step_completed: 'step_completed',
  step_skipped: 'skipped',
  scenario_dismissed: 'skipped',
  scenario_finished: 'finished',
};

export class Analytics {
  private queue: BackendAnalyticsEvent[] = [];
  private timer: number | undefined;

  constructor(
    private readonly config: WidgetConfig,
    private readonly identity: TrackerIdentity,
  ) {
    this.flush = this.flush.bind(this);
    window.addEventListener('pagehide', this.flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') this.flush();
    });
  }

  track(type: EventType, scenarioId: string, stepId: string | null, meta?: Record<string, unknown>): void {
    if (this.config.debug) console.info('[onboarding]', type, meta ?? '');

    const eventType = BACKEND_EVENT_TYPES[type];
    if (!eventType) return;

    this.queue.push({
      scenario_id: scenarioId,
      session_id: this.identity.sessionId,
      ...(stepId ? {step_id: stepId} : {}),
      event_type: eventType,
    });
    this.schedule();
  }

  destroy(): void {
    this.flush();
    window.removeEventListener('pagehide', this.flush);
  }

  private schedule(): void {
    if (this.timer !== undefined) return;
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      this.flush();
    }, FLUSH_INTERVAL_MS);
  }

  private flush(): void {
    if (this.queue.length === 0) return;

    const batch = this.queue;
    this.queue = [];
    if (!this.config.apiUrl) return;

    const url = `${this.config.apiUrl}/api/v1/embed/events`;
    const body = JSON.stringify(batch);
    if (navigator.sendBeacon?.(url, new Blob([body], {type: 'text/plain;charset=UTF-8'}))) return;

    void fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=UTF-8'},
      body,
      keepalive: true,
    }).catch(() => undefined);
  }
}
