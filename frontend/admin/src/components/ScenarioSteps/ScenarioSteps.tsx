import { Icon } from '../Icon/Icon'
import './ScenarioSteps.scss'

type ScenarioStepsProps = {
  onSelectStep: () => void
}

const steps = [
  'Название объявления',
  'Добавьте фотографии',
  'Укажите цену',
  'Опубликуйте объявление',
]

export function ScenarioSteps({ onSelectStep }: ScenarioStepsProps) {
  return (
    <section className="scenario-steps" aria-labelledby="scenario-steps-title">
      <div className="scenario-steps__heading">
        <p className="scenario-steps__eyebrow">Путь пользователя</p>
        <h2 id="scenario-steps-title">Шаги</h2>
        <p className="scenario-steps__description">
          Настройте последовательность подсказок в сценарии.
        </p>
      </div>

      <div className="scenario-steps__content">
        <ol className="scenario-steps__list">
          {steps.map((step, index) => (
            <li key={step}>
              <button
                className="scenario-step"
                onClick={onSelectStep}
                type="button"
              >
                <span className="scenario-step__number">{index + 1}</span>
                <span className="scenario-step__name">{step}</span>
                <Icon className="scenario-step__grip" name="grip" size={20} />
              </button>
            </li>
          ))}
        </ol>

        <button
          className="scenario-steps__add"
          onClick={onSelectStep}
          type="button"
        >
          <Icon name="add" size={18} />
          Добавить шаг
        </button>
      </div>
    </section>
  )
}
