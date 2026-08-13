import type {IScenarioStep, ScenarioType} from '../../data/scenarios'
import {
  getStepPlaceholders,
  MAX_STEP_CONTENT_LENGTH,
  MAX_STEP_TITLE_LENGTH,
} from '../../data/scenarioTypes'
import './StandaloneScenarioContent.scss'

interface IStandaloneScenarioContent {
  onChange: (step: IScenarioStep) => void
  step: IScenarioStep
  type: Exclude<ScenarioType, 'tooltip'>
}

export function StandaloneScenarioContent({
  onChange,
  step,
  type,
}: IStandaloneScenarioContent) {
  const isModal = type === 'modal'
  const widgetName = isModal ? 'модального окна' : 'баннера'
  const placeholders = getStepPlaceholders(type)

  return (
    <section className="standalone-content" aria-labelledby="standalone-content-title">
      <div className="standalone-content__heading">
        <p>Содержимое виджета</p>
        <h2 id="standalone-content-title">Наполнение</h2>
        <span>
          {isModal
            ? 'Появится поверх страницы с затемнением фона.'
            : 'Появится сверху страницы и не заблокирует интерфейс.'}
        </span>
      </div>

      <div className="standalone-content__fields">
        <label className="standalone-field">
          <span>Заголовок {widgetName}</span>
          <input
            aria-label={`Заголовок ${widgetName}`}
            autoComplete="off"
            maxLength={MAX_STEP_TITLE_LENGTH}
            onChange={(event) => onChange({...step, title: event.target.value})}
            placeholder={placeholders.title}
            type="text"
            value={step.title}
          />
        </label>

        <label className="standalone-field">
          <span>Текст сообщения</span>
          <textarea
            aria-label="Текст сообщения"
            maxLength={MAX_STEP_CONTENT_LENGTH}
            onChange={(event) => onChange({...step, text: event.target.value})}
            placeholder={placeholders.content}
            rows={4}
            value={step.text}
          />
        </label>
      </div>
    </section>
  )
}
