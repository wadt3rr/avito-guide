import { Button } from '../Button/Button'
import { Icon, type IconName } from '../Icon/Icon'
import './Sidebar.scss'

type NavigationItem = {
  label: string
  icon: IconName
  active?: boolean
}

const navigationItems: NavigationItem[] = [
  { label: 'Аналитика', icon: 'analytics' },
  { label: 'Сценарии', icon: 'scenarios', active: true },
  { label: 'Настройки', icon: 'settings' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">Avito Tipper</div>

      <nav aria-label="Основная навигация" className="sidebar__navigation">
        {navigationItems.map(({ active, icon, label }) => (
          <a
            aria-current={active ? 'page' : undefined}
            className={`sidebar__link${active ? ' sidebar__link--active' : ''}`}
            href="#"
            key={label}
          >
            <Icon name={icon} size={20} />
            <span>{label}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar__footer">
        <Button
          className="sidebar__create-button"
          leadingIcon={<Icon name="add" size={18} />}
        >
          Новый сценарий
        </Button>

        <a className="sidebar__link" href="#">
          <Icon name="logout" size={18} />
          <span>Выйти</span>
        </a>
      </div>
    </aside>
  )
}
