#!/bin/sh
set -eu

API="${API_URL:-http://backend:8081}/api/v1"

until curl -sf "$API/scenarios" >/dev/null 2>&1; do
  sleep 2
done

if [ "$(curl -sf "$API/scenarios")" != "[]" ]; then
  echo "seed: сценарии уже есть, пропускаю"
  exit 0
fi

create() {
  curl -sf -X POST "$API/scenarios" -H 'Content-Type: application/json' -d "$1" \
    | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

publish() {
  curl -sf -o /dev/null -X PATCH "$API/scenarios/$1" -H 'Content-Type: application/json' -d "$2"
}

ID=$(create '{
  "title": "Первое объявление",
  "status": "published",
  "steps": [
    {"step_order":1,"title":"Название решает, найдут ли вас","content":"Пишите как в поиске: предмет, модель, размер. «Продам телефон» не найдут — «iPhone 13, 128 ГБ» найдут.","selector":"[data-onboarding-id=\"form-title\"]","action_type":"next","condition":"always","timeout_sec":5},
    {"step_order":2,"title":"Фото важнее описания","content":"Объявления с четырьмя и более фотографиями получают заметно больше откликов. Снимайте при дневном свете, на однотонном фоне.","selector":"[data-onboarding-id=\"form-photos\"]","action_type":"next","condition":"always","timeout_sec":5},
    {"step_order":3,"title":"Цену проверьте по похожим","content":"Посмотрите, за сколько продают такое же рядом с вами. Цена выше рынка — объявление зависнет надолго.","selector":"[data-onboarding-id=\"form-price\"]","action_type":"next","condition":"always","timeout_sec":5},
    {"step_order":4,"title":"Готово, публикуем","content":"После публикации объявление пройдёт проверку — обычно это занимает несколько минут.","selector":"[data-onboarding-id=\"form-submit\"]","action_type":"next","condition":"always","timeout_sec":5}
  ]}')
publish "$ID" '{"published":true,"url_pattern":"/create","priority":10}'

ID=$(create '{
  "title": "Объявление не продаётся — товары",
  "status": "published",
  "steps": [
    {"step_order":1,"title":"Неделя на сайте, три просмотра","content":"Так бывает, когда объявление не находят по поиску. Разберём по шагам, что поправить.","selector":"[data-vertical=\"goods\"] [data-onboarding-id=\"my-listings-stats\"]","action_type":"next","condition":"always","timeout_sec":5},
    {"step_order":2,"title":"Начните с заголовка","content":"«Продам телефон» — так не ищут. Добавьте модель, объём памяти и состояние.","selector":"[data-vertical=\"goods\"] [data-onboarding-id=\"my-listings-status\"]","action_type":"next","condition":"always","timeout_sec":5},
    {"step_order":3,"title":"Если правки не помогут","content":"Продвижение поднимет объявление в выдаче. Но сначала заголовок и фото — иначе платить придётся дважды.","selector":"[data-vertical=\"goods\"] [data-onboarding-id=\"my-listings-action\"]","action_type":"next","condition":"always","timeout_sec":5}
  ]}')
publish "$ID" '{"published":true,"url_pattern":"/my","match_context":{"segment":"stale","vertical":"goods"},"priority":10}'

ID=$(create '{
  "title": "Резюме не смотрят — работа",
  "status": "published",
  "steps": [
    {"step_order":1,"title":"Девять дней, пять просмотров","content":"Резюме теряется в выдаче. Тот же механизм, что и у товаров, но правим другое.","selector":"[data-vertical=\"jobs\"] [data-onboarding-id=\"my-listings-stats\"]","action_type":"next","condition":"always","timeout_sec":5},
    {"step_order":2,"title":"Укажите навыки и опыт","content":"Работодатели фильтруют по навыкам. Пустое резюме не попадёт в подборку.","selector":"[data-vertical=\"jobs\"] [data-onboarding-id=\"my-listings-status\"]","action_type":"next","condition":"always","timeout_sec":5},
    {"step_order":3,"title":"Поднимите резюме","content":"Обновление возвращает резюме в начало списка у работодателей.","selector":"[data-vertical=\"jobs\"] [data-onboarding-id=\"my-listings-action\"]","action_type":"next","condition":"always","timeout_sec":5}
  ]}')
publish "$ID" '{"published":true,"url_pattern":"/my","match_context":{"segment":"stale","vertical":"jobs"},"priority":10}'

ID=$(create '{
  "title": "Первая доставка",
  "status": "published",
  "steps": [
    {"step_order":1,"title":"Упакуйте плотно","content":"Плотный картон и пузырчатая плёнка. Повреждённый товар покупатель вправе вернуть.","selector":"[data-onboarding-id=\"delivery-pack\"]","action_type":"next","condition":"always","timeout_sec":5},
    {"step_order":2,"title":"Отнесите в пункт выдачи","content":"Назовите код заказа на кассе. Срок — три дня, иначе заказ отменится.","selector":"[data-onboarding-id=\"delivery-dropoff\"]","action_type":"next","condition":"always","timeout_sec":5},
    {"step_order":3,"title":"Деньги придут после осмотра","content":"Покупатель проверяет товар в пункте выдачи, после этого деньги уходят на вашу карту.","selector":"[data-onboarding-id=\"delivery-payout\"]","action_type":"next","condition":"always","timeout_sec":5}
  ]}')
publish "$ID" '{"published":true,"url_pattern":"/orders","match_context":{"order_stage":"pack"},"priority":10}'

echo "seed: опубликовано 4 сценария"
