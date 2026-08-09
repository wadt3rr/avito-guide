/**
 * Формы данных повторяют модель бэкенда, чтобы подмена мока на живой API
 * не потребовала правок ни в одном другом модуле.
 */

/** Что продвигает шаг дальше. */
export type ActionType = 'next' | 'click';
export type ScenarioType = 'tooltip' | 'modal' | 'banner';

export interface Step {
  id: string;
  step_order: number;
  title: string;
  content: string;
  /** CSS-селектор цели. По соглашению — по атрибуту data-onboarding-id. */
  selector?: string;
  action_type: ActionType;
  /** Сколько ждать появления элемента. 0 — не ждать вовсе. */
  timeout_sec: number;
}

export interface Scenario {
  id: string;
  title: string;
  /** Отсутствующее значение означает tooltip для старых сценариев. */
  type?: ScenarioType;
  steps: Step[];
}

/** Контекст, по которому бэкенд решает, что показать. */
export interface ResolveContext {
  path: string;
}

export type EventType =
  | 'scenario_started'
  | 'step_shown'
  | 'step_completed'
  | 'step_skipped'
  /** Элемент не нашёлся — единственный сигнал, что сценарий сломан вёрсткой. */
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
  /** Адрес API для отправки аналитики. */
  apiUrl: string | null;
  debug: boolean;
}
