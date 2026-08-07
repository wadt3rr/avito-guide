import { computePosition } from './position';
import { STYLES } from './styles';
import type { Step } from './types';

export interface StepView {
  step: Step;
  index: number;
  total: number;
  canGoBack: boolean;
}

export interface UiHandlers {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onDismiss: () => void;
}

const HOST_ID = 'avito-onboarding-root';

export class Ui {
  private readonly host: HTMLElement;
  private readonly root: ShadowRoot;
  private readonly spot: HTMLElement;
  private readonly tip: HTMLElement;
  private target: HTMLElement | null = null;
  private frame = 0;

  constructor(private readonly handlers: UiHandlers) {
    this.host = document.createElement('div');
    this.host.id = HOST_ID;
    this.host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none';
    this.root = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = STYLES;

    const catcher = document.createElement('div');
    catcher.className = 'catch';
    catcher.style.pointerEvents = 'auto';
    catcher.addEventListener('click', () => this.handlers.onDismiss());

    this.spot = document.createElement('div');
    this.spot.className = 'spot';

    this.tip = document.createElement('div');
    this.tip.className = 'tip';
    this.tip.style.pointerEvents = 'auto';

    this.root.append(style, catcher, this.spot, this.tip);
    document.body.appendChild(this.host);

    this.onReflow = this.onReflow.bind(this);
    window.addEventListener('scroll', this.onReflow, true);
    window.addEventListener('resize', this.onReflow);
  }

  render(view: StepView, target: HTMLElement): void {
    this.target = target;
    this.tip.dataset.ready = '0';
    this.tip.replaceChildren(this.buildTip(view));
    this.reposition();

    const reveal = () => {
      this.reposition();
      this.tip.dataset.ready = '1';
    };
    requestAnimationFrame(reveal);
    setTimeout(reveal, 50);
  }

  destroy(): void {
    cancelAnimationFrame(this.frame);
    window.removeEventListener('scroll', this.onReflow, true);
    window.removeEventListener('resize', this.onReflow);
    this.host.remove();
  }

  private onReflow(): void {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.reposition());
  }

  private reposition(): void {
    if (!this.target) return;

    const rect = this.target.getBoundingClientRect();
    const pad = 6;

    this.spot.style.top = `${rect.top - pad}px`;
    this.spot.style.left = `${rect.left - pad}px`;
    this.spot.style.width = `${rect.width + pad * 2}px`;
    this.spot.style.height = `${rect.height + pad * 2}px`;

    const tipRect = this.tip.getBoundingClientRect();
    const position = computePosition(
      rect,
      { width: tipRect.width || 320, height: tipRect.height || 140 },
      { width: window.innerWidth, height: window.innerHeight },
    );

    this.tip.style.top = `${position.top}px`;
    this.tip.style.left = `${position.left}px`;
    this.tip.dataset.placement = position.placement;
  }

  private buildTip(view: StepView): DocumentFragment {
    const fragment = document.createDocumentFragment();

    const head = el('div', 'tip__head');
    head.append(el('div', 'tip__title', view.step.title));
    const close = el('button', 'tip__close', '×') as HTMLButtonElement;
    close.type = 'button';
    close.setAttribute('aria-label', 'Закрыть');
    close.addEventListener('click', this.handlers.onDismiss);
    head.append(close);

    const foot = el('div', 'tip__foot');
    foot.append(el('div', 'tip__count', `${view.index + 1} из ${view.total}`));

    const actions = el('div', 'tip__actions');
    if (view.canGoBack) {
      actions.append(button('Назад', 'btn--ghost', this.handlers.onBack));
    }
    actions.append(button('Пропустить', 'btn--ghost', this.handlers.onSkip));
    actions.append(
      button(
        view.index === view.total - 1 ? 'Готово' : 'Далее',
        'btn--primary',
        this.handlers.onNext,
      ),
    );
    foot.append(actions);

    fragment.append(head, el('div', 'tip__body', view.step.content), foot);
    return fragment;
  }
}

function el(tag: string, className: string, text?: string): HTMLElement {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label: string, modifier: string, onClick: () => void): HTMLButtonElement {
  const node = document.createElement('button');
  node.type = 'button';
  node.className = `btn ${modifier}`;
  node.textContent = label;
  node.addEventListener('click', onClick);
  return node;
}
