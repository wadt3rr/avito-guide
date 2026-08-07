/**
 * Статические данные демо-сайта. Своего бэкенда у сцены нет и не нужно:
 * задача сайта — дать правдоподобные места, где новичок застревает.
 */

export type Vertical = 'goods' | 'jobs';

export interface Category {
  id: string;
  title: string;
  vertical: Vertical;
  emoji: string;
}

export interface Listing {
  id: string;
  title: string;
  price: string;
  city: string;
  categoryId: string;
  publishedAgo: string;
  /** Эмодзи вместо фотографии: чужие снимки не тащим, а плитка не должна быть пустой. */
  photo: string;
  hasDelivery: boolean;
  photoCount: number;
  sellerRating?: number;
}

/** Объявление в личном кабинете — со статистикой, по которой видно, что оно не продаётся. */
export interface MyListing {
  id: string;
  title: string;
  price: string;
  categoryId: string;
  vertical: Vertical;
  photo: string;
  views: number;
  contacts: number;
  favorites: number;
  daysOnline: number;
  stock: string;
  address: string;
  hasDelivery: boolean;
  status: string;
  /** Карточка-проблема: мало просмотров при долгом сроке размещения. */
  isStale: boolean;
}

export type DeliveryStage = 'pack' | 'dropoff' | 'transit' | 'payout';

export interface DeliveryOrder {
  id: string;
  listingTitle: string;
  price: string;
  buyerName: string;
  stage: DeliveryStage;
  pickupPoint: string;
  deadline: string;
  photo: string;
}

export interface CompletedOrder {
  id: string;
  status: string;
  note: string;
  price: string;
  service: string;
  trackNumber: string;
  photo: string;
}

export const CITY = 'Москва';

/** Вымышленный владелец демо-профиля. */
export const PROFILE_NAME = 'Мария';
export const PROFILE_RATING = '4,8';
export const PROFILE_REVIEWS = '17 отзывов';

export const CATEGORIES: Category[] = [
  { id: 'auto', title: 'Авто', vertical: 'goods', emoji: '🚗' },
  { id: 'realty', title: 'Недвижимость', vertical: 'goods', emoji: '🏠' },
  { id: 'travel', title: 'Жильё для путешествия', vertical: 'goods', emoji: '🧳' },
  { id: 'home', title: 'Для дома и дачи', vertical: 'goods', emoji: '🪑' },
  { id: 'auto-parts', title: 'Запчасти', vertical: 'goods', emoji: '⚙️' },
  { id: 'services', title: 'Услуги', vertical: 'goods', emoji: '🧰' },
  { id: 'electronics', title: 'Электроника', vertical: 'goods', emoji: '📱' },
  { id: 'jobs', title: 'Работа\nи подработка', vertical: 'jobs', emoji: '💼' },
  { id: 'business', title: 'Бизнес 360', vertical: 'goods', emoji: '🏗️' },
  { id: 'clothes', title: 'Одежда, обувь,\nаксессуары', vertical: 'goods', emoji: '👟' },
];

export const BUSINESS_TILES = [
  { emoji: '🖨️', title: 'Оборудо-\nвание' },
  { emoji: '🏢', title: 'Помещения' },
  { emoji: '📦', title: 'Товары' },
  { emoji: '🚚', title: 'Транспорт' },
  { emoji: '💼', title: 'Услуги' },
  { emoji: '👥', title: 'Сотрудники' },
];

export const LISTINGS: Listing[] = [
  {
    id: 'l1',
    title: 'Смартфон Huawei Nova 11, 256 ГБ',
    price: '18 500 ₽',
    city: 'Москва, Пресненский',
    categoryId: 'electronics',
    publishedAgo: '2 часа назад',
    photo: '📱',
    hasDelivery: true,
    photoCount: 7,
    sellerRating: 4.8,
  },
  {
    id: 'l2',
    title: 'Кресло компьютерное игровое, ткань',
    price: '4 200 ₽',
    city: 'Москва, Хамовники',
    categoryId: 'home',
    publishedAgo: 'вчера в 18:42',
    photo: '🪑',
    hasDelivery: false,
    photoCount: 4,
    sellerRating: 4.9,
  },
  {
    id: 'l3',
    title: 'Кроссовки Nike Air Max, 42 размер',
    price: '3 900 ₽',
    city: 'Москва, Басманный',
    categoryId: 'clothes',
    publishedAgo: '3 дня назад',
    photo: '👟',
    hasDelivery: true,
    photoCount: 5,
    sellerRating: 4.6,
  },
  {
    id: 'l4',
    title: 'Тормозные колодки Lada Granta, новые',
    price: '1 350 ₽',
    city: 'Москва, Люблино',
    categoryId: 'auto-parts',
    publishedAgo: 'сегодня в 09:15',
    photo: '⚙️',
    hasDelivery: true,
    photoCount: 3,
  },
  {
    id: 'l5',
    title: 'Курьер на личном авто, сменный график',
    price: 'от 65 000 ₽',
    city: 'Москва',
    categoryId: 'jobs',
    publishedAgo: 'сегодня в 11:03',
    photo: '💼',
    hasDelivery: false,
    photoCount: 1,
  },
  {
    id: 'l6',
    title: 'Сборка и ремонт корпусной мебели',
    price: 'от 800 ₽',
    city: 'Москва, Таганский',
    categoryId: 'services',
    publishedAgo: '5 дней назад',
    photo: '🧰',
    hasDelivery: false,
    photoCount: 6,
    sellerRating: 5.0,
  },
  {
    id: 'l7',
    title: 'Ноутбук Lenovo IdeaPad 5, 16 ГБ / 512 SSD',
    price: '32 000 ₽',
    city: 'Москва, Пресненский',
    categoryId: 'electronics',
    publishedAgo: 'вчера в 20:10',
    photo: '💻',
    hasDelivery: true,
    photoCount: 9,
    sellerRating: 4.7,
  },
  {
    id: 'l8',
    title: 'Стол письменный, дуб сонома, 120×60',
    price: '5 500 ₽',
    city: 'Москва, Отрадное',
    categoryId: 'home',
    publishedAgo: '4 дня назад',
    photo: '🗄️',
    hasDelivery: false,
    photoCount: 2,
    sellerRating: 4.5,
  },
  {
    id: 'l9',
    title: 'Велосипед Stels Navigator 500, рама 18"',
    price: '12 000 ₽',
    city: 'Москва, Черёмушки',
    categoryId: 'home',
    publishedAgo: 'сегодня в 08:20',
    photo: '🚲',
    hasDelivery: true,
    photoCount: 8,
    sellerRating: 4.9,
  },
  {
    id: 'l10',
    title: 'Куртка зимняя женская, размер 44',
    price: '6 800 ₽',
    city: 'Москва, Марьино',
    categoryId: 'clothes',
    publishedAgo: '2 дня назад',
    photo: '🧥',
    hasDelivery: true,
    photoCount: 6,
    sellerRating: 4.4,
  },
];

/**
 * Объявления пользователя. Две «залежавшиеся» карточки — в разных вертикалях:
 * товар и резюме. Один и тот же сценарий онбординга настраивается на обе,
 * меняется только содержание подсказок.
 */
export const MY_LISTINGS: MyListing[] = [
  {
    id: 'm1',
    title: 'Продам телефон',
    price: '20 000 ₽',
    categoryId: 'electronics',
    vertical: 'goods',
    photo: '📱',
    views: 3,
    contacts: 0,
    favorites: 0,
    daysOnline: 7,
    stock: '1 шт. в наличии',
    address: 'Москва, Пресненский, 1,2 км',
    hasDelivery: false,
    status: 'Мало просмотров',
    isStale: true,
  },
  {
    id: 'm2',
    title: 'Резюме: менеджер',
    price: 'от 50 000 ₽',
    categoryId: 'jobs',
    vertical: 'jobs',
    photo: '📄',
    views: 5,
    contacts: 0,
    favorites: 0,
    daysOnline: 9,
    stock: 'Резюме опубликовано',
    address: 'Москва',
    hasDelivery: false,
    status: 'Мало просмотров',
    isStale: true,
  },
  {
    id: 'm3',
    title: 'Велосипед Stels Navigator 500, рама 18"',
    price: '12 000 ₽',
    categoryId: 'home',
    vertical: 'goods',
    photo: '🚲',
    views: 214,
    contacts: 11,
    favorites: 9,
    daysOnline: 3,
    stock: '1 шт. в наличии',
    address: 'Москва, Черёмушки, 800 м',
    hasDelivery: true,
    status: 'Активно',
    isStale: false,
  },
  {
    id: 'm4',
    title: 'Куртка зимняя женская, размер 44',
    price: '6 800 ₽',
    categoryId: 'clothes',
    vertical: 'goods',
    photo: '🧥',
    views: 88,
    contacts: 4,
    favorites: 6,
    daysOnline: 5,
    stock: '1 шт. в наличии',
    address: 'Москва, Марьино, 2,4 км',
    hasDelivery: true,
    status: 'Активно',
    isStale: false,
  },
];

export const DELIVERY_ORDER: DeliveryOrder = {
  id: 'o1',
  listingTitle: 'Велосипед Stels Navigator 500, рама 18"',
  price: '12 000 ₽',
  buyerName: 'Игорь М.',
  stage: 'pack',
  pickupPoint: 'Москва, ул. Мясницкая, 13с18',
  deadline: '3 дня',
  photo: '🚲',
};

export const DELIVERY_STAGES: { id: DeliveryStage; title: string; hint: string }[] = [
  { id: 'pack', title: 'Упакуйте товар', hint: 'Плотный картон и пузырчатая плёнка' },
  { id: 'dropoff', title: 'Отнесите в пункт выдачи', hint: 'Назовите код заказа на кассе' },
  { id: 'transit', title: 'Товар едет к покупателю', hint: 'Обычно 2–4 дня' },
  { id: 'payout', title: 'Получите деньги', hint: 'После осмотра покупателем' },
];

export const COMPLETED_ORDERS: CompletedOrder[] = [
  {
    id: 'o2',
    status: 'Завершён',
    note: 'Банк перевёл 1 526 ₽',
    price: '1 526 ₽',
    service: '5Post',
    trackNumber: 'P08 115 089 782',
    photo: '👗',
  },
  {
    id: 'o3',
    status: 'Завершён',
    note: 'Банк перевёл 910 ₽',
    price: '910 ₽ · 10 товаров',
    service: 'Авито',
    trackNumber: 'P08 114 220 401',
    photo: '👜',
  },
];

/** Пункты бокового меню личного кабинета. `to` есть только у собранных разделов. */
export const PROFILE_MENU: {
  group: string;
  items: { label: string; badge?: string; to?: string }[];
}[] = [
  {
    group: 'main',
    items: [
      { label: 'Мои объявления', to: '/my' },
      { label: 'Сравнение цен', badge: 'Новое' },
      { label: 'Заказы', to: '/orders' },
      { label: 'Мои отзывы' },
      { label: 'Избранное' },
      { label: 'Бонусы', badge: 'Новое' },
      { label: 'Приглашайте друзей' },
      { label: 'Мои резюме' },
      { label: 'Подработка', badge: 'Новое' },
      { label: 'Портфолио', badge: 'Новое' },
    ],
  },
  { group: 'messages', items: [{ label: 'Сообщения' }, { label: 'Уведомления' }] },
  {
    group: 'money',
    items: [
      { label: 'Кошелёк', badge: '15 ₽' },
      { label: 'Платные услуги' },
      { label: 'Для профессионалов' },
      { label: 'Рассылки' },
    ],
  },
  {
    group: 'settings',
    items: [
      { label: 'Адреса' },
      { label: 'Управление профилем' },
      { label: 'Защита профиля' },
      { label: 'Настройки' },
      { label: 'Авито Доставка' },
    ],
  },
];

export function categoryTitle(categoryId: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.title.replace('\n', ' ') ?? 'Без категории';
}
