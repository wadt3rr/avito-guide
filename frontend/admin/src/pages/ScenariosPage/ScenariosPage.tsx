import { Button } from '../../components/Button/Button'
import { CreateScenarioCard } from '../../components/CreateScenarioCard/CreateScenarioCard'
import { Icon } from '../../components/Icon/Icon'
import {
  ScenariosCard,
  type ScenariosCardProps,
} from '../../components/ScenariosCard/ScenariosCard'
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
] satisfies ScenariosCardProps[]

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
              <ScenariosCard key={scenario.title} {...scenario} />
            ))}

            <CreateScenarioCard />
          </section>
        </div>
      </main>
    </div>
  )
}
