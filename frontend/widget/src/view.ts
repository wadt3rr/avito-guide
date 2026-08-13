import type { StepNavigation } from './flow';
import type { Step } from './types';

export interface StepView {
  step: Step;
  index: number;
  total: number;
  navigation: StepNavigation;
}

export interface UiHandlers {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  onDismiss: () => void;
}
