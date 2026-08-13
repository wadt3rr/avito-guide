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

export class Ui {
  private readonly host: HTMLElement;
  private readonly root: ShadowRoot;
  private readonly catcher: HTMLElement;
  private readonly spot: HTMLElement;
  private readonly tip: HTMLElement;
  private target: HTMLElement | null = null;
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
    cancelAnimationFrame(this.frame);
    window.removeEventListener('scroll', this.onReflow, true);
    window.removeEventListener('resize', this.onReflow);
    window.visualViewport?.removeEventListener('resize', this.onReflow);
    window.visualViewport?.removeEventListener('scroll', this.onReflow);
    this.host.remove();
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
