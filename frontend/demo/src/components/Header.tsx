import { NavLink } from 'react-router-dom';
import { CITY } from '../data/mock';
import { anchor } from '../onboarding-anchors';

const UTILITY_LINKS = ['Для бизнеса', 'Карьера в Авито', 'Помощь', 'Каталоги', '#яПомогаю'];
const PROFILE_NAV = ['Бизнес360', 'Авто', 'Недвижимость', 'Работа', 'Услуги', 'Ещё'];

/**
 * В личном кабинете вторая строка шапки другая: вместо поиска — навигация
 * по вертикалям. Поэтому у шапки два режима.
 */
export function Header({ variant = 'main' }: { variant?: 'main' | 'profile' }) {
  return (
    <header className="header">
      <div className="container header__utility">
        <nav className="utility">
          {UTILITY_LINKS.map((link) => (
            <span key={link} className="utility__link">
              {link}
            </span>
          ))}
        </nav>

        <div className="utility utility--right">
          <NavLink to="/create" className="utility__link" {...anchor('header-create-listing')}>
            <span className="utility__plus">+</span> Разместить объявление
          </NavLink>
          <NavLink to="/my" className="utility__link" {...anchor('header-my-listings')}>
            Мои объявления
          </NavLink>
          <span className="utility__icon" {...anchor('header-favorites')}>
            ♥
          </span>
          <span className="utility__icon">🔔</span>
          <span className="utility__icon utility__icon--badged">
            💬<i className="utility__badge">2</i>
          </span>
          <span className="utility__icon">🛒</span>
          <span className="utility__avatar" />
        </div>
      </div>

      <div className="container header__main">
        <NavLink to="/" className="logo">
          <span className="logo__dots">
            <i className="logo__dot logo__dot--green" />
            <i className="logo__dot logo__dot--blue" />
            <i className="logo__dot logo__dot--purple" />
            <i className="logo__dot logo__dot--red" />
          </span>
          <span className="logo__word">Avito</span>
        </NavLink>

        {variant === 'main' ? (
          <>
            <button className="all-categories" {...anchor('header-all-categories')}>
              <span className="all-categories__grid">
                {Array.from({ length: 9 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              Все категории
            </button>

            <div className="search">
              <span className="search__glass">⌕</span>
              <input
                className="search__input"
                placeholder="Поиск по объявлениям"
                {...anchor('header-search')}
              />
              <button className="search__button">Найти</button>
            </div>

            <button className="city" {...anchor('header-city')}>
              <span className="city__pin">▾</span> {CITY}
            </button>
          </>
        ) : (
          <nav className="vertical-nav">
            {PROFILE_NAV.map((item) => (
              <span key={item} className="vertical-nav__link">
                {item}
              </span>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
