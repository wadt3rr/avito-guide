import { Sidebar } from '../../components/Sidebar/Sidebar'
import './AnalyticsPage.scss'

export function AnalyticsPage() {
  return (
    <div className="analytics-page">
      <Sidebar />

      <main className="analytics-page__main">
        <div className="analytics-page__content">
          <h1 className="analytics-page__title">Аналитика</h1>
          <p className="analytics-page__description">
            Здесь появится статистика по сценариям после подключения данных.
          </p>
        </div>
      </main>
    </div>
  )
}
