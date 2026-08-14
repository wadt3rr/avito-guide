import {
  createTooltipPresentation,
  type ScenarioPresentation,
  type UiElements,
} from './presentation';
import { defaultStepContentRegistry, type StepContentRegistry } from './step-content';
import { STYLES } from './styles';
import type { StepView, UiHandlers } from './view';

export type { StepView, UiHandlers } from './view';

const HOST_ID = 'avito-onboarding-root';
const TITLE_ID = `${HOST_ID}-title`;
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export class Ui {
  private readonly host: HTMLElement;
  private readonly root: ShadowRoot;
  private readonly catcher: HTMLElement;
  private readonly spot: HTMLElement;
  private readonly tip: HTMLElement;
  private target: HTMLElement | null = null;
  private returnFocus: HTMLElement | null = null;
  private readonly inertElements = new Map<HTMLElement, boolean>();
  private previousBodyOverflow: string | null = null;
  private frame = 0;
  private renderVersion = 0;

  constructor(
    private readonly handlers: UiHandlers,
    private readonly presentation: ScenarioPresentation = createTooltipPresentation(),
    private readonly content: StepContentRegistry = defaultStepContentRegistry,
  ) {
    this.host = document.createElement('div');
    this.host.id = HOST_ID;
    this.host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none';
    this.root = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = STYLES;

    this.catcher = document.createElement('div');
    this.catcher.className = 'catch';
    this.catcher.style.pointerEvents = 'auto';
    this.catcher.addEventListener('click', () => this.handlers.onDismiss());

    this.spot = document.createElement('div');
    this.spot.className = 'spot';

    this.tip = document.createElement('div');
    this.tip.className = 'tip';
    this.tip.style.pointerEvents = 'auto';
    this.tip.addEventListener('keydown', (event) => this.onTipKeyDown(event));

    this.root.append(style, this.catcher, this.spot, this.tip);
    document.body.appendChild(this.host);

    this.onReflow = this.onReflow.bind(this);
    window.addEventListener('scroll', this.onReflow, true);
    window.addEventListener('resize', this.onReflow);
    window.visualViewport?.addEventListener('resize', this.onReflow);
    window.visualViewport?.addEventListener('scroll', this.onReflow);
  }

  render(view: StepView, target?: HTMLElement): void {
    const renderVersion = ++this.renderVersion;
    this.target = target ?? null;
    this.tip.style.removeProperty('visibility');
    this.tip.style.removeProperty('top');
    this.tip.style.removeProperty('left');
    this.tip.removeAttribute('data-placement');
    this.tip.dataset.ready = '0';
    this.presentation.configure(this.elements());
    this.tip.replaceChildren(this.content.resolve(view.step).render(view, this.handlers));
    const title = this.tip.querySelector<HTMLElement>('.tip__title');
    if (title) {
      title.id = TITLE_ID;
      this.tip.setAttribute('aria-labelledby', TITLE_ID);
    }
    this.focusPresentation();
    this.reposition();

    const reveal = () => {
      if (renderVersion !== this.renderVersion) return;
      this.reposition();
      this.tip.dataset.ready = '1';
    };
    requestAnimationFrame(reveal);
    setTimeout(reveal, 50);
  }

  /** Stops the old step from following its target while the page scrolls to the next one. */
  prepareForTransition(): void {
    this.renderVersion += 1;
    this.target = null;
    this.tip.dataset.ready = '0';
    this.tip.style.visibility = 'hidden';
    this.spot.hidden = true;
  }

  destroy(): void {
    this.renderVersion += 1;
    cancelAnimationFrame(this.frame);
    window.removeEventListener('scroll', this.onReflow, true);
    window.removeEventListener('resize', this.onReflow);
    window.visualViewport?.removeEventListener('resize', this.onReflow);
    window.visualViewport?.removeEventListener('scroll', this.onReflow);
    this.restoreModalBackground();
    this.host.remove();
    if (this.returnFocus?.isConnected) this.returnFocus.focus({preventScroll: true});
  }

  private focusPresentation(): void {
    if (this.presentation.focusMode === 'none') return;

    if (!this.returnFocus) {
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && activeElement !== this.host) {
        this.returnFocus = activeElement;
      }
    }
    if (this.presentation.focusMode === 'trap') this.disableModalBackground();
    const initialFocus = this.tip.querySelector<HTMLElement>('.btn--primary')
      ?? this.tip.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    initialFocus?.focus({preventScroll: true});
  }

  private disableModalBackground(): void {
    if (this.previousBodyOverflow !== null) return;

    this.previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    for (const child of Array.from(document.body.children)) {
      if (child === this.host || !(child instanceof HTMLElement)) continue;
      this.inertElements.set(child, child.inert);
      child.inert = true;
    }
  }

  private restoreModalBackground(): void {
    if (this.previousBodyOverflow === null) return;

    document.body.style.overflow = this.previousBodyOverflow;
    this.previousBodyOverflow = null;
    this.inertElements.forEach((wasInert, element) => {
      element.inert = wasInert;
    });
    this.inertElements.clear();
  }

  private onTipKeyDown(event: KeyboardEvent): void {
    if (event.key !== 'Tab' || this.presentation.focusMode !== 'trap') return;

    const focusable = Array.from(this.tip.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) {
      event.preventDefault();
      return;
    }

    const activeElement = this.root.activeElement;
    if (event.shiftKey && (activeElement === first || activeElement === this.tip)) {
      event.preventDefault();
      last.focus({preventScroll: true});
    } else if (!event.shiftKey && activeElement === last) {
      event.preventDefault();
      first.focus({preventScroll: true});
    }
  }

  private onReflow(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.reposition();
    });
  }

  private reposition(): void {
    this.presentation.position(this.elements(), this.target);
  }

  private elements(): UiElements {
    return {
      host: this.host,
      catcher: this.catcher,
      spot: this.spot,
      tip: this.tip,
    };
  }

}
