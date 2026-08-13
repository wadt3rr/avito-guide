import {Analytics} from './analytics';
import {createDefaultScenarioRegistry} from './composition';
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
const definitions = createDefaultScenarioRegistry();

let running: Runner | null = null;
let runningKey = '';
let startVersion = 0;
let pending: {key: string; promise: Promise<void>; controller: AbortController} | null = null;
let scheduled: {
  promise: Promise<void>;
  timer: number;
  complete: () => void;
  fail: (reason: unknown) => void;
} | null = null;

function currentResolution(): {context: ResolveContext; key: string} {
  const pathname = location.pathname;
  const locationKey = pathname + location.search;
  const sortedFacts = Object.fromEntries(
    Object.entries(facts).sort(([left], [right]) => left.localeCompare(right)),
  );

  return {
    context: {
      path: pathname,
      url: pathname,
      anon_id: getAnonId(),
      session_id: getSessionId(),
      context: sortedFacts,
    },
    key: JSON.stringify([locationKey, sortedFacts]),
  };
}

async function resolveAndRun(
  context: ResolveContext,
  key: string,
  signal: AbortSignal,
): Promise<void> {
  const version = ++startVersion;

  if (running) {
    if (runningKey === key) return;
    running.stop('navigated');
    running = null;
    runningKey = '';
  }

  const scenario = await source.resolve(context, signal);
  if (version !== startVersion || key !== currentResolution().key) return;
  if (!scenario || scenario.steps.length === 0) return;

  runningKey = key;
  running = new Runner(scenario, analytics, {definitions}, () => {
    running = null;
    runningKey = '';
  });
  await running.start();
}

function startNow(): Promise<void> {
  const {context, key} = currentResolution();
  if (running && runningKey === key) return Promise.resolve();
  if (pending?.key === key) return pending.promise;

  pending?.controller.abort();
  const controller = new AbortController();
  const promise = resolveAndRun(context, key, controller.signal).finally(() => {
    if (pending?.promise === promise) pending = null;
  });
  pending = {key, promise, controller};
  return promise;
}

function start(): Promise<void> {
  if (scheduled) return scheduled.promise;

  let complete!: () => void;
  let fail!: (reason: unknown) => void;
  const promise = new Promise<void>((resolve, reject) => {
    complete = resolve;
    fail = reject;
  });
  const timer = window.setTimeout(() => {
    scheduled = null;
    void startNow().then(complete, fail);
  }, 0);

  scheduled = {promise, timer, complete, fail};
  return promise;
}

function cancelScheduledStart(): void {
  if (!scheduled) return;
  window.clearTimeout(scheduled.timer);
  scheduled.complete();
  scheduled = null;
}

async function preview(scenario: Scenario): Promise<void> {
  cancelScheduledStart();
  pending?.controller.abort();
  pending = null;
  startVersion += 1;
  running?.stop('preview_replaced');
  running = null;
  runningKey = '';
  if (scenario.steps.length === 0) return;

  running = new Runner(scenario, analytics, {mode: 'preview', definitions}, () => {
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
