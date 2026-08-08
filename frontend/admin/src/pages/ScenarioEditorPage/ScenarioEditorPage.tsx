import {useCallback, useEffect, useState} from 'react'
import {
    Navigate,
    useNavigate,
    useParams,
} from 'react-router-dom'
import {Button} from '../../components/Button/Button'
import {
    createScenario,
    getScenarioById,
    type ScenarioPublicationAction,
    ScenarioApiError,
    updateScenario,
} from '../../api/scenarios'
import {Icon} from '../../components/Icon/Icon'
import {ScenarioDetailsForm} from '../../components/ScenarioDetailsForm/ScenarioDetailsForm'
import {ScenarioSteps} from '../../components/ScenarioSteps/ScenarioSteps'
import {Sidebar} from '../../components/Sidebar/Sidebar'
import {StepEditorDrawer} from '../../components/StepEditorDrawer/StepEditorDrawer'
import {
    createEmptyStep,
    type IScenario,
    type IScenarioStep,
} from '../../data/scenarios'
import './ScenarioEditorPage.scss'

interface ISelectedStep {
    index: number
    value: IScenarioStep
}

const emptyScenario: IScenario = {
    id: '',
    title: '',
    description: '',
    path: '',
    status: 'draft',
    steps: [],
}

export function ScenarioEditorPage() {
    const navigate = useNavigate()
    const {scenarioId} = useParams<{ scenarioId: string }>()
    const [scenario, setScenario] = useState<IScenario>(emptyScenario)
    const [isLoading, setIsLoading] = useState(Boolean(scenarioId))
    const [isSaving, setIsSaving] = useState(false)
    const [loadError, setLoadError] = useState('')
    const [saveError, setSaveError] = useState('')
    const [notFound, setNotFound] = useState(false)
    const [notice, setNotice] = useState('')
    const [selectedStep, setSelectedStep] = useState<ISelectedStep | null>(null)

    useEffect(() => {
        if (!scenarioId) return

        let cancelled = false

        void getScenarioById(scenarioId)
            .then((loadedScenario) => {
                if (!cancelled) setScenario(loadedScenario)
            })
            .catch((error: unknown) => {
                if (cancelled) return

                if (error instanceof ScenarioApiError && error.status === 404) {
                    setNotFound(true)
                } else {
                    setLoadError('Не удалось загрузить сценарий. Проверьте подключение к API.')
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
        setNotFound(false)

        try {
            setScenario(await getScenarioById(scenarioId))
        } catch (error) {
            if (error instanceof ScenarioApiError && error.status === 404) {
                setNotFound(true)
            } else {
                setLoadError('Не удалось загрузить сценарий. Проверьте подключение к API.')
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
        if (!scenario.title.trim()) {
            setSaveError('Введите название сценария.')
            return
        }

        setIsSaving(true)
        setSaveError('')
        setNotice('')

        try {
            const savedScenario = scenario.id
                ? await updateScenario(scenario, publicationAction)
                : await createScenario(scenario, publicationAction === 'publish')

            setScenario(savedScenario)
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
                            <Button onClick={() => void retryLoadScenario()} variant="secondary">
                                Повторить
                            </Button>
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
                                disabled={isSaving}
                                onClick={handleSave}
                                variant="secondary"
                            >
                                Сохранить
                            </Button>
                            <Button
                                disabled={isSaving}
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

                    <div className="scenario-editor-page__sections">
                        <ScenarioDetailsForm
                            description={scenario.description}
                            onChange={handleDetailsChange}
                            path={scenario.path}
                            title={scenario.title}
                        />
                        <ScenarioSteps
                            onAddStep={addStep}
                            onReorder={reorderSteps}
                            onSelectStep={openStepEditor}
                            steps={scenario.steps}
                        />
                    </div>

                    {scenario.id && (
                        <div className="scenario-editor-page__delete-action">
                            <Button variant="danger">Удалить сценарий</Button>
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
