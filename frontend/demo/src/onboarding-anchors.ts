/**
 * Реестр точек привязки онбординга.
 *
 * Каждый элемент интерфейса, на который может указывать подсказка, помечается
 * атрибутом `data-onboarding-id`. Виджет ищет элементы именно по нему и никогда
 * по классам: классы меняются при любой правке вёрстки, и сценарии разваливаются
 * молча — подсказка просто перестаёт находить элемент.
 *
 * Файл — единственный источник правды об этих именах. Он нужен трём частям:
 *   - демо-сайту: расставить якоря, не выдумывая имена на ходу;
 *   - админке: показать продакту список готовых точек вместо ручного ввода
 *     CSS-селектора;
 *   - виджету: гарантия, что селектор из сценария кому-то соответствует.
 */

export const ANCHOR_IDS = [
  // Общая шапка
  'header-search',
  'header-all-categories',
  'header-city',
  'header-favorites',
  'header-create-listing',
  'header-my-listings',

  // Главная
  'catalog-categories',
  'catalog-business',
  'catalog-grid',

  // Подача объявления (сценарий 1)
  'form-breadcrumb',
  'form-title',
  'form-kind',
  'form-condition',
  'form-photos',
  'form-features',
  'form-description',
  'form-price',
  'form-location',
  'form-contacts',
  'form-submit',

  // Личный кабинет: мои объявления (сценарий 3)
  'profile-menu',
  'my-listings-tabs',
  'my-listings-list',
  'my-listings-stale-card',
  'my-listings-stats',
  'my-listings-status',
  'my-listings-action',

  // Личный кабинет: заказы и доставка (сценарий 2)
  'orders-tabs',
  'delivery-order-card',
  'delivery-status',
  'delivery-pack',
  'delivery-dropoff',
  'delivery-payout',
] as const;

export type AnchorId = (typeof ANCHOR_IDS)[number];

/** Экран, на котором живёт якорь. Нужен админке для группировки списка. */
export type AnchorScreen = 'Шапка' | 'Главная' | 'Подача объявления' | 'Мои объявления' | 'Заказы';

/** Человеческие описания — из них потом соберётся выпадающий список в админке. */
export const ANCHOR_CATALOG: Record<AnchorId, { screen: AnchorScreen; label: string }> = {
  'header-search': { screen: 'Шапка', label: 'Строка поиска' },
  'header-all-categories': { screen: 'Шапка', label: 'Кнопка «Все категории»' },
  'header-city': { screen: 'Шапка', label: 'Выбор города' },
  'header-favorites': { screen: 'Шапка', label: 'Избранное' },
  'header-create-listing': { screen: 'Шапка', label: 'Кнопка «Разместить объявление»' },
  'header-my-listings': { screen: 'Шапка', label: 'Ссылка «Мои объявления»' },

  'catalog-categories': { screen: 'Главная', label: 'Плитка категорий' },
  'catalog-business': { screen: 'Главная', label: 'Блок «Всё для бизнеса»' },
  'catalog-grid': { screen: 'Главная', label: 'Лента объявлений' },

  'form-breadcrumb': { screen: 'Подача объявления', label: 'Выбранная категория' },
  'form-title': { screen: 'Подача объявления', label: 'Поле «Название объявления»' },
  'form-kind': { screen: 'Подача объявления', label: 'Поле «Вид объявления»' },
  'form-condition': { screen: 'Подача объявления', label: 'Выбор состояния товара' },
  'form-photos': { screen: 'Подача объявления', label: 'Загрузка фотографий' },
  'form-features': { screen: 'Подача объявления', label: 'Блок характеристик' },
  'form-description': { screen: 'Подача объявления', label: 'Поле «Описание»' },
  'form-price': { screen: 'Подача объявления', label: 'Поле «Цена»' },
  'form-location': { screen: 'Подача объявления', label: 'Блок «Местоположение»' },
  'form-contacts': { screen: 'Подача объявления', label: 'Блок «Контакты»' },
  'form-submit': { screen: 'Подача объявления', label: 'Кнопка «Продолжить»' },

  'profile-menu': { screen: 'Мои объявления', label: 'Боковое меню кабинета' },
  'my-listings-tabs': { screen: 'Мои объявления', label: 'Вкладки статусов' },
  'my-listings-list': { screen: 'Мои объявления', label: 'Список объявлений' },
  'my-listings-stale-card': { screen: 'Мои объявления', label: 'Карточка, которая не продаётся' },
  'my-listings-stats': { screen: 'Мои объявления', label: 'Просмотры, контакты, избранное' },
  'my-listings-status': { screen: 'Мои объявления', label: 'Статус объявления' },
  'my-listings-action': { screen: 'Мои объявления', label: 'Кнопка действия по объявлению' },

  'orders-tabs': { screen: 'Заказы', label: 'Вкладки разделов заказов' },
  'delivery-order-card': { screen: 'Заказы', label: 'Карточка активного заказа' },
  'delivery-status': { screen: 'Заказы', label: 'Шаги доставки' },
  'delivery-pack': { screen: 'Заказы', label: 'Шаг «Упакуйте товар»' },
  'delivery-dropoff': { screen: 'Заказы', label: 'Шаг «Отнесите в пункт выдачи»' },
  'delivery-payout': { screen: 'Заказы', label: 'Шаг «Получите деньги»' },
};

/**
 * Помечает элемент якорем: `<button {...anchor('form-submit')}>`.
 * Имя проверяется на этапе компиляции — опечатка не доедет до рантайма.
 */
export function anchor(id: AnchorId): { 'data-onboarding-id': AnchorId } {
  return { 'data-onboarding-id': id };
}
