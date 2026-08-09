import type {ResolveContext, Scenario, WidgetConfig} from './types';

export interface ScenarioSource {
  resolve(context: ResolveContext): Promise<Scenario | null>;
}

const MOCK_SCENARIO: Scenario = {
  id: '00000000-0000-4000-8000-000000000001',
  type: 'tooltip',
  title: 'Первое объявление',
  steps: [
    {id: 'step-title', step_order: 1, title: 'Название решает, найдут ли вас', content: 'Пишите как в поиске: предмет, модель, размер.', selector: '[data-onboarding-id="form-title"]', action_type: 'next', timeout_sec: 5},
    {id: 'step-photos', step_order: 2, title: 'Фото важнее описания', content: 'Добавляйте несколько фотографий при дневном свете.', selector: '[data-onboarding-id="form-photos"]', action_type: 'next', timeout_sec: 5},
    {id: 'step-price', step_order: 3, title: 'Проверьте цену', content: 'Сравните цену с похожими объявлениями.', selector: '[data-onboarding-id="form-price"]', action_type: 'next', timeout_sec: 5},
    {id: 'step-submit', step_order: 4, title: 'Готово, публикуем', content: 'После публикации объявление пройдёт проверку.', selector: '[data-onboarding-id="form-submit"]', action_type: 'next', timeout_sec: 5},
  ],
};

const MOCK_MODAL: Scenario = {
  id: '00000000-0000-4000-8000-000000000002',
  type: 'modal',
  title: 'Объявление можно улучшить',
  steps: [{id: 'modal-listing-tip', step_order: 1, title: 'Объявление можно улучшить', content: 'Добавьте больше фотографий и уточните название.', selector: '', action_type: 'next', timeout_sec: 0}],
};

const MOCK_BANNER: Scenario = {
  id: '00000000-0000-4000-8000-000000000003',
  type: 'banner',
  title: 'Не забудьте передать заказ',
  steps: [{id: 'banner-order-reminder', step_order: 1, title: 'Не забудьте передать заказ', content: 'Отнесите посылку в пункт выдачи до завтра.', selector: '', action_type: 'next', timeout_sec: 0}],
};

class MockSource implements ScenarioSource {
  resolve(context: ResolveContext): Promise<Scenario | null> {
    if (context.path.startsWith('/create')) return Promise.resolve(MOCK_SCENARIO);
    if (context.path.startsWith('/my')) return Promise.resolve(MOCK_MODAL);
    if (context.path.startsWith('/orders')) return Promise.resolve(MOCK_BANNER);
    return Promise.resolve(null);
  }
}

class HttpSource implements ScenarioSource {
  constructor(private readonly config: WidgetConfig) {}

  async resolve(context: ResolveContext): Promise<Scenario | null> {
    const base = this.config.apiUrl;
    if (!base) return null;

    try {
      const response = this.config.previewId
        ? await fetch(`${base}/api/v1/embed/scenarios/${this.config.previewId}?preview=1`, {headers: {Accept: 'application/json'}})
        : await fetch(`${base}/api/v1/embed/resolve`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              ...context,
              url: context.url ?? `${location.origin}${context.path}`,
              context: context.context ?? {},
            }),
          });

      if (response.status === 204 || !response.ok) return null;
      return (await response.json()) as Scenario;
    } catch {
      return null;
    }
  }
}

export function createSource(config: WidgetConfig): ScenarioSource {
  return config.apiUrl ? new HttpSource(config) : new MockSource();
}
