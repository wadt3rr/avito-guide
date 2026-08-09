import { describe, expect, it } from 'vitest';
import { normalizeScenarioType } from './scenario-type';

describe('normalizeScenarioType', () => {
  it.each(['tooltip', 'modal', 'banner'] as const)('preserves the supported %s type', (type) => {
    expect(normalizeScenarioType(type)).toBe(type);
  });

  it.each([undefined, null, '', 'carousel'])('falls back to tooltip for %s', (type) => {
    expect(normalizeScenarioType(type)).toBe('tooltip');
  });
});
