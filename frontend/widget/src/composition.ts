import { standaloneFlow, tooltipFlow } from './flow';
import {
  createStandalonePresentation,
  createTooltipPresentation,
} from './presentation';
import { ScenarioDefinitionRegistry } from './scenario-definition';

export { defaultStepContentRegistry } from './step-content';

export function createDefaultScenarioRegistry(): ScenarioDefinitionRegistry {
  return new ScenarioDefinitionRegistry([
    {
      type: 'tooltip',
      flow: tooltipFlow,
      presentation: createTooltipPresentation(),
    },
    {
      type: 'modal',
      flow: standaloneFlow,
      presentation: createStandalonePresentation('modal', true),
    },
    {
      type: 'banner',
      flow: standaloneFlow,
      presentation: createStandalonePresentation('banner', false),
    },
  ]);
}
