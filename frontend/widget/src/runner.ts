import type { Analytics } from './analytics';
import { resolveTarget, scrollIntoView } from './element';
import { getProgress, saveProgress } from './progress';
import type { Scenario } from './types';
import { Ui } from './ui';

type State = 'idle' | 'resolving' | 'showing' | 'finished' | 'aborted';

export class Runner {
  private state: State = 'idle';
  private index = 0;
  private ui: Ui | null = null;
  private pending: AbortController | null = null;

  constructor(
    private readonly scenario: Scenario,
    private readonly analytics: Analytics,
    private readonly onEnd: () => void,
  ) {
    this.onKeyDown = this.onKeyDown.bind(this);
  }

  async start(): Promise<void> {
    if (this.state !== 'idle') return;

    const saved = getProgress(this.scenario.id);
    if (saved?.finished) return;

    this.index = Math.min(saved?.step ?? 0, this.scenario.steps.length - 1);

    this.ui = new Ui({
      onNext: () => void this.advance('step_completed'),
      onBack: () => void this.back(),
      onSkip: () => void this.advance('step_skipped'),
      onDismiss: () => this.dismiss(),
    });
    document.addEventListener('keydown', this.onKeyDown);

    this.analytics.track('started', this.scenario.id, null, {
      resumed_at_step: this.index,
    });

    await this.enter(this.index);
  }

  private async enter(index: number): Promise<void> {
    if (this.state === 'finished' || this.state === 'aborted') return;

    const step = this.scenario.steps[index];
    if (!step) return this.finish();

    this.pending?.abort();
    this.pending = new AbortController();
    this.state = 'resolving';
    this.index = index;

    const target = await resolveTarget(
      step.selector,
      step.timeout_sec * 1000,
      this.pending.signal,
    );

    if (this.pending.signal.aborted) return;

    if (!target) {
      this.analytics.track('step_failed', this.scenario.id, step.id, {
        selector: step.selector,
        reason: 'target_not_found',
      });
      return this.skipUnresolvable(index);
    }

    await scrollIntoView(target);
    if (this.pending.signal.aborted) return;

    this.state = 'showing';
    saveProgress(this.scenario.id, index);
    this.analytics.track('step_shown', this.scenario.id, step.id);

    this.ui?.render(
      {
        step,
        index,
        total: this.scenario.steps.length,
        canGoBack: index > 0,
      },
      target,
    );
  }

  private async skipUnresolvable(index: number): Promise<void> {
    if (index + 1 >= this.scenario.steps.length) {
      this.analytics.track('dismissed', this.scenario.id, null, {
        reason: 'no_resolvable_steps',
      });
      return this.teardown('aborted');
    }
    await this.enter(index + 1);
  }

  private async advance(reason: 'step_completed' | 'step_skipped'): Promise<void> {
    if (this.state !== 'showing') return;

    const step = this.scenario.steps[this.index];
    if (step) this.analytics.track(reason, this.scenario.id, step.id);

    if (this.index + 1 >= this.scenario.steps.length) return this.finish();
    await this.enter(this.index + 1);
  }

  private async back(): Promise<void> {
    if (this.state !== 'showing' || this.index === 0) return;
    await this.enter(this.index - 1);
  }

  private finish(): void {
    this.analytics.track('finished', this.scenario.id, null);
    saveProgress(this.scenario.id, this.scenario.steps.length, true);
    this.teardown('finished');
  }

  stop(reason: string): void {
    if (this.state === 'finished' || this.state === 'aborted') return;

    const step = this.scenario.steps[this.index];
    this.analytics.track('dismissed', this.scenario.id, step?.id ?? null, {
      at_step: this.index,
      reason,
    });
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
}
