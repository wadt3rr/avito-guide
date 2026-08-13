import type { Step } from './types';

export type PrimaryAction = 'next' | 'complete' | 'acknowledge';

export interface StepNavigation {
  canGoBack: boolean;
  canSkip: boolean;
  primaryAction: PrimaryAction;
  showProgress: boolean;
}

export interface ScenarioFlow {
  initialIndex(savedStep: number | undefined, stepCount: number): number;
  viewTotal(stepCount: number): number;
  requiresTarget(step: Step): boolean;
  navigation(index: number, stepCount: number): StepNavigation;
  previousIndex(index: number): number | null;
  nextIndex(index: number, stepCount: number): number | null;
}

export const tooltipFlow: ScenarioFlow = {
  initialIndex(savedStep, stepCount) {
    if (stepCount <= 0) return 0;
    return Math.min(Math.max(savedStep ?? 0, 0), stepCount - 1);
  },
  viewTotal(stepCount) {
    return stepCount;
  },
  requiresTarget(_step) {
    return true;
  },
  navigation(index, stepCount) {
    const isTour = stepCount > 1;
    return {
      canGoBack: index > 0,
      canSkip: isTour,
      primaryAction: index < stepCount - 1 ? 'next' : 'complete',
      showProgress: isTour,
    };
  },
  previousIndex(index) {
    return index > 0 ? index - 1 : null;
  },
  nextIndex(index, stepCount) {
    return index + 1 < stepCount ? index + 1 : null;
  },
};

export const standaloneFlow: ScenarioFlow = {
  initialIndex() {
    return 0;
  },
  viewTotal() {
    return 1;
  },
  requiresTarget(_step) {
    return false;
  },
  navigation() {
    return {
      canGoBack: false,
      canSkip: false,
      primaryAction: 'acknowledge',
      showProgress: false,
    };
  },
  previousIndex() {
    return null;
  },
  nextIndex() {
    return null;
  },
};
