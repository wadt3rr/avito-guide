import {NavLink} from 'react-router-dom'
import {useAuth} from '../../auth/auth-context'
import {Icon, type IconName} from '../Icon/Icon'
import './Sidebar.scss'

interface INavigationItem {
    label: string
    icon: IconName
    path?: string
}

interface SidebarProps {
    mobileOpen?: boolean
    onClose?: () => void
}

export function Sidebar({mobileOpen = false, onClose}: SidebarProps) {
    const {logout, user} = useAuth()
    const navigationItems: INavigationItem[] = [
        {label: 'Аналитика', icon: 'analytics', path: '/analytics'},
        {label: 'Сценарии', icon: 'scenarios', path: '/scenarios'},
        ...(user?.role === 'superadmin'
            ? [{label: 'Пользователи', icon: 'users' as IconName, path: '/users'}]
            : []),
    ]

    return (
        <aside
            aria-label="Навигация админки"
            className={`sidebar${mobileOpen ? ' sidebar--mobile-open' : ''}`}
            id="admin-navigation"
        >
            <div className="sidebar__brand">Avito Tipper</div>
            <button
                aria-label="Закрыть боковое меню"
                className="sidebar__close"
                onClick={onClose}
                type="button"
            >
                <Icon name="close" size={20}/>
            </button>

            <nav aria-label="Основная навигация" className="sidebar__navigation">
                {navigationItems.map(({icon, label, path}) =>
                    path ? (
                        <NavLink
                            className={({isActive}) =>
                                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
                            }
                            key={label}
                            onClick={onClose}
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

            {user && (
                <div className="sidebar__footer">
                    <div className="sidebar__account">
                        <span className="sidebar__account-email">{user.email}</span>
                        <span>{user.role === 'superadmin' ? 'Суперадминистратор' : 'Администратор'}</span>
                    </div>
                    <button
                        aria-label="Выйти"
                        className="sidebar__logout"
                        onClick={() => {
                            onClose?.()
                            logout()
                        }}
                        type="button"
                    >
                        <Icon name="logout" size={18}/>
                        <span>Выйти</span>
                    </button>
                </div>
            )}
        </aside>
    )
}
