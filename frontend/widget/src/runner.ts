import type { Analytics } from './analytics';
import { resolveTarget, scrollIntoView } from './element';
import { getProgress, saveProgress } from './progress';
import { normalizeScenarioType } from './scenario-type';
import type { Scenario, ScenarioType, Step } from './types';
import { Ui } from './ui';

/**
 * Прохождение сценария как явная машина состояний.
 *
 * Альтернатива — набор флагов вида isVisible/isWaiting/currentStep — на третьем
 * сценарии превращается в кашу и даёт кривую воронку: события начинают
 * отправляться дважды или не отправляться вовсе. Здесь каждый переход
 * порождает ровно одно событие.
 */
type State = 'idle' | 'resolving' | 'showing' | 'finished' | 'aborted';

export interface RunnerOptions {
  mode?: 'live' | 'preview';
}

export class Runner {
  private state: State = 'idle';
  private index = 0;
  private ui: Ui | null = null;
  private pending: AbortController | null = null;
  private readonly type: ScenarioType;
  private readonly isPreview: boolean;

  constructor(
    private readonly scenario: Scenario,
    private readonly analytics: Analytics,
    options: RunnerOptions = {},
  ) {
    this.type = normalizeScenarioType(scenario.type);
    this.isPreview = options.mode === 'preview';
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  async start(): Promise<void> {
    if (this.state !== 'idle') return;

    const saved = this.isPreview ? null : getProgress(this.scenario.id);
    if (saved?.finished) return;

    this.index =
      this.type === 'tooltip' ? Math.min(saved?.step ?? 0, this.scenario.steps.length - 1) : 0;

    this.ui = new Ui({
      onNext: () => void this.advance('step_completed'),
      onBack: () => void this.back(),
      onSkip: () => void this.advance('step_skipped'),
      onDismiss: () => this.dismiss(),
    });
    document.addEventListener('keydown', this.onKeyDown);

    this.track('scenario_started', null, {
      resumed_at_step: this.index,
    });

    await this.enter(this.index);
  }

  /** Stops rendering because the host page changed, without treating it as a user dismissal. */
  stop(): void {
    if (this.state === 'finished' || this.state === 'aborted') return;
    this.teardown('aborted');
  }

  /** Показывает шаг. Если цель не нашлась — честно сообщает и идёт дальше. */
  private async enter(index: number): Promise<void> {
    if (this.state === 'finished' || this.state === 'aborted') return;

    const step = this.scenario.steps[index];
    if (!step) return this.finish();

    if (this.type !== 'tooltip') {
      this.showStandalone(step);
      return;
    }

    if (this.state === 'showing') this.ui?.prepareForTransition();
    this.pending?.abort();
    this.pending = new AbortController();
    this.state = 'resolving';
    this.index = index;

    const target = await resolveTarget(
      step.selector ?? '',
      step.timeout_sec * 1000,
      this.pending.signal,
    );

    if (this.pending.signal.aborted) return;

    if (!target) {
      // Единственный сигнал команде, что сценарий сломан вёрсткой.
      this.track('step_failed', step.id, {
        selector: step.selector ?? '',
        reason: 'target_not_found',
      });
      return this.skipUnresolvable(index);
    }

    await scrollIntoView(target);
    if (this.pending.signal.aborted) return;

    this.state = 'showing';
    this.saveProgress(index);
    this.track('step_shown', step.id);

    this.ui?.render(
      {
        type: this.type,
        step,
        index,
        total: this.scenario.steps.length,
        canGoBack: index > 0,
      },
      target,
    );
  }

  private showStandalone(step: Step): void {
    this.state = 'showing';
    this.index = 0;
    this.saveProgress(0);
    this.track('step_shown', step.id);
    this.ui?.render({
      type: this.type,
      step,
      index: 0,
      total: 1,
      canGoBack: false,
    });
  }

  /** Ни один шаг не нашёлся до конца сценария — показывать больше нечего. */
  private async skipUnresolvable(index: number): Promise<void> {
    if (index + 1 >= this.scenario.steps.length) {
      this.track('scenario_dismissed', null, {
        reason: 'no_resolvable_steps',
      });
      return this.teardown('aborted');
    }
    await this.enter(index + 1);
  }

  private async advance(reason: 'step_completed' | 'step_skipped'): Promise<void> {
    if (this.state !== 'showing') return;

    const step = this.scenario.steps[this.index];
    if (step) this.track(reason, step.id);

    if (this.type !== 'tooltip' || this.index + 1 >= this.scenario.steps.length) {
      return this.finish();
    }
    await this.enter(this.index + 1);
  }

  private async back(): Promise<void> {
    if (this.state !== 'showing' || this.index === 0) return;
    await this.enter(this.index - 1);
  }

  private finish(): void {
    this.track('scenario_finished', null);
    this.saveProgress(this.scenario.steps.length, true);
    this.teardown('finished');
  }

  private dismiss(): void {
    if (this.state === 'finished' || this.state === 'aborted') return;

    const step = this.scenario.steps[this.index];
    this.track('scenario_dismissed', step?.id ?? null, {
      at_step: this.index,
    });
    this.teardown('aborted');
  }

  private teardown(state: State): void {
    this.state = state;
    this.pending?.abort();
    document.removeEventListener('keydown', this.onKeyDown);
    this.ui?.destroy();
    this.ui = null;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.dismiss();
  }

  private track(
    type: Parameters<Analytics['track']>[0],
    stepId: string | null,
    meta?: Record<string, unknown>,
  ): void {
    if (this.isPreview) return;
    this.analytics.track(type, this.scenario.id, stepId, meta);
  }

  private saveProgress(step: number, finished = false): void {
    if (this.isPreview) return;
    saveProgress(this.scenario.id, step, finished);
  }
}
