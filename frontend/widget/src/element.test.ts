// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { scrollIntoView } from './element';

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

afterEach(() => {
  vi.useRealTimers();
});

describe('scrollIntoView', () => {
  it('treats subpixel movement as settled instead of waiting for the timeout', async () => {
    vi.useFakeTimers();
    let scrolling = false;
    let top = 100;
    const target = document.createElement('div');
    target.getBoundingClientRect = () => {
      if (!scrolling) return rect(1_000);
      top += 0.1;
      return rect(top);
    };
    target.scrollIntoView = vi.fn(() => {
      scrolling = true;
    });

    let resolved = false;
    const promise = scrollIntoView(target).then(() => {
      resolved = true;
    });

    await vi.advanceTimersByTimeAsync(200);

    expect(resolved).toBe(true);
    await promise;
  });
});
