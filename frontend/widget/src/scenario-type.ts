import type { ScenarioType } from './types';

const SCENARIO_TYPES = new Set<ScenarioType>(['tooltip', 'modal', 'banner']);

export function normalizeScenarioType(value: unknown): ScenarioType {
  return typeof value === 'string' && SCENARIO_TYPES.has(value as ScenarioType)
    ? (value as ScenarioType)
    : 'tooltip';
}
