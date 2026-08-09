import {Analytics} from './analytics';
import {watchPathname} from './navigation';
import {getAnonId, getSessionId} from './progress';
import {Runner} from './runner';
import {createSource} from './source';
import type {ResolveContext, Scenario, WidgetConfig} from './types';

interface PublicApi {
  identify(facts: Record<string, string>): void;
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
    previewId: params.get('onboarding_preview'),
    debug: script?.dataset.debug === 'true' || params.has('onboarding_debug'),
  };
}

const config = readConfig();
const facts: Record<string, string> = {};
const analytics = new Analytics(config, {sessionId: getSessionId()});
const source = createSource(config);

let running: Runner | null = null;
let runningPath = '';
let startVersion = 0;

async function resolveAndRun(): Promise<void> {
  const version = ++startVersion;
  const pathname = location.pathname;

  if (running) {
    if (runningPath === pathname) return;
    running.stop('navigated');
    running = null;
  }

  const context: ResolveContext = {
    path: pathname,
    url: pathname,
    anon_id: getAnonId(),
    session_id: getSessionId(),
    context: {...facts},
  };
  const scenario = await source.resolve(context);
  if (version !== startVersion || pathname !== location.pathname) return;
  if (!scenario || scenario.steps.length === 0) return;

  runningPath = pathname;
  running = new Runner(scenario, analytics, {}, () => {
    running = null;
  });
  await running.start();
}

function start(): Promise<void> {
  return resolveAndRun();
}

async function preview(scenario: Scenario): Promise<void> {
  startVersion += 1;
  running?.stop('preview_replaced');
  running = null;
  if (scenario.steps.length === 0) return;

  running = new Runner(scenario, analytics, {mode: 'preview'}, () => {
    running = null;
  });
  await running.start();
}

window.AvitoOnboarding = {
  identify(next) {
    Object.assign(facts, next);
  },
  preview,
  start,
};

watchPathname(() => {
  void start();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => void start(), {once: true});
} else {
  void start();
}
