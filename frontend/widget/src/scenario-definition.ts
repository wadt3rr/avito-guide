import type { ScenarioFlow } from './flow';
import type { ScenarioPresentation } from './presentation';
import type { ScenarioType } from './types';

export interface ScenarioDefinition {
  readonly type: ScenarioType;
  readonly flow: ScenarioFlow;
  readonly presentation: ScenarioPresentation;
}

export class ScenarioDefinitionRegistry {
  private readonly definitions = new Map<ScenarioType, ScenarioDefinition>();
  private readonly fallback: ScenarioDefinition;

  constructor(definitions: readonly ScenarioDefinition[]) {
    for (const definition of definitions) {
      if (this.definitions.has(definition.type)) {
        throw new Error(`Duplicate scenario definition: ${definition.type}`);
      }
      this.definitions.set(definition.type, definition);
    }

    const fallback = this.definitions.get('tooltip');
    if (!fallback) throw new Error('Tooltip scenario definition is required');
    this.fallback = fallback;
  }

  resolve(type: unknown): ScenarioDefinition {
    return typeof type === 'string'
      ? (this.definitions.get(type as ScenarioType) ?? this.fallback)
      : this.fallback;
  }
}
