import type { ResolveContext, Scenario, WidgetConfig } from './types';

export interface ScenarioSource {
  resolve(context: ResolveContext): Promise<Scenario | null>;
}

class HttpSource implements ScenarioSource {
  constructor(private readonly config: WidgetConfig) {}

  async resolve(context: ResolveContext): Promise<Scenario | null> {
    const base = this.config.apiUrl;
    if (!base) return null;

    try {
      const response = this.config.previewId
        ? await fetch(`${base}/api/v1/embed/scenarios/${this.config.previewId}?preview=1`, {
            headers: { Accept: 'application/json' },
          })
        : await fetch(`${base}/api/v1/embed/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(context),
          });

      if (response.status === 204 || !response.ok) return null;
      return (await response.json()) as Scenario;
    } catch {
      return null;
    }
  }
}

export function createSource(config: WidgetConfig): ScenarioSource {
  return new HttpSource(config);
}
