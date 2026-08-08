import {NavLink} from 'react-router-dom'
import {Icon, type IconName} from '../Icon/Icon'
import './Sidebar.scss'

interface INavigationItem {
    label: string
    icon: IconName
    path?: string
}

const navigationItems: INavigationItem[] = [
    {label: 'Аналитика', icon: 'analytics', path: '/analytics'},
    {label: 'Сценарии', icon: 'scenarios', path: '/scenarios'},
]

export function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar__brand">Avito Tipper</div>

            <nav aria-label="Основная навигация" className="sidebar__navigation">
                {navigationItems.map(({icon, label, path}) =>
                    path ? (
                        <NavLink
                            className={({isActive}) =>
                                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                            }
                            key={label}
                            to={path}
                        >
                            <Icon name={icon} size={20}/>
                            <span>{label}</span>
                        </NavLink>
                    ) : (
                        <button className="sidebar__link" disabled key={label} type="button">
                            <Icon name={icon} size={20}/>
                            <span>{label}</span>
                        </button>
                    ),
                )}
            </nav>
        </aside>
    )
}
