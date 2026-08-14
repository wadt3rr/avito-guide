import { computePosition } from './position';
import type { ScenarioType } from './types';

export interface UiElements {
  host: HTMLElement;
  catcher: HTMLElement;
  spot: HTMLElement;
  tip: HTMLElement;
}

export interface ScenarioPresentation {
  readonly type: ScenarioType;
  readonly focusMode?: 'initial' | 'none' | 'trap';
  configure(elements: UiElements): void;
  position(elements: UiElements, target: HTMLElement | null): void;
}

function configureShell(
  elements: UiElements,
  type: ScenarioType,
  blocking: boolean,
  focusMode: ScenarioPresentation['focusMode'],
): void {
  elements.host.dataset.type = type;
  elements.catcher.className = `catch catch--${type}`;
  elements.catcher.style.pointerEvents = blocking ? 'auto' : 'none';
  elements.tip.className = `tip tip--${type}`;
  elements.tip.removeAttribute('aria-modal');
  elements.tip.removeAttribute('aria-labelledby');

  if (type === 'banner') {
    elements.tip.setAttribute('role', 'region');
  } else {
    elements.tip.setAttribute('role', 'dialog');
  }
  elements.tip.removeAttribute('tabindex');

  if (focusMode === 'trap') elements.tip.setAttribute('aria-modal', 'true');
}

export function createTooltipPresentation(): ScenarioPresentation {
  return {
    type: 'tooltip',
    focusMode: 'initial',
    configure(elements) {
      configureShell(elements, 'tooltip', true, 'initial');
      elements.spot.hidden = false;
    },
    position(elements, target) {
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const pad = 6;
      elements.spot.style.top = `${rect.top - pad}px`;
      elements.spot.style.left = `${rect.left - pad}px`;
      elements.spot.style.width = `${rect.width + pad * 2}px`;
      elements.spot.style.height = `${rect.height + pad * 2}px`;

      const tipRect = elements.tip.getBoundingClientRect();
      const viewport = window.visualViewport;
      const position = computePosition(
        rect,
        { width: tipRect.width || 320, height: tipRect.height || 140 },
        {
          width: viewport?.width ?? window.innerWidth,
          height: viewport?.height ?? window.innerHeight,
        },
      );

      elements.tip.style.top = `${position.top}px`;
      elements.tip.style.left = `${position.left}px`;
      elements.tip.dataset.placement = position.placement;
    },
  };
}

export function createStandalonePresentation(
  type: Exclude<ScenarioType, 'tooltip'>,
  blocking: boolean,
): ScenarioPresentation {
  return {
    type,
    focusMode: type === 'modal' ? 'trap' : 'none',
    configure(elements) {
      configureShell(elements, type, blocking, type === 'modal' ? 'trap' : 'none');
      elements.spot.hidden = true;
    },
    position() {
      // Standalone presentations are positioned entirely by CSS.
    },
  };
}
