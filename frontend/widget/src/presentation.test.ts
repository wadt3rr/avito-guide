// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createStandalonePresentation,
  createTooltipPresentation,
  type UiElements,
} from './presentation';

function elements(): UiElements {
  return {
    host: document.createElement('div'),
    catcher: document.createElement('div'),
    spot: document.createElement('div'),
    tip: document.createElement('div'),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('tooltip presentation', () => {
  it('configures target chrome and positions it against the visual viewport', () => {
    vi.stubGlobal('visualViewport', {
      width: 360,
      height: 640,
    });
    const ui = elements();
    const target = document.createElement('button');
    target.getBoundingClientRect = () => new DOMRect(40, 100, 120, 40);
    ui.tip.getBoundingClientRect = () => new DOMRect(0, 0, 200, 100);
    const presentation = createTooltipPresentation();

    presentation.configure(ui);
    presentation.position(ui, target);

    expect(ui.host.dataset.type).toBe('tooltip');
    expect(ui.catcher.className).toBe('catch catch--tooltip');
    expect(ui.catcher.style.pointerEvents).toBe('auto');
    expect(ui.spot.hidden).toBe(false);
    expect(ui.spot.style.top).toBe('94px');
    expect(ui.tip.dataset.placement).toBe('bottom');
    expect(ui.tip.style.top).toBe('152px');
  });
});

describe('standalone presentation', () => {
  it.each([
    ['modal', true, 'auto'],
    ['banner', false, 'none'],
  ] as const)('configures %s with its blocking policy', (type, blocking, pointerEvents) => {
    const ui = elements();
    const presentation = createStandalonePresentation(type, blocking);

    presentation.configure(ui);
    presentation.position(ui, null);

    expect(ui.host.dataset.type).toBe(type);
    expect(ui.catcher.className).toBe(`catch catch--${type}`);
    expect(ui.catcher.style.pointerEvents).toBe(pointerEvents);
    expect(ui.spot.hidden).toBe(true);
    expect(ui.tip.className).toBe(`tip tip--${type}`);
    expect(ui.tip.style.top).toBe('');
    expect(ui.tip.style.left).toBe('');
  });
});
