import {
  MAX_SCENARIO_DESCRIPTION_LENGTH,
  MAX_SCENARIO_TITLE_LENGTH,
} from '../../data/scenarioTypes'
import './ScenarioDetailsForm.scss'

interface IScenarioDetailsForm {
  description: string
  path: string
  title: string
  onChange: (field: 'description' | 'path' | 'title', value: string) => void
}

export function ScenarioDetailsForm({
  description,
  onChange,
  path,
  title,
}: IScenarioDetailsForm) {
  return (
    <section className="scenario-details" aria-labelledby="scenario-details-title">
      <div className="scenario-details__heading">
        <p className="scenario-details__eyebrow">Настройки сценария</p>
        <h2 id="scenario-details-title">Основное</h2>
      </div>

      <div className="scenario-details__fields">
        <label className="scenario-field">
          <span className="scenario-field__label">Название сценария</span>
          <input
            autoComplete="off"
            className="scenario-field__control"
            maxLength={MAX_SCENARIO_TITLE_LENGTH}
            onChange={(event) => onChange('title', event.target.value)}
            placeholder="Введите название"
            type="text"
            value={title}
          />
        </label>

        <label className="scenario-field">
          <span className="scenario-field__label">Описание</span>
          <textarea
            autoComplete="off"
            className="scenario-field__control scenario-field__control--textarea"
            maxLength={MAX_SCENARIO_DESCRIPTION_LENGTH}
            onChange={(event) => onChange('description', event.target.value)}
            placeholder="Кратко опишите сценарий"
            rows={4}
            value={description}
          />
        </label>

        <label className="scenario-field">
          <span className="scenario-field__label">Страница запуска</span>
          <input
            autoComplete="off"
            className="scenario-field__control"
            onChange={(event) => onChange('path', event.target.value)}
            placeholder="/path"
            type="text"
            value={path}
          />
        </label>
      </div>
    </section>
  )
}
