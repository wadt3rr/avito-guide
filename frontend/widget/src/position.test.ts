import { describe, expect, it } from 'vitest';
import { computePosition } from './position';

describe('computePosition', () => {
  it('prefers bottom placement when there is enough space', () => {
    const target = new DOMRect(100, 100, 80, 40);
    const tip = { width: 120, height: 60 };
    const viewport = { width: 1200, height: 800 };

    const result = computePosition(target, tip, viewport);

    expect(result.placement).toBe('bottom');
    expect(result.top).toBeGreaterThan(target.bottom);
  });

  it('clamps the position to the viewport bounds', () => {
    const target = new DOMRect(10, 10, 80, 40);
    const tip = { width: 250, height: 250 };
    const viewport = { width: 200, height: 200 };

    const result = computePosition(target, tip, viewport);
    const maxLeft = Math.max(12, viewport.width - tip.width - 12);
    const maxTop = Math.max(12, viewport.height - tip.height - 12);

    expect(result.left).toBeGreaterThanOrEqual(12);
    expect(result.top).toBeGreaterThanOrEqual(12);
    expect(result.left).toBeLessThanOrEqual(maxLeft);
    expect(result.top).toBeLessThanOrEqual(maxTop);
  });
});
