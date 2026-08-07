import { Analytics } from './analytics';
import { getAnonId, getSessionId } from './progress';
import { Runner } from './runner';
import { createSource } from './source';
import type { ResolveContext, WidgetConfig } from './types';

/**
 * Точка входа. Сайт подключает виджет одной строкой:
 *
 *   <script src=".../widget.js" data-api="http://localhost:8081"></script>
 *
 * Ничего импортировать и вызывать не требуется. Страница может дополнительно
 * сообщить о себе факты — сегмент, вертикаль, стадию сделки — через
 * window.AvitoOnboarding.identify(); без них работают сценарии,
 * которым достаточно адреса страницы.
 */

interface PublicApi {
  identify(facts: Record<string, string>): void;
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
    previewId: params.get('onboarding_preview'),
    debug: script?.dataset.debug === 'true' || params.has('onboarding_debug'),
  };
}

const config = readConfig();
const facts: Record<string, string> = {};

const analytics = new Analytics(config, {
  anonId: getAnonId(),
  sessionId: getSessionId(),
});

let running: Runner | null = null;

async function start(): Promise<void> {
  if (running) return;

  const context: ResolveContext = {
    url: location.pathname,
    anon_id: getAnonId(),
    session_id: getSessionId(),
    context: facts,
  };

  const scenario = await createSource(config).resolve(context);
  if (!scenario || scenario.steps.length === 0) return;

  running = new Runner(scenario, analytics);
  await running.start();
}

window.AvitoOnboarding = {
  identify(next) {
    Object.assign(facts, next);
  },
  start,
};

// Дожидаемся готовности разметки: до неё искать цели бессмысленно.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void start(), { once: true });
} else {
  void start();
}
