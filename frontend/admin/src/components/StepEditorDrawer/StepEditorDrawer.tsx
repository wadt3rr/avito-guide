import {useEffect, useRef, useState} from 'react'
import {getAnchorById, getAnchorGroups} from '../../data/anchors'
import type {IScenarioStep} from '../../data/scenarios'
import {MAX_STEP_CONTENT_LENGTH, MAX_STEP_TITLE_LENGTH} from '../../data/scenarioTypes'
import {Button} from '../Button/Button'
import {Icon} from '../Icon/Icon'
import './StepEditorDrawer.scss'

interface IStepEditorDrawer {
    onClose: () => void
    onDelete: () => void
    onSave: (step: IScenarioStep) => void
    step: IScenarioStep
    stepNumber: number
    scenarioPath: string
}

const customTargetValue = '__custom__'
const onboardingIdPattern = /\[data-onboarding-id="([^"]*)"\]/

function getOnboardingId(target: string) {
  return getAnchorById(target)?.id ?? onboardingIdPattern.exec(target)?.[1] ?? target
}

function updateOnboardingId(target: string, onboardingId: string) {
  const attribute = `[data-onboarding-id="${onboardingId}"]`
  return onboardingIdPattern.test(target)
    ? target.replace(onboardingIdPattern, attribute)
    : onboardingId
}

export function StepEditorDrawer({
                                     onClose,
                                     onDelete,
                                     onSave,
                                     scenarioPath,
                                     step,
                                     stepNumber,
                                 }: IStepEditorDrawer) {
    const drawerRef = useRef<HTMLElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)
    const [title, setTitle] = useState(step.title)
    const [text, setText] = useState(step.text)
    const [selectedTarget, setSelectedTarget] = useState(step.target)
    const [isCustomTarget, setIsCustomTarget] = useState(
        !getAnchorById(step.target),
    )
    const [timeout, setTimeout] = useState(step.timeout)
    const anchorGroups = getAnchorGroups(scenarioPath, selectedTarget)

    useEffect(() => {
        const previousFocus = document.activeElement as HTMLElement | null
        const backgroundElements = [
            document.querySelector<HTMLElement>('.scenario-editor-page__main'),
            document.querySelector<HTMLElement>('.sidebar'),
        ].filter((element): element is HTMLElement => element !== null)

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose()

            if (event.key !== 'Tab' || !drawerRef.current) return

            const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled)',
            )
            const firstElement = focusableElements[0]
            const lastElement = focusableElements[focusableElements.length - 1]

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault()
                lastElement?.focus()
            } else if (!event.shiftKey && document.activeElement === lastElement) {
                event.preventDefault()
                firstElement?.focus()
            }
        }

        const previousOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        backgroundElements.forEach((element) => {
            element.inert = true
        })
        window.addEventListener('keydown', handleKeyDown)
        closeButtonRef.current?.focus()

        return () => {
            document.body.style.overflow = previousOverflow
            backgroundElements.forEach((element) => {
                element.inert = false
            })
            window.removeEventListener('keydown', handleKeyDown)
            previousFocus?.focus()
        }
    }, [onClose])

    return (
        <>
            <button
                aria-label="Закрыть редактор шага"
                className="step-editor-backdrop"
                onClick={onClose}
                type="button"
            />

            <aside
                aria-labelledby="step-editor-title"
                aria-modal="true"
                className="step-editor-drawer"
                ref={drawerRef}
                role="dialog"
            >
                <header className="step-editor-drawer__header">
                    <div>
                        <p className="step-editor-drawer__eyebrow">Редактор шага</p>
                        <h2 id="step-editor-title">Шаг {stepNumber}</h2>
                    </div>
                    <button
                        aria-label="Закрыть"
                        className="step-editor-drawer__close"
                        onClick={onClose}
                        ref={closeButtonRef}
                        type="button"
                    >
                        <Icon name="close" size={20}/>
                    </button>
                </header>

                <div className="step-editor-drawer__body">
                    <label className="drawer-field">
                        <span className="drawer-field__label">Название подсказки</span>
                        <input
                            autoComplete="off"
                            className="drawer-field__control"
                            maxLength={MAX_STEP_TITLE_LENGTH}
                            onChange={(event) => setTitle(event.target.value)}
                            type="text"
                            value={title}
                        />
                    </label>

                    <label className="drawer-field">
                        <span className="drawer-field__label">Текст</span>
                        <textarea
                            autoComplete="off"
                            className="drawer-field__control drawer-field__control--textarea"
                            maxLength={MAX_STEP_CONTENT_LENGTH}
                            onChange={(event) => setText(event.target.value)}
                            rows={4}
                            value={text}
                        />
                    </label>

                    <label className="drawer-field">
                        <span className="drawer-field__label">Целевой элемент</span>
                        <select
                            className="drawer-field__control"
                            onChange={(event) => {
                                const value = event.target.value
                                setIsCustomTarget(value === customTargetValue)
                                if (value === customTargetValue) {
                                    if (getAnchorById(selectedTarget)) {
                                        setSelectedTarget(
                                            `[data-onboarding-id="${selectedTarget}"]`,
                                        )
                                    }
                                } else {
                                    setSelectedTarget(value)
                                }
                            }}
                            value={isCustomTarget ? customTargetValue : selectedTarget}
                        >
                            {anchorGroups.map((anchorGroup) => (
                                <optgroup key={anchorGroup.label} label={anchorGroup.label}>
                                    {anchorGroup.options.map((anchorOption) => (
                                        <option key={anchorOption.id} value={anchorOption.id}>
                                            {anchorOption.label} — {anchorOption.id}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
              <option value={customTargetValue}>Ввести data-onboarding-id вручную</option>
                        </select>
                        {!isCustomTarget && (
                            <span className="drawer-field__hint drawer-field__hint--code">
                [data-onboarding-id=&quot;{selectedTarget}&quot;]
              </span>
                        )}
                    </label>

          {isCustomTarget && (
            <label className="drawer-field">
              <span className="drawer-field__attribute">
                <strong>data-onboarding-id=</strong>
                <input
                  aria-label="Значение data-onboarding-id"
                  autoComplete="off"
                  onChange={(event) =>
                    setSelectedTarget(
                      updateOnboardingId(selectedTarget, event.target.value),
                    )
                  }
                  placeholder="form-title"
                  type="text"
                  value={getOnboardingId(selectedTarget)}
                />
              </span>
              <span className="drawer-field__hint">
                Введите только значение атрибута, например form-title.
              </span>
            </label>
          )}

                    <label className="drawer-field">
                        <span className="drawer-field__label">Таймаут поиска, сек</span>
                        <input
                            autoComplete="off"
                            className="drawer-field__control"
                            min="0"
                            onChange={(event) => setTimeout(event.target.value)}
                            step="1"
                            type="number"
                            value={timeout}
                        />
                        <span className="drawer-field__hint">
                            Сколько ждать появления элемента на странице. 0 — не ждать.
                        </span>
                    </label>
                </div>

                <footer className="step-editor-drawer__footer">
                    <Button onClick={onDelete} variant="danger">Удалить шаг</Button>
                    <Button
                        onClick={() =>
                            onSave({
                                ...step,
                                target: selectedTarget,
                                text,
                                timeout,
                                title,
                            })
                        }
                    >
                        Сохранить шаг
                    </Button>
                </footer>
            </aside>
        </>
    )
}
