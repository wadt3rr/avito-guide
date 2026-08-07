/**
 * Формы данных повторяют модель бэкенда, чтобы подмена мока на живой API
 * не потребовала правок ни в одном другом модуле.
 */

/** Что продвигает шаг дальше. */
export type ActionType = 'next' | 'click';

export interface Step {
  id: string;
  step_order: number;
  title: string;
  content: string;
  /** CSS-селектор цели. По соглашению — по атрибуту data-onboarding-id. */
  selector: string;
  action_type: ActionType;
  /** Сколько ждать появления элемента. 0 — не ждать вовсе. */
  timeout_sec: number;
}

export interface Scenario {
  id: string;
  title: string;
  steps: Step[];
}

/** Контекст, по которому бэкенд решает, что показать. */
export interface ResolveContext {
  url: string;
  anon_id: string;
  session_id: string;
  /** Факты, которые страница сообщает о себе: сегмент, вертикаль, стадия сделки. */
  context: Record<string, string>;
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

export interface OnboardingEvent {
  type: EventType;
  scenario_id: string;
  step_id: string | null;
  anon_id: string;
  session_id: string;
  url: string;
  created_at: string;
  meta?: Record<string, unknown>;
}

export interface WidgetConfig {
  /** Адрес API. Пусто — работаем на встроенном сценарии-моке. */
  apiUrl: string | null;
  /** Показать неопубликованный сценарий по идентификатору из ?onboarding_preview=. */
  previewId: string | null;
  debug: boolean;
}
