import { describe, expect, it } from 'vitest';
import { standaloneFlow, tooltipFlow } from './flow';
import type { Step } from './types';

const step: Step = {
  id: 'step-1',
  step_order: 1,
  title: 'Title',
  content: 'Content',
  selector: '#target',
  action_type: 'next',
  timeout_sec: 0,
};

describe('tooltipFlow', () => {
  it('resumes saved progress and traverses every step', () => {
    expect(tooltipFlow.initialIndex(1, 3)).toBe(1);
    expect(tooltipFlow.viewTotal(3)).toBe(3);
    expect(tooltipFlow.requiresTarget(step)).toBe(true);
    expect(tooltipFlow.previousIndex(1)).toBe(0);
    expect(tooltipFlow.nextIndex(1, 3)).toBe(2);
    expect(tooltipFlow.nextIndex(2, 3)).toBeNull();
  });

  it('describes tour controls without exposing a scenario type', () => {
    expect(tooltipFlow.navigation(0, 2)).toEqual({
      canGoBack: false,
      canSkip: true,
      primaryAction: 'next',
      showProgress: true,
    });
    expect(tooltipFlow.navigation(1, 2).primaryAction).toBe('complete');
  });
});

describe('standaloneFlow', () => {
  it('starts from the first step and completes after it', () => {
    expect(standaloneFlow.initialIndex(2, 4)).toBe(0);
    expect(standaloneFlow.viewTotal(4)).toBe(1);
    expect(standaloneFlow.requiresTarget(step)).toBe(false);
    expect(standaloneFlow.previousIndex(0)).toBeNull();
    expect(standaloneFlow.nextIndex(0, 4)).toBeNull();
    expect(standaloneFlow.navigation(0, 4)).toEqual({
      canGoBack: false,
      canSkip: false,
      primaryAction: 'acknowledge',
      showProgress: false,
    });
  });
});
