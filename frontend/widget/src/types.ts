
export type ActionType = 'next' | 'click';

export interface Step {
  id: string;
  step_order: number;
  title: string;
  content: string;
  selector: string;
  action_type: ActionType;
  timeout_sec: number;
}

export interface Scenario {
  id: string;
  title: string;
  steps: Step[];
}

export interface ResolveContext {
  url: string;
  anon_id: string;
  session_id: string;
  context: Record<string, string>;
}

export type EventType =
  | 'started'
  | 'step_shown'
  | 'step_completed'
  | 'step_skipped'
  | 'step_failed'
  | 'finished'
  | 'dismissed';

export interface OnboardingEvent {
  event_type: EventType;
  scenario_id: string;
  step_id: string | null;
  anon_id: string;
  session_id: string;
}

export interface WidgetConfig {
  apiUrl: string | null;
  previewId: string | null;
  debug: boolean;
}
