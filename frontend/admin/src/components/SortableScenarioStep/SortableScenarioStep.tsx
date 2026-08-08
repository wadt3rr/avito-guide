import type {IScenarioStep} from '../../data/scenarios'
import {useSortable} from '@dnd-kit/react/sortable'
import {Icon} from '../Icon/Icon'

export interface ISortableScenarioStep {
    index: number
    step: IScenarioStep
    onSelect: () => void
}

export function SortableScenarioStep({
                                         index,
                                         onSelect,
                                         step,
                                     }: ISortableScenarioStep) {
    const {handleRef, isDragging, ref} = useSortable({
        id: step.id,
        index,
    })

    return (
        <li
            className={`scenario-step${isDragging ? ' scenario-step--dragging' : ''}`}
            ref={ref}
        >
            <button
                className="scenario-step__content"
                onClick={onSelect}
                type="button"
            >
                <span className="scenario-step__number">{index + 1}</span>
                <span className="scenario-step__name">{step.title}</span>
            </button>

            <button
                aria-label={`Переместить шаг ${index + 1}: ${step.title}`}
                className="scenario-step__handle"
                ref={handleRef}
                type="button"
            >
                <Icon name="grip" size={20}/>
            </button>
        </li>
    )
}
