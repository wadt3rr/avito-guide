import { Button } from '../Button/Button'
import { Icon } from '../Icon/Icon'
import './ListingCard.scss'

export type ListingStatus = 'published' | 'draft'

export type ListingCardProps = {
  title: string
  status: ListingStatus
  steps: number
  path: string
  canOpen?: boolean
}

const statusLabels = {
  published: 'Опубликован',
  draft: 'Черновик',
} satisfies Record<ListingStatus, string>

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

export function ListingCard({
  canOpen = false,
  path,
  status,
  steps,
  title,
}: ListingCardProps) {
  return (
    <article className="listing-card">
      <div className="listing-card__header">
        <h2 className="listing-card__title">{title}</h2>
        <span
          className={`listing-card__status listing-card__status--${status}`}
        >
          <span className="listing-card__status-dot" />
          {statusLabels[status]}
        </span>
      </div>

      <div className="listing-card__metadata">
        <span className="listing-card__chip">
          <Icon name="list" size={14} />
          {formatSteps(steps)}
        </span>
        <span className="listing-card__chip">
          <Icon name="link" size={14} />
          {path}
        </span>
      </div>

      <div className="listing-card__footer">
        <div className="listing-card__actions">
          {canOpen && <Button variant="secondary">Открыть</Button>}
          <Button>Редактировать</Button>
        </div>
      </div>
    </article>
  )
}
