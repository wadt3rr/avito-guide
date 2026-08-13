// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { standaloneFlow, tooltipFlow } from './flow';
import { createStandalonePresentation } from './presentation';
import { StepContentRegistry, type StepContentRenderer } from './step-content';
import { STYLES } from './styles';
import type { ScenarioType, Step } from './types';
import { Ui, type StepView, type UiHandlers } from './ui';

const step: Step = {
  id: 'step-1',
  step_order: 1,
  title: 'Заголовок',
  content: 'Содержимое',
  selector: '#target',
  action_type: 'next',
  timeout_sec: 0,
};

const handlers: UiHandlers = {
  onNext: vi.fn(),
  onBack: vi.fn(),
  onSkip: vi.fn(),
  onDismiss: vi.fn(),
};

function view(type: ScenarioType, total = 1): StepView {
  const flow = type === 'tooltip' ? tooltipFlow : standaloneFlow;
  return {
    step,
    index: 0,
    total: flow.viewTotal(total),
    navigation: flow.navigation(0, total),
  };
}

function shadowRoot(): ShadowRoot {
  const root = document.getElementById('avito-onboarding-root')?.shadowRoot;
  if (!root) throw new Error('Widget shadow root was not created');
  return root;
}

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Ui variants', () => {
  it('renders content through the injected renderer registry', () => {
    const renderer: StepContentRenderer = {
      kind: 'custom',
      render() {
        const fragment = document.createDocumentFragment();
        const content = document.createElement('div');
        content.className = 'custom-content';
        fragment.append(content);
        return fragment;
      },
    };
    const registry = new StepContentRegistry([renderer], 'custom');
    const ui = new Ui(
      handlers,
      createStandalonePresentation('modal', true),
      registry,
    );
    try {
      ui.render(view('modal'));

      expect(shadowRoot().querySelector('.custom-content')).not.toBeNull();
    } finally {
      ui.destroy();
    }
  });

  it('uses the injected presentation instead of branching on the view type', () => {
    vi.useFakeTimers();
    const ui = new Ui(handlers, createStandalonePresentation('banner', false));
    try {
      ui.render(view('tooltip'));

      const root = shadowRoot();
      expect(root.querySelector('.tip--banner')).not.toBeNull();
      expect((root.querySelector('.catch') as HTMLElement).style.pointerEvents).toBe('none');
    } finally {
      ui.destroy();
      vi.clearAllTimers();
      vi.useRealTimers();
    }
  });

  it('renders multi-step tooltip navigation next to its target', () => {
    const target = document.createElement('button');
    document.body.append(target);
    const ui = new Ui(handlers);

    ui.render(view('tooltip', 2), target);

    const root = shadowRoot();
    expect(root.querySelector('.tip--tooltip')).not.toBeNull();
    expect(root.querySelector('.spot')?.hasAttribute('hidden')).toBe(false);
    expect(root.querySelector('.tip__count')?.textContent).toBe('1 из 2');
    expect(root.querySelector('.btn--primary')?.textContent).toBe('Далее');
    ui.destroy();
  });

  it('uses the same tooltip without tour chrome for one step', () => {
    const target = document.createElement('button');
    document.body.append(target);
    const ui = new Ui(handlers);

    ui.render(view('tooltip'), target);

    const root = shadowRoot();
    expect(root.querySelector('.tip--tooltip')).not.toBeNull();
    expect(root.querySelector('.tip__count')).toBeNull();
    expect(root.querySelector('.btn--ghost')).toBeNull();
    expect(root.querySelector('.btn--primary')?.textContent).toBe('Готово');
    ui.destroy();
  });

  it('renders a standalone blocking modal without tour chrome', () => {
    const ui = new Ui(handlers, createStandalonePresentation('modal', true));

    ui.render(view('modal'));

    const root = shadowRoot();
    expect(root.querySelector('.tip--modal')).not.toBeNull();
    expect(root.querySelector('.spot')?.hasAttribute('hidden')).toBe(true);
    expect(root.querySelector('.tip__count')).toBeNull();
    expect((root.querySelector('.catch') as HTMLElement).style.pointerEvents).toBe('auto');
    ui.destroy();
  });

  it('renders a standalone non-blocking banner without tour chrome', () => {
    const ui = new Ui(handlers, createStandalonePresentation('banner', false));

    ui.render(view('banner'));

    const root = shadowRoot();
    expect(root.querySelector('.tip--banner')).not.toBeNull();
    expect(root.querySelector('.spot')?.hasAttribute('hidden')).toBe(true);
    expect(root.querySelector('.tip__count')).toBeNull();
    expect((root.querySelector('.catch') as HTMLElement).style.pointerEvents).toBe('none');
    ui.destroy();
  });
});

describe('Ui positioning while the page moves', () => {
  it('reflows when the mobile visual viewport changes', () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal('visualViewport', {
      width: 320,
      height: 568,
      addEventListener,
      removeEventListener,
    });
    const ui = new Ui(handlers);

    expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));

    ui.destroy();

    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('coalesces repeated scroll events without postponing the scheduled frame', () => {
    const frames: FrameRequestCallback[] = [];
    const requestFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        frames.push(callback);
        return frames.length;
      });
    const cancelFrame = vi.spyOn(window, 'cancelAnimationFrame');
    const target = document.createElement('button');
    target.getBoundingClientRect = () =>
      ({
        top: 120,
        bottom: 160,
        left: 20,
        right: 220,
        width: 200,
        height: 40,
      }) as DOMRect;
    document.body.append(target);
    const ui = new Ui(handlers);
    ui.render(view('tooltip'), target);
    frames.length = 0;
    requestFrame.mockClear();
    cancelFrame.mockClear();

    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));

    expect(requestFrame).toHaveBeenCalledTimes(1);
    expect(cancelFrame).not.toHaveBeenCalled();

    frames[0](0);
    window.dispatchEvent(new Event('scroll'));
    expect(requestFrame).toHaveBeenCalledTimes(2);
    ui.destroy();
  });

  it('does not animate spotlight coordinates behind the target', () => {
    expect(STYLES).not.toMatch(/\.spot\s*\{[^}]*transition:\s*top/s);
  });
});

describe('Ui tour footer', () => {
  it('keeps the final-step counter and actions on one line', () => {
    expect(STYLES).toMatch(/\.tip__count\s*\{[^}]*white-space:\s*nowrap/s);
    expect(STYLES).toMatch(/\.tip--tooltip \.tip__actions\s*\{[^}]*gap:\s*4px/s);
    expect(STYLES).toMatch(/\.tip--tooltip \.btn\s*\{[^}]*padding[^:]*:\s*8px 10px/s);
  });

  it('contains mobile-only size, scrolling, safe-area, and touch rules', () => {
    expect(STYLES).toMatch(/@media \(max-width: 480px\)/);
    expect(STYLES).toMatch(/max-height:\s*calc\(100dvh/);
    expect(STYLES).toMatch(/env\(safe-area-inset-bottom\)/);
    expect(STYLES).toMatch(/min-height:\s*44px/);
    expect(STYLES).toMatch(/overflow-y:\s*auto/);
  });
});
