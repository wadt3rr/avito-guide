import { ProfileSidebar } from '../components/ProfileSidebar';
import { MY_LISTINGS, type MyListing } from '../data/mock';
import { anchor } from '../onboarding-anchors';

const TABS = [
  { label: 'Ждут действий', count: 2 },
  { label: 'Активные', count: 4 },
  { label: 'Можно продать', count: 1 },
  { label: 'Архив', count: 27 },
];

/**
 * Мои объявления — сцена сценария 3 «объявление не продаётся».
 * Онбординг здесь запускается не по факту захода на страницу, а по данным:
 * объявление долго висит и почти не набирает просмотров. Таких карточек две,
 * в разных вертикалях — товар и резюме: механика одна, содержание разное.
 */
export function MyListingsPage() {
  return (
    <div className="container profile">
      <ProfileSidebar active="Мои объявления" />

      <div className="profile__main">
        <div className="profile-promo">
          <span className="profile-promo__art">📰</span>
          <div>
            <div className="profile-promo__title">
              Попробуйте новый инструмент — ленту постов на Авито
            </div>
            <div className="profile-promo__text">
              Создавайте контент, растите доверие и привлекайте будущих клиентов
            </div>
          </div>
        </div>

        <h1 className="profile__title">Мои объявления</h1>

        <div className="cards">
          <div className="stat-card">
            <span className="stat-card__art stat-card__art--blue">₽</span>
            <div>
              <div className="stat-card__value">151 861 ₽</div>
              <div className="stat-card__label">принесли продажи на Авито</div>
            </div>
          </div>
          <div className="stat-card">
            <span className="stat-card__art stat-card__art--green">%</span>
            <div>
              <div className="stat-card__value">Скидки и акции</div>
              <div className="stat-card__label">настройте для покупателей</div>
            </div>
          </div>
        </div>

        <div className="tabs" {...anchor('my-listings-tabs')}>
          {TABS.map((tab, index) => (
            <span key={tab.label} className={`tab${index === 1 ? ' tab--active' : ''}`}>
              {tab.label}
              <i className="tab__count">{tab.count}</i>
            </span>
          ))}
        </div>

        <div className="select-line">Выбрать объявления ⌄</div>

        <div className="rows" {...anchor('my-listings-list')}>
          {MY_LISTINGS.map((listing) => (
            <ListingRow key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ListingRow({ listing }: { listing: MyListing }) {
  const isJobs = listing.vertical === 'jobs';

  return (
    <article
      className={`row${listing.isStale ? ' row--stale' : ''}`}
      data-vertical={listing.vertical}
      {...(listing.isStale ? anchor('my-listings-stale-card') : {})}
    >
      <div className="row__thumb">{listing.photo}</div>

      <div className="row__body">
        <h3 className="row__title">{listing.title}</h3>
        <div className="row__price">{listing.price}</div>
        <div className="row__stock">{listing.stock}</div>
        {listing.hasDelivery && <div className="row__delivery">🚚 Авито доставка</div>}
        <div className="row__address">{listing.address}</div>
      </div>

      <div className="row__side">
        <div className="row__stats" {...(listing.isStale ? anchor('my-listings-stats') : {})}>
          <span className={listing.isStale ? 'is-bad' : ''}>👁 {listing.views}</span>
          <span className={listing.isStale ? 'is-bad' : ''}>
            👤 {listing.contacts}
          </span>
          <span>♡ {listing.favorites}</span>
        </div>

        <div
          className={`row__status${listing.isStale ? ' row__status--warn' : ''}`}
          {...(listing.isStale ? anchor('my-listings-status') : {})}
        >
          {listing.isStale
            ? `${listing.status} · ${listing.daysOnline} дней на сайте`
            : `${listing.status} · ${listing.daysOnline} дней на сайте`}
        </div>

        <div className="row__chats">💬 Нет новых чатов</div>

        <button className="row__action" {...(listing.isStale ? anchor('my-listings-action') : {})}>
          {isJobs ? 'Поднять резюме' : 'Продвинуть'}
        </button>
      </div>
    </article>
  );
}
