import {useCallback, useEffect, useState} from 'react'
import {
    Navigate,
    useNavigate,
    useParams,
} from 'react-router-dom'
import {Button} from '../../components/Button/Button'
import {
    createScenario,
    deleteScenario,
    getScenarioById,
    type ScenarioPublicationAction,
    ScenarioApiError,
    updateScenario,
} from '../../api/scenarios'
import {Icon} from '../../components/Icon/Icon'
import {ScenarioDetailsForm} from '../../components/ScenarioDetailsForm/ScenarioDetailsForm'
import {ScenarioSteps} from '../../components/ScenarioSteps/ScenarioSteps'
import {ScenarioTypeSelector} from '../../components/ScenarioTypeSelector/ScenarioTypeSelector'
import {Sidebar} from '../../components/Sidebar/Sidebar'
import {StandaloneScenarioContent} from '../../components/StandaloneScenarioContent/StandaloneScenarioContent'
import {StepEditorDrawer} from '../../components/StepEditorDrawer/StepEditorDrawer'
import {WidgetPreview} from '../../components/WidgetPreview/WidgetPreview'
import {
    changeScenarioType,
    normalizeScenarioForSave,
    validateScenario,
} from '../../data/scenarioTypes'
import {
    createEmptyStep,
    type IScenario,
    type IScenarioStep,
    type ScenarioType,
} from '../../data/scenarios'
import {useUnsavedChangesWarning} from '../../hooks/useUnsavedChangesWarning'
import './ScenarioEditorPage.scss'

interface ISelectedStep {
    index: number
    value: IScenarioStep
}

const emptyScenario: IScenario = {
    id: '',
    type: 'tooltip',
    title: '',
    description: '',
    path: '',
    status: 'draft',
    steps: [],
}

function describeLoadError(error: unknown) {
    if (error instanceof ScenarioApiError && error.status === 400) {
        return {
            message: 'Некорректная ссылка на сценарий.',
            canRetry: false,
        }
    }
    if (error instanceof ScenarioApiError && error.status === 408) {
        return {
            message: 'API не ответило за 10 секунд. Попробуйте ещё раз.',
            canRetry: true,
        }
    }

    return {
        message: 'Не удалось загрузить сценарий. Проверьте подключение к API.',
        canRetry: true,
    }
}

export function ScenarioEditorPage() {
    const navigate = useNavigate()
    const {scenarioId} = useParams<{ scenarioId: string }>()
    const [scenario, setScenario] = useState<IScenario>(emptyScenario)
    const [savedScenario, setSavedScenario] = useState<IScenario>(emptyScenario)
    const [isLoading, setIsLoading] = useState(Boolean(scenarioId))
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [loadError, setLoadError] = useState('')
    const [canRetryLoad, setCanRetryLoad] = useState(true)
    const [saveError, setSaveError] = useState('')
    const [notFound, setNotFound] = useState(false)
    const [notice, setNotice] = useState('')
    const [selectedStep, setSelectedStep] = useState<ISelectedStep | null>(null)
    const isDirty = JSON.stringify(scenario) !== JSON.stringify(savedScenario)

    useUnsavedChangesWarning(isDirty && !isSaving && !isDeleting)

    useEffect(() => {
        if (!scenarioId) return

        let cancelled = false

        void getScenarioById(scenarioId)
            .then((loadedScenario) => {
                if (!cancelled) {
                    setScenario(loadedScenario)
                    setSavedScenario(loadedScenario)
                }
            })
            .catch((error: unknown) => {
                if (cancelled) return

                if (error instanceof ScenarioApiError && error.status === 404) {
                    setNotFound(true)
                } else {
                    const loadFailure = describeLoadError(error)
                    setLoadError(loadFailure.message)
                    setCanRetryLoad(loadFailure.canRetry)
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [scenarioId])

    const retryLoadScenario = async () => {
        if (!scenarioId) return

        setIsLoading(true)
        setLoadError('')
        setCanRetryLoad(true)
        setNotFound(false)

        try {
            const loadedScenario = await getScenarioById(scenarioId)
            setScenario(loadedScenario)
            setSavedScenario(loadedScenario)
        } catch (error) {
            if (error instanceof ScenarioApiError && error.status === 404) {
                setNotFound(true)
            } else {
                const loadFailure = describeLoadError(error)
                setLoadError(loadFailure.message)
                setCanRetryLoad(loadFailure.canRetry)
            }
        } finally {
            setIsLoading(false)
        }
    }

    const openStepEditor = useCallback(
        (index: number) => {
            const step = scenario.steps[index]
            if (!step) return

            setNotice('')
            setSelectedStep({index, value: step})
        },
        [scenario.steps],
    )

    const addStep = useCallback(() => {
        setNotice('')
        setSelectedStep({
            index: scenario.steps.length,
            value: createEmptyStep(scenario.steps.length),
        })
    }, [scenario.steps.length])

    const closeStepEditor = useCallback(() => setSelectedStep(null), [])

    const reorderSteps = useCallback(
        (fromIndex: number, toIndex: number) => {
            setScenario((currentScenario) => {
                if (
                    fromIndex === toIndex ||
                    fromIndex < 0 ||
                    toIndex < 0 ||
                    fromIndex >= currentScenario.steps.length ||
                    toIndex >= currentScenario.steps.length
                ) {
                    return currentScenario
                }

                const steps = [...currentScenario.steps]
                const [movedStep] = steps.splice(fromIndex, 1)
                if (!movedStep) {
                    return currentScenario
                }
                steps.splice(toIndex, 0, movedStep)
                return {
                    ...currentScenario,
                    steps,
                }
            })
            setNotice('')
        },
        [],
    )

    if (notFound) {
        return <Navigate replace to="/scenarios"/>
    }

    const persistScenario = async (
        publicationAction?: ScenarioPublicationAction,
    ) => {
        const normalizedScenario = normalizeScenarioForSave(scenario)
        const validationError = validateScenario(
            normalizedScenario,
            publicationAction === 'publish' ? 'publish' : 'save',
        )
        if (validationError) {
            setSaveError(validationError)
            return
        }

        setIsSaving(true)
        setSaveError('')
        setNotice('')

        try {
            const savedScenario = normalizedScenario.id
                ? await updateScenario(normalizedScenario, publicationAction)
                : await createScenario(normalizedScenario, publicationAction === 'publish')

            setScenario(savedScenario)
            setSavedScenario(savedScenario)
            navigate(`/scenarios/${savedScenario.id}`, {replace: true})
            setNotice(
                publicationAction === 'publish'
                    ? 'Сценарий опубликован'
                    : publicationAction === 'unpublish'
                        ? 'Сценарий снят с публикации'
                        : 'Изменения сохранены',
            )
        } catch {
            setSaveError('Не удалось сохранить сценарий. Попробуйте ещё раз.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSave = () => {
        void persistScenario()
    }

    const handlePublication = () => {
        void persistScenario(
            scenario.status === 'published' ? 'unpublish' : 'publish',
        )
    }

    const handleDeleteScenario = async () => {
        if (!scenario.id || isDeleting) return

        const confirmed = window.confirm(
            `Удалить сценарий «${scenario.title}»? Шаги, прогресс и аналитика будут удалены безвозвратно.`,
        )
        if (!confirmed) return

        setIsDeleting(true)
        setSaveError('')
        setNotice('')

        try {
            await deleteScenario(scenario.id)
            navigate('/scenarios', {replace: true})
        } catch {
            setSaveError('Не удалось удалить сценарий. Попробуйте ещё раз.')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleDetailsChange = (
        field: 'description' | 'path' | 'title',
        value: string,
    ) => {
        setScenario((currentScenario) => ({
            ...currentScenario,
            [field]: value,
        }))
        setNotice('')
        setSaveError('')
    }

    const handleTypeChange = (type: ScenarioType) => {
        setScenario((currentScenario) => changeScenarioType(currentScenario, type))
        setNotice('')
        setSaveError('')
    }

    const handleStandaloneContentChange = (step: IScenarioStep) => {
        setScenario((currentScenario) => ({
            ...currentScenario,
            steps: [{...step, target: '', timeout: '0'}],
        }))
        setNotice('')
        setSaveError('')
    }

    const saveStep = (updatedStep: IScenarioStep) => {
        if (!selectedStep) return

        setScenario((currentScenario) => {
            const steps = [...currentScenario.steps]
            steps[selectedStep.index] = updatedStep
            return {...currentScenario, steps}
        })
        setSelectedStep(null)
        setNotice('Шаг сохранён')
        setSaveError('')
    }

    const deleteStep = () => {
        if (!selectedStep) return

        if (selectedStep.index < scenario.steps.length) {
            const deletedIndex = selectedStep.index
            setScenario((currentScenario) => ({
                ...currentScenario,
                steps: currentScenario.steps.filter(
                    (_, index) => index !== selectedStep.index,
                ),
            }))
            setNotice('Шаг удалён')
            window.requestAnimationFrame(() => {
                const stepButtons = document.querySelectorAll<HTMLButtonElement>(
                    '.scenario-step__content',
                )
                const nextFocusTarget =
                    stepButtons[Math.min(deletedIndex, stepButtons.length - 1)] ??
                    document.querySelector<HTMLButtonElement>('.scenario-steps__add')
                nextFocusTarget?.focus()
            })
        } else {
            setNotice('Добавление шага отменено')
        }

        setSelectedStep(null)
    }

    if (isLoading) {
        return (
            <div className="scenario-editor-page">
                <Sidebar/>
                <main className="scenario-editor-page__main">
                    <p className="scenario-editor-page__state" role="status">
                        Загружаем сценарий…
                    </p>
                </main>
            </div>
        )
    }

    if (loadError) {
        return (
            <div className="scenario-editor-page">
                <Sidebar/>
                <main className="scenario-editor-page__main">
                    <div className="scenario-editor-page__state" role="alert">
                        <p>{loadError}</p>
                        <div className="scenario-editor-page__state-actions">
                            {canRetryLoad && (
                                <Button onClick={() => void retryLoadScenario()} variant="secondary">
                                    Повторить
                                </Button>
                            )}
                            <Button onClick={() => navigate('/scenarios')}>
                                Все сценарии
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="scenario-editor-page">
            <Sidebar/>

            <main className="scenario-editor-page__main">
                <div className="scenario-editor-page__content">
                    <button
                        className="scenario-editor-page__back"
                        onClick={() => navigate('/scenarios')}
                        type="button"
                    >
                        <Icon name="arrow-left" size={18}/>
                        Все сценарии
                    </button>

                    <header className="scenario-editor-page__header">
                        <div className="scenario-editor-page__title-group">
                            <p className="scenario-editor-page__eyebrow">
                                Редактор сценария
                            </p>
                            <div className="scenario-editor-page__title-row">
                                <h1>{scenario.title || 'Новый сценарий'}</h1>
                                <span
                                    className={`scenario-editor-page__status${scenario.status === 'published' ? ' scenario-editor-page__status--published' : ''}`}
                                >
                  <span/>
                                    {scenario.status === 'published' ? 'Опубликован' : 'Черновик'}
                </span>
                            </div>
                            {notice && (
                                <p className="scenario-editor-page__notice" role="status">
                                    {notice}
                                </p>
                            )}
                            {saveError && (
                                <p className="scenario-editor-page__error" role="alert">
                                    {saveError}
                                </p>
                            )}
                        </div>

                        <div className="scenario-editor-page__actions">
                            <Button
                                className="scenario-editor-page__secondary-action"
                                disabled={isSaving || isDeleting}
                                onClick={handleSave}
                                variant="secondary"
                            >
                                Сохранить
                            </Button>
                            <Button
                                disabled={isSaving || isDeleting}
                                onClick={handlePublication}
                                variant={scenario.status === 'published' ? 'secondary' : 'primary'}
                            >
                                {isSaving
                                    ? 'Сохраняем…'
                                    : scenario.status === 'published'
                                        ? 'Снять с публикации'
                                        : 'Опубликовать'}
                            </Button>
                        </div>
                    </header>

                    <div className="scenario-editor-page__experience">
                        <ScenarioTypeSelector
                            disabled={Boolean(scenario.id)}
                            onChange={handleTypeChange}
                            value={scenario.type}
                        />
                        <WidgetPreview scenario={scenario}/>
                    </div>

                    <div className="scenario-editor-page__sections">
                        <ScenarioDetailsForm
                            description={scenario.description}
                            onChange={handleDetailsChange}
                            path={scenario.path}
                            title={scenario.title}
                        />
                        {scenario.type === 'tooltip' ? (
                            <ScenarioSteps
                                onAddStep={addStep}
                                onReorder={reorderSteps}
                                onSelectStep={openStepEditor}
                                steps={scenario.steps}
                            />
                        ) : (
                            <StandaloneScenarioContent
                                onChange={handleStandaloneContentChange}
                                step={scenario.steps[0]}
                                type={scenario.type}
                            />
                        )}
                    </div>

                    {scenario.id && (
                        <div className="scenario-editor-page__delete-action">
                            <Button
                                disabled={isDeleting || isSaving}
                                onClick={() => void handleDeleteScenario()}
                                variant="danger"
                            >
                                {isDeleting ? 'Удаляем…' : 'Удалить сценарий'}
                            </Button>
                        </div>
                    )}
                </div>
            </main>

            {selectedStep && (
                <StepEditorDrawer
                    key={selectedStep.value.id}
                    onClose={closeStepEditor}
                    onDelete={deleteStep}
                    onSave={saveStep}
                    scenarioPath={scenario.path}
                    step={selectedStep.value}
                    stepNumber={selectedStep.index + 1}
                />
            )}
        </div>
    )
}
