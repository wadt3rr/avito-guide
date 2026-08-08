import { useNavigate } from 'react-router-dom'
import { Icon } from '../Icon/Icon'
import './CreateScenarioCard.scss'

export function CreateScenarioCard() {
  const navigate = useNavigate()

  return (
    <button
      className="create-scenario-card"
      onClick={() => navigate('/scenarios/new')}
      type="button"
    >
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
