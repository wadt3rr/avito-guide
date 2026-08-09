import type { ResolveContext, Scenario, WidgetConfig } from './types';

/**
 * Откуда берётся сценарий.
 *
 * Пока backend не умеет выбирать опубликованный сценарий по path, виджет
 * работает на встроенных сценариях-моках. Адрес API уже можно указывать:
 * он используется отдельным модулем аналитики.
 */

export interface ScenarioSource {
  resolve(context: ResolveContext): Promise<Scenario | null>;
}

/** Демонстрационный сценарий подачи объявления. Селекторы — из реестра якорей демо-сайта. */
const MOCK_SCENARIO: Scenario = {
  id: '00000000-0000-4000-8000-000000000001',
  type: 'tooltip',
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
      content:
        'После публикации объявление пройдёт проверку — обычно это занимает несколько минут.',
      selector: '[data-onboarding-id="form-submit"]',
      action_type: 'next',
      timeout_sec: 5,
    },
  ],
};

const MOCK_MODAL: Scenario = {
  id: '00000000-0000-4000-8000-000000000002',
  type: 'modal',
  title: 'Объявление можно улучшить',
  steps: [
    {
      id: 'modal-listing-tip',
      step_order: 1,
      title: 'Объявление можно улучшить',
      content:
        'Добавьте больше фотографий и уточните название — так покупателям будет проще найти ваше предложение.',
      action_type: 'next',
      timeout_sec: 0,
    },
  ],
};

const MOCK_BANNER: Scenario = {
  id: '00000000-0000-4000-8000-000000000003',
  type: 'banner',
  title: 'Не забудьте передать заказ',
  steps: [
    {
      id: 'banner-order-reminder',
      step_order: 1,
      title: 'Не забудьте передать заказ',
      content: 'Отнесите посылку в пункт выдачи до завтра, чтобы заказ не отменился.',
      action_type: 'next',
      timeout_sec: 0,
    },
  ],
};

class MockSource implements ScenarioSource {
  resolve(context: ResolveContext): Promise<Scenario | null> {
    if (context.path.startsWith('/create')) return Promise.resolve(MOCK_SCENARIO);
    if (context.path.startsWith('/my')) return Promise.resolve(MOCK_MODAL);
    if (context.path.startsWith('/orders')) return Promise.resolve(MOCK_BANNER);
    return Promise.resolve(null);
  }
}

export function createSource(config: WidgetConfig): ScenarioSource {
  // Backend пока не умеет находить опубликованный сценарий по path.
  // data-api используется аналитикой, а сценарии до появления resolve endpoint остаются локальными.
  void config;
  return new MockSource();
}
