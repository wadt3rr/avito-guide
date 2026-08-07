import './ScenarioDetailsForm.scss'

export function ScenarioDetailsForm() {
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
            className="scenario-field__control"
            defaultValue="Как разместить первое объявление"
            type="text"
          />
        </label>

        <label className="scenario-field">
          <span className="scenario-field__label">Описание</span>
          <textarea
            className="scenario-field__control scenario-field__control--textarea"
            defaultValue="Помогает пользователю создать первое объявление"
            rows={4}
          />
        </label>

        <label className="scenario-field">
          <span className="scenario-field__label">Страница запуска</span>
          <input
            className="scenario-field__control"
            defaultValue="/create"
            type="text"
          />
          <span className="scenario-field__hint">
            Путь, на котором сценарий стартует автоматически
          </span>
        </label>
      </div>
    </section>
  )
}
