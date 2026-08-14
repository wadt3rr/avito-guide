export type ActionType = 'next' | 'click';
export type ScenarioType = 'tooltip' | 'modal' | 'banner';

export interface Step {
  id: string;
  kind?: string;
  step_order: number;
  title: string;
  content: string;
  selector?: string;
  action_type: ActionType;
  timeout_sec: number;
}

export interface Scenario {
  id: string;
  title: string;
  type: ScenarioType;
  steps: Step[];
}

export interface ResolveContext {
  path: string;
  url?: string;
  anon_id?: string;
  session_id?: string;
  context?: Record<string, string>;
}

export type EventType =
  | 'scenario_started'
  | 'step_shown'
  | 'step_completed'
  | 'step_skipped'
  | 'step_failed'
  | 'scenario_finished'
  | 'scenario_dismissed';

export type BackendEventType = 'started' | 'step_completed' | 'skipped' | 'finished';

export interface BackendAnalyticsEvent {
  scenario_id: string;
  session_id: string;
  step_id?: string;
  event_type: BackendEventType;
}

export interface WidgetConfig {
  apiUrl: string | null;
  previewId?: string | null;
  debug: boolean;
}
