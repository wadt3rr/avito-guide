// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Analytics } from './analytics';
import { tooltipFlow } from './flow';
import { createTooltipPresentation, type ScenarioPresentation } from './presentation';
import { Runner } from './runner';
import { ScenarioDefinitionRegistry } from './scenario-definition';
import type { Scenario, ScenarioType } from './types';

function standaloneScenario(type: Exclude<ScenarioType, 'tooltip'>): Scenario {
  return {
    id: `scenario-${type}`,
    type,
    title: type,
    steps: [
      {
        id: `step-${type}`,
        step_order: 1,
        title: 'Сообщение',
        content: 'Текст сообщения',
        selector: '',
        action_type: 'next',
        timeout_sec: 0,
      },
    ],
  };
}

afterEach(() => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  document.body.replaceChildren();
  localStorage.clear();
  vi.useRealTimers();
});

function rect(top: number): DOMRect {
  return {
    top,
    bottom: top + 40,
    left: 20,
    right: 220,
    width: 200,
    height: 40,
    x: 20,
    y: top,
    toJSON: () => ({}),
  } as DOMRect;
}

function tooltipScenario(): Scenario {
  return {
    id: 'scenario-tooltip',
    type: 'tooltip',
    title: 'Tour',
    steps: [
      {
        id: 'step-first',
        step_order: 1,
        title: 'First step',
        content: 'First content',
        selector: '#first',
        action_type: 'next',
        timeout_sec: 0,
      },
      {
        id: 'step-second',
        step_order: 2,
        title: 'Second step',
        content: 'Second content',
        selector: '#second',
        action_type: 'next',
        timeout_sec: 0,
      },
    ],
  };
}

describe('Runner standalone experiences', () => {
  it.each(['modal', 'banner'] as const)(
    'renders %s without resolving a target selector',
    async (type) => {
      const analytics = { track: vi.fn() } as unknown as Analytics;
      const runner = new Runner(standaloneScenario(type), analytics);

      await runner.start();

      const root = document.getElementById('avito-onboarding-root')?.shadowRoot;
      expect(root?.querySelector(`.tip--${type}`)).toBeInstanceOf(HTMLElement);
      expect(analytics.track).not.toHaveBeenCalledWith(
        'step_failed',
        `scenario-${type}`,
        `step-${type}`,
        expect.anything(),
      );
    },
  );

  it('stops the active UI without recording a user dismissal', async () => {
    const analytics = { track: vi.fn() } as unknown as Analytics;
    const runner = new Runner(standaloneScenario('modal'), analytics);
    await runner.start();

    runner.stop();

    expect(document.getElementById('avito-onboarding-root')).toBeNull();
    expect(analytics.track).not.toHaveBeenCalledWith(
      'scenario_dismissed',
      expect.anything(),
      expect.anything(),
      expect.anything(),
    );
  });

  it('does not track analytics or persist visitor progress in preview mode', async () => {
    const analytics = { track: vi.fn() } as unknown as Analytics;
    const runner = new Runner(standaloneScenario('banner'), analytics, {
      mode: 'preview',
    });

    await runner.start();
    const root = document.getElementById('avito-onboarding-root')?.shadowRoot;
    (root?.querySelector('.btn--primary') as HTMLButtonElement).click();

    expect(analytics.track).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });
});

describe('Runner extension contracts', () => {
  it('uses an injected definition for presentation and traversal', async () => {
    const customPresentation: ScenarioPresentation = {
      type: 'modal',
      configure(elements) {
        elements.host.dataset.type = 'modal';
        elements.catcher.className = 'catch catch--custom';
        elements.catcher.style.pointerEvents = 'none';
        elements.spot.hidden = true;
        elements.tip.className = 'tip tip--custom';
      },
      position() {
        // Custom standalone presentation is positioned by CSS.
      },
    };
    const definitions = new ScenarioDefinitionRegistry([
      {
        type: 'tooltip',
        flow: tooltipFlow,
        presentation: createTooltipPresentation(),
      },
      {
        type: 'modal',
        flow: {...tooltipFlow, requiresTarget: () => false},
        presentation: customPresentation,
      },
    ]);
    const scenario = tooltipScenario();
    scenario.type = 'modal';
    const analytics = { track: vi.fn() } as unknown as Analytics;
    const runner = new Runner(scenario, analytics, {definitions});

    try {
      await runner.start();
      let root = document.getElementById('avito-onboarding-root')?.shadowRoot;
      expect(root?.querySelector('.tip--custom')).not.toBeNull();
      expect(root?.querySelector('.tip__title')?.textContent).toBe('First step');

      (root?.querySelector('.btn--primary') as HTMLButtonElement).click();
      await vi.waitFor(() => {
        root = document.getElementById('avito-onboarding-root')?.shadowRoot;
        expect(root?.querySelector('.tip__title')?.textContent).toBe('Second step');
      });
    } finally {
      runner.stop();
    }
  });
});

describe('Runner tooltip transitions', () => {
  it('hides the previous tooltip before scrolling to the next target', async () => {
    vi.useFakeTimers();
    const first = document.createElement('button');
    first.id = 'first';
    first.getBoundingClientRect = () => rect(100);

    let secondTop = 1_000;
    const second = document.createElement('button');
    second.id = 'second';
    second.getBoundingClientRect = () => rect(secondTop);
    second.scrollIntoView = vi.fn(() => {
      secondTop = 100;
    });
    document.body.append(first, second);

    const analytics = { track: vi.fn() } as unknown as Analytics;
    const runner = new Runner(tooltipScenario(), analytics);
    await runner.start();
    await vi.advanceTimersByTimeAsync(60);

    const root = document.getElementById('avito-onboarding-root')?.shadowRoot;
    const tip = root?.querySelector('.tip') as HTMLElement;
    expect(tip.dataset.ready).toBe('1');

    (root?.querySelector('.btn--primary') as HTMLButtonElement).click();

    expect(tip.dataset.ready).toBe('0');
    expect(root?.querySelector('.spot')?.hasAttribute('hidden')).toBe(true);
  });
});
