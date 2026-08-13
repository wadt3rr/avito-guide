import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PROFILE_MENU, PROFILE_NAME, PROFILE_RATING, PROFILE_REVIEWS } from '../data/mock';
import { anchor } from '../onboarding-anchors';

export function ProfileSidebar({ active }: { active: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <aside
      className={`profile-side${isMenuOpen ? ' profile-side--open' : ''}`}
      {...anchor('profile-menu')}
    >
      <div className="profile-side__summary">
        <div>
          <div className="profile-side__name">{PROFILE_NAME}</div>
          <div className="profile-side__rating">
            <b>{PROFILE_RATING}</b>
            <span className="profile-side__stars">★★★★★</span>
            <a className="profile-side__reviews">{PROFILE_REVIEWS}</a>
          </div>
          <div className="profile-side__active">{active}</div>
        </div>

        <button
          type="button"
          className="profile-side__toggle"
          aria-controls="profile-sidebar-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Закрыть разделы профиля' : 'Открыть разделы профиля'}
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
        >
          <span aria-hidden="true">⌄</span>
        </button>
      </div>

      <div id="profile-sidebar-menu" className="profile-side__menu">
        {PROFILE_MENU.map((group) => (
          <nav key={group.group} className="profile-side__group">
            {group.items.map((item) => {
              const className = `profile-side__item${
                item.label === active ? ' profile-side__item--active' : ''
              }`;
              const content = (
                <>
                  {item.label}
                  {item.badge && <i className="profile-side__badge">{item.badge}</i>}
                </>
              );

              return item.to ? (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={className}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {content}
                </NavLink>
              ) : (
                <span key={item.label} className={className}>
                  {content}
                </span>
              );
            })}
          </nav>
        ))}
      </div>
    </aside>
  );
}
