import type {ResolveContext, Scenario, WidgetConfig} from './types';

export interface ScenarioSource {
  resolve(context: ResolveContext, signal?: AbortSignal): Promise<Scenario | null>;
}

interface WidgetErrorDetail {
  code: 'scenario_http_error' | 'scenario_invalid_response' | 'scenario_network_error';
  message: string;
  status?: number;
}

function reportError(config: WidgetConfig, detail: WidgetErrorDetail): void {
  window.dispatchEvent(new CustomEvent('avito-onboarding:error', {detail}));
  if (config.debug) console.warn(`[onboarding] ${detail.message}`);
}

class DisabledSource implements ScenarioSource {
  private warned = false;

  constructor(private readonly config: WidgetConfig) {}

  resolve(_context: ResolveContext, _signal?: AbortSignal): Promise<Scenario | null> {
    if (this.config.debug && !this.warned) {
      console.warn('[onboarding] Widget is disabled: set data-api.');
      this.warned = true;
    }
    return Promise.resolve(null);
  }
}

function isScenarioType(value: unknown): value is Scenario['type'] {
  return value === 'tooltip' || value === 'modal' || value === 'banner';
}

function readScenario(value: unknown, config: WidgetConfig): Scenario | null {
  if (!value || typeof value !== 'object') {
    reportError(config, {
      code: 'scenario_invalid_response',
      message: 'Scenario response is not an object.',
    });
    return null;
  }
  const candidate = value as Partial<Scenario>;
  if (!isScenarioType(candidate.type)) {
    reportError(config, {
      code: 'scenario_invalid_response',
      message: 'Scenario response has an unsupported type.',
    });
    return null;
  }
  return candidate as Scenario;
}

class HttpSource implements ScenarioSource {
  constructor(private readonly config: WidgetConfig) {}

  async resolve(context: ResolveContext, signal?: AbortSignal): Promise<Scenario | null> {
    const base = this.config.apiUrl;
    if (!base) return null;
    const signalOptions = signal ? {signal} : {};

    let response: Response;
    try {
      response = this.config.previewId
        ? await fetch(`${base}/api/v1/embed/scenarios/${this.config.previewId}?preview=1`, {headers: {Accept: 'application/json'}, ...signalOptions})
        : await fetch(`${base}/api/v1/embed/resolve`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            ...signalOptions,
            body: JSON.stringify({
              ...context,
              url: context.url ?? `${location.origin}${context.path}`,
              context: context.context ?? {},
            }),
          });
    } catch {
      if (signal?.aborted) return null;
      reportError(this.config, {
        code: 'scenario_network_error',
        message: 'Scenario request failed before receiving a response.',
      });
      return null;
    }

    if (response.status === 204) return null;
    if (!response.ok) {
      reportError(this.config, {
        code: 'scenario_http_error',
        message: `Scenario request failed with status ${response.status}.`,
        status: response.status,
      });
      return null;
    }

    try {
      return readScenario(await response.json(), this.config);
    } catch {
      reportError(this.config, {
        code: 'scenario_invalid_response',
        message: 'Scenario response is not valid JSON.',
      });
      return null;
    }
  }
}

export function createSource(config: WidgetConfig): ScenarioSource {
  return config.apiUrl ? new HttpSource(config) : new DisabledSource(config);
}
