import { Button } from '../../components/Button/Button'
import { Icon } from '../../components/Icon/Icon'
import {
  ListingCard,
  type ListingCardProps,
} from '../../components/ListingCard/ListingCard'
import { Sidebar } from '../../components/Sidebar/Sidebar'
import './ScenariosPage.scss'

const scenarios = [
  {
    title: 'Первое объявление',
    status: 'published',
    steps: 4,
    path: '/create',
    canOpen: true,
  },
  {
    title: 'Настройка профиля продавца',
    status: 'draft',
    steps: 7,
    path: '/profile/edit',
  },
  {
    title: 'Тур по премиум-функциям',
    status: 'published',
    steps: 3,
    path: '/premium',
    canOpen: true,
  },
] satisfies ListingCardProps[]

const topNavigation = ['Все сценарии', 'Шаблоны', 'Архив']

export function ScenariosPage() {
  return (
    <div className="scenarios-page">
      <Sidebar />

      <main className="scenarios-page__main">
        <header className="topbar">
          <nav aria-label="Разделы сценариев" className="topbar__navigation">
            {topNavigation.map((label, index) => (
              <a
                aria-current={index === 0 ? 'page' : undefined}
                className={`topbar__link${index === 0 ? ' topbar__link--active' : ''}`}
                href="#"
                key={label}
              >
                {label}
              </a>
            ))}
          </nav>

          <button aria-label="Поиск" className="topbar__search" type="button">
            <Icon name="search" size={22} />
          </button>
        </header>

        <div className="scenarios-page__content">
          <div className="scenarios-page__heading-row">
            <h1 className="scenarios-page__title">Сценарии</h1>
            <Button
              className="scenarios-page__create-button"
              leadingIcon={<Icon name="add" size={18} />}
            >
              Создать сценарий
            </Button>
          </div>

          <section aria-label="Список сценариев" className="scenarios-grid">
            {scenarios.map((scenario) => (
              <ListingCard key={scenario.title} {...scenario} />
            ))}

            <button className="new-scenario-card" type="button">
              <span className="new-scenario-card__icon">
                <Icon name="add" size={24} />
              </span>
              <span className="new-scenario-card__title">Новый сценарий</span>
              <span className="new-scenario-card__description">
                Начать с чистого листа
              </span>
            </button>
          </section>
        </div>
      </main>
    </div>
  )
}
