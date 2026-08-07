# demo

Тестовый классифайд — стенд для проверки онбординга. Бэкенда нет, данные статические.

## Запуск

```bash
docker compose up
```

http://localhost:5173. Локальный Node не нужен: `node_modules` монтируются в `frontend/demo/`.

## Команды

```bash
docker compose exec demo npm run <script>
```

| script | |
|---|---|
| `dev` | дев-сервер, стартует сам |
| `build` | сборка в `dist/` |
| `lint` | ESLint |
| `format` | Prettier |

Типы: `docker compose exec demo npx tsc --noEmit`.

## Маршруты

| Путь | Экран | Сценарий |
|---|---|---|
| `/` | Главная | — |
| `/create` | Новое объявление | подача объявления |
| `/my` | Мои объявления | объявление не продаётся |
| `/orders` | Заказы и заявки | доставка |

## Якоря

Цели подсказок помечаются `data-onboarding-id`. Привязка к CSS-классам запрещена — классы
меняются при пересборке.

Реестр — `src/onboarding-anchors.ts`, 33 точки, имена проверяются компилятором.

```tsx
<button {...anchor('form-submit')}>Продолжить</button>
```

`ANCHOR_CATALOG` — подписи точек для выпадающего списка в админке.

Карточки разных вертикалей на `/my` различаются атрибутом `data-vertical`:

```
[data-vertical="jobs"] [data-onboarding-id="my-listings-action"]
```

## Виджет

Подключается одной строкой в `index.html`, сейчас закомментирована. Импортов в код сайта нет.

```html
<script src="http://localhost:8082/widget.js" data-api="http://localhost:8081"></script>
```

## Стек

React 18, TypeScript, Vite 5, React Router. ESLint 9 (flat config), Prettier. Без UI-кита.

## Ограничения

- Данные — `src/data/mock.ts`.
- Интерактив, кроме навигации, не реализован.
- Вместо фотографий эмодзи.
- Только десктоп.
