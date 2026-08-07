import type { ResolveContext, Scenario, WidgetConfig } from './types';

/**
 * Откуда берётся сценарий.
 *
 * Единственный модуль, знающий про сеть. Пока бэкенд не отдаёт эндпоинты
 * виджета, работает встроенный сценарий-мок; переключение — по наличию
 * адреса API в настройках, ни один другой модуль об этом не знает.
 */

export interface ScenarioSource {
  resolve(context: ResolveContext): Promise<Scenario | null>;
}

/** Демонстрационный сценарий подачи объявления. Селекторы — из реестра якорей демо-сайта. */
const MOCK_SCENARIO: Scenario = {
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Первое объявление',
  steps: [
    {
      id: 'step-title',
      step_order: 1,
      title: 'Название решает, найдут ли вас',
      content:
        'Пишите как в поиске: предмет, модель, размер. «Продам телефон» не найдут — «iPhone 13, 128 ГБ» найдут.',
      selector: '[data-onboarding-id="form-title"]',
      action_type: 'next',
      timeout_sec: 5,
    },
    {
      id: 'step-photos',
      step_order: 2,
      title: 'Фото важнее описания',
      content:
        'Объявления с четырьмя и более фотографиями получают заметно больше откликов. Снимайте при дневном свете, на однотонном фоне.',
      selector: '[data-onboarding-id="form-photos"]',
      action_type: 'next',
      timeout_sec: 5,
    },
    {
      id: 'step-price',
      step_order: 3,
      title: 'Цену проверьте по похожим',
      content:
        'Посмотрите, за сколько продают такое же рядом с вами. Цена выше рынка — объявление зависнет надолго.',
      selector: '[data-onboarding-id="form-price"]',
      action_type: 'next',
      timeout_sec: 5,
    },
    {
      id: 'step-submit',
      step_order: 4,
      title: 'Готово, публикуем',
      content: 'После публикации объявление пройдёт проверку — обычно это занимает несколько минут.',
      selector: '[data-onboarding-id="form-submit"]',
      action_type: 'next',
      timeout_sec: 5,
    },
  ],
};

class MockSource implements ScenarioSource {
  resolve(context: ResolveContext): Promise<Scenario | null> {
    return Promise.resolve(context.url.startsWith('/create') ? MOCK_SCENARIO : null);
  }
}

class HttpSource implements ScenarioSource {
  constructor(private readonly config: WidgetConfig) {}

  async resolve(context: ResolveContext): Promise<Scenario | null> {
    const base = this.config.apiUrl;
    if (!base) return null;

    try {
      const response = this.config.previewId
        ? await fetch(
            `${base}/api/v1/embed/scenario/${this.config.previewId}?preview=1`,
            { headers: { Accept: 'application/json' } },
          )
        : await fetch(`${base}/api/v1/embed/resolve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(context),
          });

      // 204 — подходящего сценария нет, это нормальный ответ, а не ошибка.
      if (response.status === 204 || !response.ok) return null;
      return (await response.json()) as Scenario;
    } catch {
      // Сеть недоступна — сайт должен продолжать работать как ни в чём не бывало.
      return null;
    }
  }
}

export function createSource(config: WidgetConfig): ScenarioSource {
  return config.apiUrl ? new HttpSource(config) : new MockSource();
}
