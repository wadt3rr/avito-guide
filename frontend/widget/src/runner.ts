import type {Analytics} from './analytics';
import {createDefaultScenarioRegistry, defaultStepContentRegistry} from './composition';
import {resolveTarget, scrollIntoView} from './element';
import {getProgress, saveProgress} from './progress';
import type {ScenarioDefinition, ScenarioDefinitionRegistry} from './scenario-definition';
import type {StepContentRegistry} from './step-content';
import type {Scenario, Step} from './types';
import {Ui} from './ui';

type State = 'idle' | 'resolving' | 'showing' | 'finished' | 'aborted';

export interface RunnerOptions {
  mode?: 'live' | 'preview';
  definitions?: ScenarioDefinitionRegistry;
  content?: StepContentRegistry;
}

export class Runner {
  private state: State = 'idle';
  private index = 0;
  private ui: Ui | null = null;
  private pending: AbortController | null = null;
  private readonly definition: ScenarioDefinition;
  private readonly content: StepContentRegistry;
  private readonly isPreview: boolean;

  constructor(
    private readonly scenario: Scenario,
    private readonly analytics: Analytics,
    options: RunnerOptions = {},
    private readonly onEnd: () => void = () => {},
  ) {
    this.definition = (options.definitions ?? createDefaultScenarioRegistry()).resolve(
      scenario.type,
    );
    this.content = options.content ?? defaultStepContentRegistry;
    this.isPreview = options.mode === 'preview';
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  async start(): Promise<void> {
    if (this.state !== 'idle') return;
    const saved = this.isPreview ? null : getProgress(this.scenario.id);
    if (saved?.finished) return;

    this.index = this.definition.flow.initialIndex(saved?.step, this.scenario.steps.length);

    this.ui = new Ui({
      onNext: () => void this.advance('step_completed'),
      onBack: () => void this.back(),
      onSkip: () => void this.advance('step_skipped'),
      onDismiss: () => this.dismiss(),
    }, this.definition.presentation, this.content);
    document.addEventListener('keydown', this.onKeyDown);
    this.track('scenario_started', null, {resumed_at_step: this.index});
    await this.enter(this.index);
  }

  private async enter(index: number): Promise<void> {
    if (this.state === 'finished' || this.state === 'aborted') return;
    const step = this.scenario.steps[index];
    if (!step) return this.finish();

    if (this.state === 'showing') this.ui?.prepareForTransition();
    this.pending?.abort();
    this.pending = null;
    this.index = index;

    if (!this.definition.flow.requiresTarget(step)) {
      this.show(step);
      return;
    }

    const controller = new AbortController();
    this.pending = controller;
    this.state = 'resolving';

    const target = await resolveTarget(
      step.selector ?? '',
      step.timeout_sec * 1000,
      controller.signal,
    );
    if (controller.signal.aborted) return;

    if (!target) {
      this.track('step_failed', step.id, {
        selector: step.selector ?? '',
        reason: 'target_not_found',
      });
      return this.skipUnresolvable(index);
    }

    await scrollIntoView(target);
    if (controller.signal.aborted) return;
    this.show(step, target);
  }

  private show(step: Step, target?: HTMLElement): void {
    this.state = 'showing';
    this.saveProgress(this.index);
    this.track('step_shown', step.id);
    this.ui?.render({
      step,
      index: this.index,
      total: this.definition.flow.viewTotal(this.scenario.steps.length),
      navigation: this.definition.flow.navigation(this.index, this.scenario.steps.length),
    }, target);
  }

  private async skipUnresolvable(index: number): Promise<void> {
    const nextIndex = this.definition.flow.nextIndex(index, this.scenario.steps.length);
    if (nextIndex === null) {
      this.track('scenario_dismissed', null, {reason: 'no_resolvable_steps'});
      return this.teardown('aborted');
    }
    await this.enter(nextIndex);
  }

  private async advance(reason: 'step_completed' | 'step_skipped'): Promise<void> {
    if (this.state !== 'showing') return;
    const step = this.scenario.steps[this.index];
    if (step) this.track(reason, step.id);
    const nextIndex = this.definition.flow.nextIndex(this.index, this.scenario.steps.length);
    if (nextIndex === null) return this.finish();
    await this.enter(nextIndex);
  }

  private async back(): Promise<void> {
    if (this.state !== 'showing') return;
    const previousIndex = this.definition.flow.previousIndex(this.index);
    if (previousIndex === null) return;
    await this.enter(previousIndex);
  }

  private finish(): void {
    this.track('scenario_finished', null);
    this.saveProgress(this.scenario.steps.length, true);
    this.teardown('finished');
  }

  stop(reason = 'host_navigation'): void {
    if (this.state === 'finished' || this.state === 'aborted') return;
    if (reason === 'user_closed') {
      const step = this.scenario.steps[this.index];
      this.track('scenario_dismissed', step?.id ?? null, {at_step: this.index, reason});
    }
    this.teardown('aborted');
  }

  private dismiss(): void {
    this.stop('user_closed');
  }

  private teardown(state: State): void {
    this.state = state;
    this.pending?.abort();
    document.removeEventListener('keydown', this.onKeyDown);
    this.ui?.destroy();
    this.ui = null;
    this.onEnd();
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.dismiss();
  }

  private track(type: Parameters<Analytics['track']>[0], stepId: string | null, meta?: Record<string, unknown>): void {
    if (this.isPreview) return;
    this.analytics.track(type, this.scenario.id, stepId, meta);
  }

  private saveProgress(step: number, finished = false): void {
    if (this.isPreview) return;
    saveProgress(this.scenario.id, step, finished);
  }
}
