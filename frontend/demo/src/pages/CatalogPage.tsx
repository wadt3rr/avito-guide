import { ListingCard } from '../components/ListingCard';
import { BUSINESS_TILES, CATEGORIES, LISTINGS } from '../data/mock';
import { anchor } from '../onboarding-anchors';

export function CatalogPage() {
  return (
    <div className="container catalog">
      <div className="catalog__top">
        <div className="categories" {...anchor('catalog-categories')}>
          {CATEGORIES.map((category) => (
            <button key={category.id} className="cat-tile">
              <span className="cat-tile__title">{category.title}</span>
              <span className="cat-tile__art">{category.emoji}</span>
            </button>
          ))}
        </div>

        <aside className="business" {...anchor('catalog-business')}>
          <h3 className="business__title">Всё для бизнеса</h3>
          <p className="business__text">
            Миллионы предложений для разных задач в Авито Бизнес 360
          </p>
          <div className="business__grid">
            {BUSINESS_TILES.map((tile) => (
              <div key={tile.title} className="business__tile">
                <span className="business__emoji">{tile.emoji}</span>
                <span className="business__label">{tile.title}</span>
              </div>
            ))}
          </div>
          <button className="business__btn">◎ Искать в Бизнес 360</button>
        </aside>
      </div>

      <div className="promo-banner">
        <div className="promo-banner__brand">
          <span className="promo-banner__dots">
            <i className="logo__dot logo__dot--purple" />
            <i className="logo__dot logo__dot--blue" />
            <i className="logo__dot logo__dot--green" />
            <i className="logo__dot logo__dot--red" />
          </span>
          <span>
            Avito
            <br />
            Реклама
          </span>
        </div>
        <div className="promo-banner__center">
          <div className="promo-banner__title">
            Найдём клиентов,
            <br />
            <u>готовых к покупке</u>
          </div>
          <button className="promo-banner__btn">В кабинет</button>
        </div>
        <div className="promo-banner__art">
          <span className="promo-banner__chip">теперь и для ИП</span>
          🐱
        </div>
      </div>

      <div className="feed" {...anchor('catalog-grid')}>
        {LISTINGS.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}
