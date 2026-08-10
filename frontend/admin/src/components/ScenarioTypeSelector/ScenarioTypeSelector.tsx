import type {ScenarioType} from '../../data/scenarios'
import {Icon, type IconName} from '../Icon/Icon'
import './ScenarioTypeSelector.scss'

interface IScenarioTypeSelector {
  disabled: boolean
  onChange: (type: ScenarioType) => void
  value: ScenarioType
}

const options: Array<{
  icon: IconName
  label: string
  value: ScenarioType
}> = [
  {icon: 'tooltip', label: 'Тултип-цепочка', value: 'tooltip'},
  {icon: 'modal', label: 'Модальное окно', value: 'modal'},
  {icon: 'banner', label: 'Баннер', value: 'banner'},
]

export function ScenarioTypeSelector({disabled, onChange, value}: IScenarioTypeSelector) {
  return (
    <fieldset className="scenario-type-selector">
      <legend>Тип виджета</legend>
      <div className="scenario-type-selector__options">
        {options.map((option) => (
          <label
            className={`scenario-type-option${option.value === value ? ' scenario-type-option--selected' : ''}`}
            key={option.value}
          >
            <input
              checked={option.value === value}
              disabled={disabled}
              name="scenario-type"
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <Icon name={option.icon} size={22}/>
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {disabled && (
        <p className="scenario-type-selector__hint">
          Тип нельзя изменить после создания сценария.
        </p>
      )}
    </fieldset>
  )
}
