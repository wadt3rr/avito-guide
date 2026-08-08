export interface IAnchorOption {
  id: string
  label: string
  group: string
  path: string
}

export interface IAnchorGroup {
  label: string
  options: IAnchorOption[]
}

export const anchorOptions: IAnchorOption[] = [
  {id: 'header-search', label: 'Строка поиска', group: 'Общие элементы', path: '*'},
  {id: 'header-all-categories', label: 'Кнопка «Все категории»', group: 'Общие элементы', path: '*'},
  {id: 'header-city', label: 'Выбор города', group: 'Общие элементы', path: '*'},
  {id: 'header-favorites', label: 'Избранное', group: 'Общие элементы', path: '*'},
  {id: 'header-create-listing', label: 'Кнопка «Разместить объявление»', group: 'Общие элементы', path: '*'},
  {id: 'header-my-listings', label: 'Ссылка «Мои объявления»', group: 'Общие элементы', path: '*'},
  {id: 'catalog-categories', label: 'Плитка категорий', group: 'Главная', path: '/'},
  {id: 'catalog-business', label: 'Блок «Всё для бизнеса»', group: 'Главная', path: '/'},
  {id: 'catalog-grid', label: 'Лента объявлений', group: 'Главная', path: '/'},
  {id: 'form-breadcrumb', label: 'Выбранная категория', group: 'Подача объявления', path: '/create'},
  {id: 'form-title', label: 'Поле «Название объявления»', group: 'Подача объявления', path: '/create'},
  {id: 'form-kind', label: 'Поле «Вид объявления»', group: 'Подача объявления', path: '/create'},
  {id: 'form-condition', label: 'Выбор состояния товара', group: 'Подача объявления', path: '/create'},
  {id: 'form-photos', label: 'Загрузка фотографий', group: 'Подача объявления', path: '/create'},
  {id: 'form-features', label: 'Блок характеристик', group: 'Подача объявления', path: '/create'},
  {id: 'form-description', label: 'Поле «Описание»', group: 'Подача объявления', path: '/create'},
  {id: 'form-price', label: 'Поле «Цена»', group: 'Подача объявления', path: '/create'},
  {id: 'form-location', label: 'Блок «Местоположение»', group: 'Подача объявления', path: '/create'},
  {id: 'form-contacts', label: 'Блок «Контакты»', group: 'Подача объявления', path: '/create'},
  {id: 'form-submit', label: 'Кнопка «Продолжить»', group: 'Подача объявления', path: '/create'},
  {id: 'profile-menu', label: 'Боковое меню кабинета', group: 'Мои объявления', path: '/my'},
  {id: 'my-listings-tabs', label: 'Вкладки статусов', group: 'Мои объявления', path: '/my'},
  {id: 'my-listings-list', label: 'Список объявлений', group: 'Мои объявления', path: '/my'},
  {id: 'my-listings-stale-card', label: 'Карточка без продаж', group: 'Мои объявления', path: '/my'},
  {id: 'my-listings-stats', label: 'Статистика объявления', group: 'Мои объявления', path: '/my'},
  {id: 'my-listings-status', label: 'Статус объявления', group: 'Мои объявления', path: '/my'},
  {id: 'my-listings-action', label: 'Действие с объявлением', group: 'Мои объявления', path: '/my'},
  {id: 'orders-tabs', label: 'Вкладки заказов', group: 'Заказы', path: '/orders'},
  {id: 'delivery-order-card', label: 'Карточка активного заказа', group: 'Заказы', path: '/orders'},
  {id: 'delivery-status', label: 'Шаги доставки', group: 'Заказы', path: '/orders'},
  {id: 'delivery-pack', label: 'Шаг «Упакуйте товар»', group: 'Заказы', path: '/orders'},
  {id: 'delivery-dropoff', label: 'Шаг «Отнесите в пункт выдачи»', group: 'Заказы', path: '/orders'},
  {id: 'delivery-payout', label: 'Шаг «Получите деньги»', group: 'Заказы', path: '/orders'},
]

export function getAnchorById(id: string) {
  return anchorOptions.find((anchorOption) => anchorOption.id === id)
}

export function getAnchorGroups(path: string, selectedAnchorId?: string): IAnchorGroup[] {
  const normalizedPath = path.trim().split(/[?#]/, 1)[0] || '/'
  const pathOptions = anchorOptions.filter(
    (anchorOption) =>
      anchorOption.path === '*' || anchorOption.path === normalizedPath,
  )
  const filteredOptions = pathOptions.some((anchorOption) => anchorOption.path !== '*')
    ? pathOptions
    : anchorOptions
  const selectedAnchor = selectedAnchorId
    ? getAnchorById(selectedAnchorId)
    : undefined
  const options =
    selectedAnchor && !filteredOptions.includes(selectedAnchor)
      ? [...filteredOptions, selectedAnchor]
      : filteredOptions

  return [...new Set(options.map((anchorOption) => anchorOption.group))].map(
    (group) => ({
      label: group,
      options: options.filter((anchorOption) => anchorOption.group === group),
    }),
  )
}
