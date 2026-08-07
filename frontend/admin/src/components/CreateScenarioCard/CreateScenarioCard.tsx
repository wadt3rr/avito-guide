import { Icon } from '../Icon/Icon'
import './CreateScenarioCard.scss'

export function CreateScenarioCard() {
  return (
    <button className="create-scenario-card" type="button">
      <span className="create-scenario-card__icon">
        <Icon name="add" size={24} />
      </span>
      <span className="create-scenario-card__title">Новый сценарий</span>
      <span className="create-scenario-card__description">
        Начать с чистого листа
      </span>
    </button>
  )
}
