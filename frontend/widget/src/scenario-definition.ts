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

  constructor(definitions: readonly ScenarioDefinition[]) {
    for (const definition of definitions) {
      if (this.definitions.has(definition.type)) {
        throw new Error(`Duplicate scenario definition: ${definition.type}`);
      }
      this.definitions.set(definition.type, definition);
    }

  }

  resolve(type: ScenarioType): ScenarioDefinition {
    const definition = this.definitions.get(type);
    if (!definition) throw new Error(`Unknown scenario definition: ${type}`);
    return definition;
  }
}
