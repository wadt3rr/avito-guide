import type {BackendAnalyticsEvent, BackendEventType, EventType, WidgetConfig} from './types';

const FLUSH_INTERVAL_MS = 3000;
const MAX_RETRY_INTERVAL_MS = 30_000;
const MAX_QUEUED_EVENTS = 100;

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
  private retryIntervalMs = FLUSH_INTERVAL_MS;

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
    if (this.queue.length > MAX_QUEUED_EVENTS) this.queue.shift();
    this.schedule();
  }

  destroy(): void {
    this.flush();
    window.removeEventListener('pagehide', this.flush);
  }

  private schedule(delayMs = FLUSH_INTERVAL_MS): void {
    if (this.timer !== undefined) return;
    this.timer = window.setTimeout(() => {
      this.timer = undefined;
      this.flush();
    }, delayMs);
  }

  private retry(batch: BackendAnalyticsEvent[]): void {
    this.queue = [...batch, ...this.queue].slice(0, MAX_QUEUED_EVENTS);
    this.schedule(this.retryIntervalMs);
    this.retryIntervalMs = Math.min(this.retryIntervalMs * 2, MAX_RETRY_INTERVAL_MS);
    if (this.config.debug) console.warn('[onboarding] Analytics delivery failed; retry scheduled.');
  }

  private flush(): void {
    if (this.queue.length === 0) return;

    const batch = this.queue;
    this.queue = [];
    if (!this.config.apiUrl) return;

    const url = `${this.config.apiUrl}/api/v1/embed/events`;
    const body = JSON.stringify(batch);
    if (navigator.sendBeacon?.(url, new Blob([body], {type: 'text/plain;charset=UTF-8'}))) {
      this.retryIntervalMs = FLUSH_INTERVAL_MS;
      return;
    }

    void fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=UTF-8'},
      body,
      keepalive: true,
    }).then(
      (response) => {
        if (response.ok) {
          this.retryIntervalMs = FLUSH_INTERVAL_MS;
          return;
        }
        if (response.status === 408 || response.status === 429 || response.status >= 500) {
          this.retry(batch);
          return;
        }
        this.retryIntervalMs = FLUSH_INTERVAL_MS;
        if (this.config.debug) {
          console.warn(`[onboarding] Analytics delivery rejected with status ${response.status}.`);
        }
      },
      () => this.retry(batch),
    );
  }
}
