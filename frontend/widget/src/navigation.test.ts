// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { watchPathname } from './navigation';

const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

afterEach(() => {
  history.pushState = originalPushState;
  history.replaceState = originalReplaceState;
  originalReplaceState.call(history, null, '', '/');
});

describe('watchPathname', () => {
  it('notifies for SPA pathname and query changes', () => {
    const onChange = vi.fn();
    const stop = watchPathname(onChange);

    history.pushState(null, '', '/my');
    history.pushState(null, '', '/my?tab=active');
    history.replaceState(null, '', '/orders');

    expect(onChange).toHaveBeenCalledTimes(3);
    stop();
  });

  it('notifies when browser navigation changes the pathname', () => {
    originalReplaceState.call(history, null, '', '/create');
    const onChange = vi.fn();
    const stop = watchPathname(onChange);

    originalReplaceState.call(history, null, '', '/my');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(onChange).toHaveBeenCalledTimes(1);
    stop();
  });

  it('restores the History API when observation stops', () => {
    const onChange = vi.fn();
    const stop = watchPathname(onChange);
    stop();

    expect(history.pushState).toBe(originalPushState);
    expect(history.replaceState).toBe(originalReplaceState);
  });
});
