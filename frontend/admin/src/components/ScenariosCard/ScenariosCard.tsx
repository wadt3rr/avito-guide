import { Button } from '../Button/Button'
import { Icon } from '../Icon/Icon'
import './ScenariosCard.scss'

export type ScenarioStatus = 'published' | 'draft'

export type ScenariosCardProps = {
  title: string
  status: ScenarioStatus
  steps: number
  path: string
  canOpen?: boolean
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
  canOpen = false,
  path,
  status,
  steps,
  title,
}: ScenariosCardProps) {
  return (
    <article className="scenarios-card">
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

      <div className="scenarios-card__footer">
        <div className="scenarios-card__actions">
          {canOpen && <Button variant="secondary">Открыть</Button>}
          <Button>Редактировать</Button>
        </div>
      </div>
    </article>
  )
}
