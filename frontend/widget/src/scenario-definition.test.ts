import { describe, expect, it } from 'vitest';
import { standaloneFlow, tooltipFlow } from './flow';
import {
  ScenarioDefinitionRegistry,
  type ScenarioDefinition,
} from './scenario-definition';
import type { ScenarioPresentation } from './presentation';
import type { ScenarioType } from './types';

function definition(type: ScenarioType): ScenarioDefinition {
  const presentation: ScenarioPresentation = {
    type,
    configure: () => undefined,
    position: () => undefined,
  };
  return {
    type,
    flow: type === 'tooltip' ? tooltipFlow : standaloneFlow,
    presentation,
  };
}

describe('ScenarioDefinitionRegistry', () => {
  it('resolves registered definitions and falls back to tooltip', () => {
    const tooltip = definition('tooltip');
    const modal = definition('modal');
    const registry = new ScenarioDefinitionRegistry([tooltip, modal]);

    expect(registry.resolve('modal')).toBe(modal);
    expect(registry.resolve(undefined)).toBe(tooltip);
    expect(registry.resolve('future-variant')).toBe(tooltip);
  });

  it('rejects duplicate definitions instead of silently replacing one', () => {
    expect(
      () => new ScenarioDefinitionRegistry([definition('tooltip'), definition('tooltip')]),
    ).toThrow('Duplicate scenario definition: tooltip');
  });

  it('requires a tooltip fallback definition', () => {
    expect(() => new ScenarioDefinitionRegistry([definition('modal')])).toThrow(
      'Tooltip scenario definition is required',
    );
  });
});
