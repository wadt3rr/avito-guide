import { useCallback, useState } from 'react'
import { Button } from '../../components/Button/Button'
import { Icon } from '../../components/Icon/Icon'
import { ScenarioDetailsForm } from '../../components/ScenarioDetailsForm/ScenarioDetailsForm'
import { ScenarioSteps } from '../../components/ScenarioSteps/ScenarioSteps'
import { Sidebar } from '../../components/Sidebar/Sidebar'
import { StepEditorDrawer } from '../../components/StepEditorDrawer/StepEditorDrawer'
import './ScenarioEditorPage.scss'

export function ScenarioEditorPage() {
  const [isStepEditorOpen, setIsStepEditorOpen] = useState(false)

  const openStepEditor = useCallback(() => setIsStepEditorOpen(true), [])
  const closeStepEditor = useCallback(() => setIsStepEditorOpen(false), [])

  return (
    <div className="scenario-editor-page">
      <Sidebar />

      <main className="scenario-editor-page__main">
        <div className="scenario-editor-page__content">
          <button className="scenario-editor-page__back" type="button">
            <Icon name="arrow-left" size={18} />
            Все сценарии
          </button>

          <header className="scenario-editor-page__header">
            <div className="scenario-editor-page__title-group">
              <p className="scenario-editor-page__eyebrow">Редактор сценария</p>
              <div className="scenario-editor-page__title-row">
                <h1>Первое объявление</h1>
                <span className="scenario-editor-page__status">
                  <span />
                  Черновик
                </span>
              </div>
              <p className="scenario-editor-page__subtitle">
                Настройте содержание сценария и последовательность подсказок.
              </p>
            </div>

            <div className="scenario-editor-page__actions">
              <Button
                className="scenario-editor-page__secondary-action"
                variant="secondary"
              >
                Сохранить
              </Button>
              <Button
                className="scenario-editor-page__secondary-action"
                variant="secondary"
              >
                Предпросмотр
              </Button>
              <Button>Опубликовать</Button>
            </div>
          </header>

          <div className="scenario-editor-page__sections">
            <ScenarioDetailsForm />
            <ScenarioSteps onSelectStep={openStepEditor} />
          </div>
        </div>
      </main>

      <StepEditorDrawer
        isOpen={isStepEditorOpen}
        onClose={closeStepEditor}
      />
    </div>
  )
}
