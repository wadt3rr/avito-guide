import { Analytics } from './analytics';
import { watchPathname } from './navigation';
import { getSessionId } from './progress';
import { Runner } from './runner';
import { createSource } from './source';
import type { ResolveContext, Scenario, WidgetConfig } from './types';

/**
 * Точка входа. Сайт подключает виджет одной строкой:
 *
 *   <script src=".../widget.js" data-api="http://localhost:8081"></script>
 *
 * Ничего импортировать и вызывать не требуется. Для выбора сценария виджет
 * использует только pathname текущей страницы.
 */

interface PublicApi {
  preview(scenario: Scenario): Promise<void>;
  start(): Promise<void>;
}

declare global {
  interface Window {
    AvitoOnboarding?: PublicApi;
  }
}

function readConfig(): WidgetConfig {
  const script = document.currentScript as HTMLScriptElement | null;
  const params = new URLSearchParams(location.search);

  return {
    apiUrl: script?.dataset.api?.replace(/\/$/, '') || null,
    debug: script?.dataset.debug === 'true' || params.has('onboarding_debug'),
  };
}

const config = readConfig();

const analytics = new Analytics(config, {
  sessionId: getSessionId(),
});
const source = createSource(config);

let running: Runner | null = null;
let startVersion = 0;

async function start(): Promise<void> {
  if (running) return;
  const version = ++startVersion;
  const pathname = location.pathname;

  const context: ResolveContext = { path: pathname };

  const scenario = await source.resolve(context);
  if (version !== startVersion || pathname !== location.pathname) return;
  if (!scenario || scenario.steps.length === 0) return;

  running = new Runner(scenario, analytics);
  await running.start();
}

function restart(): void {
  startVersion += 1;
  running?.stop();
  running = null;
  void start();
}

async function preview(scenario: Scenario): Promise<void> {
  startVersion += 1;
  running?.stop();
  running = null;

  if (scenario.steps.length === 0) return;

  running = new Runner(scenario, analytics, { mode: 'preview' });
  await running.start();
}

window.AvitoOnboarding = {
  preview,
  start,
};

watchPathname(restart);

// Дожидаемся готовности разметки: до неё искать цели бессмысленно.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void start(), { once: true });
} else {
  void start();
}
