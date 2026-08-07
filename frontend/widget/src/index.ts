import { Analytics } from './analytics';
import { getAnonId, getSessionId } from './progress';
import { Runner } from './runner';
import { createSource } from './source';
import type { ResolveContext, WidgetConfig } from './types';

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
let runningPath = '';
let queue: Promise<void> = Promise.resolve();

async function resolveAndRun(): Promise<void> {
  if (running) {
    if (runningPath === location.pathname) return;
    running.stop('navigated');
  }

  const context: ResolveContext = {
    url: location.pathname,
    anon_id: getAnonId(),
    session_id: getSessionId(),
    context: { ...facts },
  };

  const scenario = await createSource(config).resolve(context);
  if (!scenario || scenario.steps.length === 0) return;

  runningPath = location.pathname;
  running = new Runner(scenario, analytics, () => {
    running = null;
  });
  await running.start();
}

function start(): Promise<void> {
  queue = queue.then(resolveAndRun, resolveAndRun);
  return queue;
}

window.AvitoOnboarding = {
  identify(next) {
    Object.assign(facts, next);
  },
  start,
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void start(), { once: true });
} else {
  void start();
}
