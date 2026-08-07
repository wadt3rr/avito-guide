import { NavLink } from 'react-router-dom';
import { PROFILE_MENU, PROFILE_NAME, PROFILE_RATING, PROFILE_REVIEWS } from '../data/mock';
import { anchor } from '../onboarding-anchors';

/** Боковое меню личного кабинета — общее для «Моих объявлений» и «Заказов». */
export function ProfileSidebar({ active }: { active: string }) {
  return (
    <aside className="profile-side" {...anchor('profile-menu')}>
      <div className="profile-side__name">{PROFILE_NAME}</div>
      <div className="profile-side__rating">
        <b>{PROFILE_RATING}</b>
        <span className="profile-side__stars">★★★★★</span>
        <a className="profile-side__reviews">{PROFILE_REVIEWS}</a>
      </div>

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
              <NavLink key={item.label} to={item.to} className={className}>
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
    </aside>
  );
}
