import type { PrimaryAction } from './flow';
import type { Step } from './types';
import type { StepView, UiHandlers } from './view';

export interface StepContentRenderer {
  readonly kind: string;
  render(view: StepView, handlers: UiHandlers): DocumentFragment;
}

export class StepContentRegistry {
  private readonly renderers = new Map<string, StepContentRenderer>();

  constructor(
    renderers: readonly StepContentRenderer[],
    private readonly defaultKind: string,
  ) {
    for (const renderer of renderers) {
      if (this.renderers.has(renderer.kind)) {
        throw new Error(`Duplicate step content renderer: ${renderer.kind}`);
      }
      this.renderers.set(renderer.kind, renderer);
    }

    if (!this.renderers.has(defaultKind)) {
      throw new Error(`Default step content renderer is missing: ${defaultKind}`);
    }
  }

  resolve(step: Step): StepContentRenderer {
    const kind = step.kind ?? this.defaultKind;
    const renderer = this.renderers.get(kind);
    if (!renderer) throw new Error(`Unknown step content kind: ${kind}`);
    return renderer;
  }
}

export const messageRenderer: StepContentRenderer = {
  kind: 'message',
  render(view, handlers) {
    const fragment = document.createDocumentFragment();

    const head = el('div', 'tip__head');
    head.append(el('div', 'tip__title', view.step.title));
    const close = button('×', 'tip__close', handlers.onDismiss);
    close.setAttribute('aria-label', 'Закрыть');
    head.append(close);

    const foot = el('div', 'tip__foot');
    const actions = el('div', 'tip__actions');

    if (view.navigation.showProgress) {
      foot.append(el('div', 'tip__count', `${view.index + 1} из ${view.total}`));
    }
    if (view.navigation.canGoBack) {
      actions.append(button('Назад', 'btn btn--ghost', handlers.onBack));
    }
    if (view.navigation.canSkip) {
      actions.append(button('Пропустить', 'btn btn--ghost', handlers.onSkip));
    }

    actions.append(
      button(primaryLabel(view.navigation.primaryAction), 'btn btn--primary', handlers.onNext),
    );
    foot.append(actions);
    fragment.append(head, el('div', 'tip__body', view.step.content), foot);
    return fragment;
  },
};

export const defaultStepContentRegistry = new StepContentRegistry(
  [messageRenderer],
  'message',
);

function primaryLabel(action: PrimaryAction): string {
  switch (action) {
    case 'next':
      return 'Далее';
    case 'complete':
      return 'Готово';
    case 'acknowledge':
      return 'Понятно';
  }
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = className;
  node.textContent = label;
  node.addEventListener('click', onClick);
  return node;
}
