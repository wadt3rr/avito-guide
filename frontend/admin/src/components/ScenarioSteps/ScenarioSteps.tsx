import {DragDropProvider} from '@dnd-kit/react'
import {isSortable} from '@dnd-kit/react/sortable'
import type {IScenarioStep} from '../../data/scenarios'
import {Icon} from '../Icon/Icon'
import {SortableScenarioStep} from '../SortableScenarioStep/SortableScenarioStep'
import './ScenarioSteps.scss'

interface IScenarioSteps {
    steps: IScenarioStep[]
    onAddStep: () => void
    onReorder: (fromIndex: number, toIndex: number) => void
    onSelectStep: (index: number) => void
}

export function ScenarioSteps({
                                  onAddStep,
                                  onReorder,
                                  onSelectStep,
                                  steps,
                              }: IScenarioSteps) {
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
                <DragDropProvider
                    onDragEnd={(event) => {
                        if (event.canceled) return

                        const {source} = event.operation

                        if (!isSortable(source)) return

                        const {initialIndex, index} = source

                        if (initialIndex !== index) {
                            onReorder(initialIndex, index)
                        }
                    }}
                >
                    <ol className="scenario-steps__list">
                        {steps.map((step, index) => (
                            <SortableScenarioStep
                                index={index}
                                key={step.id}
                                onSelect={() => onSelectStep(index)}
                                step={step}
                            />
                        ))}
                    </ol>
                </DragDropProvider>

                <button
                    className="scenario-steps__add"
                    onClick={onAddStep}
                    type="button"
                >
                    <Icon name="add" size={18}/>
                    Добавить шаг
                </button>
            </div>
        </section>
    )
}
