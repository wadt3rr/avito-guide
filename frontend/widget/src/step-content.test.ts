// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { standaloneFlow, tooltipFlow } from './flow';
import {
  messageRenderer,
  StepContentRegistry,
  type StepContentRenderer,
} from './step-content';
import type { Step } from './types';
import type { StepView, UiHandlers } from './view';

const step: Step = {
  id: 'step-1',
  step_order: 1,
  title: 'Заголовок',
  content: 'Содержимое',
  selector: '#target',
  action_type: 'next',
  timeout_sec: 0,
};

function handlers(): UiHandlers {
  return {
    onNext: vi.fn(),
    onBack: vi.fn(),
    onSkip: vi.fn(),
    onDismiss: vi.fn(),
  };
}

function render(view: StepView, uiHandlers: UiHandlers): HTMLElement {
  const container = document.createElement('div');
  container.append(messageRenderer.render(view, uiHandlers));
  return container;
}

describe('messageRenderer', () => {
  it('renders tour progress and connects every action to its handler', () => {
    const uiHandlers = handlers();
    const view: StepView = {
      step,
      index: 1,
      total: 3,
      navigation: tooltipFlow.navigation(1, 3),
    };

    const container = render(view, uiHandlers);

    expect(container.querySelector('.tip__title')?.textContent).toBe('Заголовок');
    expect(container.querySelector('.tip__body')?.textContent).toBe('Содержимое');
    expect(container.querySelector('.tip__count')?.textContent).toBe('2 из 3');
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    buttons.find((button) => button.textContent === 'Назад')?.click();
    buttons.find((button) => button.textContent === 'Пропустить')?.click();
    buttons.find((button) => button.textContent === 'Далее')?.click();
    buttons.find((button) => button.getAttribute('aria-label') === 'Закрыть')?.click();
    expect(uiHandlers.onBack).toHaveBeenCalledOnce();
    expect(uiHandlers.onSkip).toHaveBeenCalledOnce();
    expect(uiHandlers.onNext).toHaveBeenCalledOnce();
    expect(uiHandlers.onDismiss).toHaveBeenCalledOnce();
  });

  it('renders standalone acknowledgement without tour controls', () => {
    const container = render(
      {
        step,
        index: 0,
        total: 1,
        navigation: standaloneFlow.navigation(0, 1),
      },
      handlers(),
    );

    expect(container.querySelector('.tip__count')).toBeNull();
    expect(container.querySelector('.btn--ghost')).toBeNull();
    expect(container.querySelector('.btn--primary')?.textContent).toBe('Понятно');
  });
});

describe('StepContentRegistry', () => {
  it('uses message for legacy steps without a kind', () => {
    const registry = new StepContentRegistry([messageRenderer], 'message');

    expect(registry.resolve(step)).toBe(messageRenderer);
  });

  it('rejects an explicit unknown content kind', () => {
    const registry = new StepContentRegistry([messageRenderer], 'message');

    expect(() => registry.resolve({...step, kind: 'question'})).toThrow(
      'Unknown step content kind: question',
    );
  });

  it('rejects duplicate renderer keys', () => {
    const duplicate: StepContentRenderer = {
      kind: 'message',
      render: () => document.createDocumentFragment(),
    };

    expect(() => new StepContentRegistry([messageRenderer, duplicate], 'message')).toThrow(
      'Duplicate step content renderer: message',
    );
  });
});
