import { describe, expect, it } from 'vitest';
import { createDefaultScenarioRegistry, defaultStepContentRegistry } from './composition';
import { standaloneFlow, tooltipFlow } from './flow';

describe('default widget composition', () => {
  it('registers the current scenario definitions with their existing flows', () => {
    const registry = createDefaultScenarioRegistry();

    expect(registry.resolve('tooltip').flow).toBe(tooltipFlow);
    expect(registry.resolve('modal').flow).toBe(standaloneFlow);
    expect(registry.resolve('banner').flow).toBe(standaloneFlow);
    expect(registry.resolve('carousel').type).toBe('tooltip');
  });

  it('provides the message renderer for legacy steps', () => {
    expect(
      defaultStepContentRegistry.resolve({
        id: 'step-1',
        step_order: 1,
        title: 'Title',
        content: 'Content',
        action_type: 'next',
        timeout_sec: 0,
      }).kind,
    ).toBe('message');
  });
});
