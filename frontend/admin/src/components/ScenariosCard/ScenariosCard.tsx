import { Link } from 'react-router-dom'
import type { ScenarioStatus } from '../../data/scenarios'
import { Icon } from '../Icon/Icon'
import './ScenariosCard.scss'

export interface IScenariosCard {
  id: string
  title: string
  status: ScenarioStatus
  steps: number
  path: string
}

const statusLabels = {
  published: 'Опубликован',
  draft: 'Черновик',
} satisfies Record<ScenarioStatus, string>

function formatSteps(steps: number) {
  const lastDigit = steps % 10
  const lastTwoDigits = steps % 100

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${steps} шаг`
  }

  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 12 || lastTwoDigits > 14)
  ) {
    return `${steps} шага`
  }

  return `${steps} шагов`
}

export function ScenariosCard({
  id,
  path,
  status,
  steps,
  title,
}: IScenariosCard) {
  return (
    <article className="scenarios-card">
      <Link className="scenarios-card__link" to={`/scenarios/${id}`}>
        <div className="scenarios-card__header">
          <h2 className="scenarios-card__title">{title}</h2>
          <span
            className={`scenarios-card__status scenarios-card__status--${status}`}
          >
            <span className="scenarios-card__status-dot" />
            {statusLabels[status]}
          </span>
        </div>

        <div className="scenarios-card__metadata">
          <span className="scenarios-card__chip">
            <Icon name="list" size={14} />
            {formatSteps(steps)}
          </span>
          <span className="scenarios-card__chip">
            <Icon name="link" size={14} />
            {path}
          </span>
        </div>
      </Link>
    </article>
  )
}
