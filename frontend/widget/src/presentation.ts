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
  configure(elements: UiElements): void;
  position(elements: UiElements, target: HTMLElement | null): void;
}

function configureShell(elements: UiElements, type: ScenarioType, blocking: boolean): void {
  elements.host.dataset.type = type;
  elements.catcher.className = `catch catch--${type}`;
  elements.catcher.style.pointerEvents = blocking ? 'auto' : 'none';
  elements.tip.className = `tip tip--${type}`;
}

export function createTooltipPresentation(): ScenarioPresentation {
  return {
    type: 'tooltip',
    configure(elements) {
      configureShell(elements, 'tooltip', true);
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
    configure(elements) {
      configureShell(elements, type, blocking);
      elements.spot.hidden = true;
    },
    position() {
      // Standalone presentations are positioned entirely by CSS.
    },
  };
}
