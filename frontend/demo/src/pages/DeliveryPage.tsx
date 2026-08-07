import { ProfileSidebar } from '../components/ProfileSidebar';
import {
  COMPLETED_ORDERS,
  DELIVERY_ORDER,
  DELIVERY_STAGES,
  type DeliveryStage,
} from '../data/mock';
import { anchor, type AnchorId } from '../onboarding-anchors';

const SECTION_TABS = ['Товары', 'Услуги', 'Жильё посуточно'];
const FILTERS = ['Покупаю', 'Продаю', 'Статус ⌄', 'Служба доставки ⌄'];

/** Якоря есть только у шагов, к которым цепляются подсказки сценария. */
const STAGE_ANCHORS: Partial<Record<DeliveryStage, AnchorId>> = {
  pack: 'delivery-pack',
  dropoff: 'delivery-dropoff',
  payout: 'delivery-payout',
};

/**
 * Заказы и заявки — сцена сценария 2.
 * Онбординг здесь привязан не к странице и не к сегменту, а к состоянию сделки:
 * подсказки идут по мере продвижения заказа и растянуты на несколько дней.
 */
export function DeliveryPage() {
  const order = DELIVERY_ORDER;
  const currentIndex = DELIVERY_STAGES.findIndex((stage) => stage.id === order.stage);

  return (
    <div className="container profile">
      <ProfileSidebar active="Заказы" />

      <div className="profile__main">
        <h1 className="profile__title">Заказы и заявки</h1>

        <div className="section-tabs" {...anchor('orders-tabs')}>
          {SECTION_TABS.map((tab, index) => (
            <span key={tab} className={`section-tab${index === 0 ? ' section-tab--active' : ''}`}>
              {tab}
            </span>
          ))}
        </div>

        <div className="filters">
          {FILTERS.map((filter) => (
            <span key={filter} className="filter">
              {filter}
            </span>
          ))}
          <span className="filter filter--search">⌕ Поиск по номеру заказа</span>
        </div>

        <article className="order" {...anchor('delivery-order-card')}>
          <div className="order__head">
            <div className="order__thumb">{order.photo}</div>
            <div className="order__info">
              <div className="order__status">Ждёт отправки</div>
              <h3 className="order__title">{order.listingTitle}</h3>
              <div className="order__meta">
                {order.price} · Покупатель: {order.buyerName}
              </div>
              <div className="order__meta">Пункт выдачи: {order.pickupPoint}</div>
            </div>
            <div className="order__deadline">Отправить за {order.deadline}</div>
          </div>

          <div className="stages" {...anchor('delivery-status')}>
            {DELIVERY_STAGES.map((stage, index) => {
              const state =
                index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';
              const stageAnchor = STAGE_ANCHORS[stage.id];

              return (
                <div
                  key={stage.id}
                  className={`stage stage--${state}`}
                  {...(stageAnchor ? anchor(stageAnchor) : {})}
                >
                  <span className="stage__dot">{index + 1}</span>
                  <span className="stage__title">{stage.title}</span>
                  <span className="stage__hint">{stage.hint}</span>
                </div>
              );
            })}
          </div>

          <div className="order__note">
            Деньги придут на карту после того, как покупатель осмотрит товар.
          </div>
        </article>

        <div className="orders-done">
          {COMPLETED_ORDERS.map((done) => (
            <article key={done.id} className="done">
              <div className="done__left">
                <div className="done__status">{done.status}</div>
                <div className="done__note">{done.note}</div>
              </div>
              <div className="done__mid">
                <div className="done__price">{done.price}</div>
                <div className="done__service">{done.service}</div>
                <div className="done__track">{done.trackNumber}</div>
              </div>
              <div className="done__thumb">{done.photo}</div>
            </article>
          ))}
        </div>

        <p className="orders-hint">
          Завершённые заказы старше 60 дней отправляются в архив. <a>Показать</a>
        </p>
      </div>
    </div>
  );
}
