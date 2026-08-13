import {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import {
    getScenarioAnalytics,
    getScenarioAnalyticsReport,
    getScenarios,
    type IScenarioAnalytics,
} from '../../api/scenarios'
import {Button} from '../../components/Button/Button'
import type {IScenario} from '../../data/scenarios'
import './AnalyticsPage.scss'

function formatUsers(count: number) {
    const lastDigit = count % 10
    const lastTwoDigits = count % 100

    if (lastDigit === 1 && lastTwoDigits !== 11) {
        return `${count} пользователь`
    }

    if (
        lastDigit >= 2 &&
        lastDigit <= 4 &&
        (lastTwoDigits < 12 || lastTwoDigits > 14)
    ) {
        return `${count} пользователя`
    }

    return `${count} пользователей`
}

function getPercent(completed: number, started: number) {
    if (started === 0) return 0
    return Math.round((completed / started) * 100)
}

export function AnalyticsPage() {
    const [scenarios, setScenarios] = useState<IScenario[]>([])
    const [selectedScenarioId, setSelectedScenarioId] = useState('')
    const [analytics, setAnalytics] = useState<IScenarioAnalytics | null>(null)
    const [isScenariosLoading, setIsScenariosLoading] = useState(true)
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false)
    const [scenariosError, setScenariosError] = useState(false)
    const [analyticsError, setAnalyticsError] = useState(false)
    const [scenariosReloadKey, setScenariosReloadKey] = useState(0)
    const [analyticsReloadKey, setAnalyticsReloadKey] = useState(0)
    const [isReportLoading, setIsReportLoading] = useState(false)
    const [reportError, setReportError] = useState(false)

    useEffect(() => {
        let cancelled = false

        void getScenarios()
            .then((loadedScenarios) => {
                if (cancelled) return

                const defaultScenarioId =
                    loadedScenarios.find(({status}) => status === 'published')?.id ??
                    loadedScenarios[0]?.id ??
                    ''

                setScenarios(loadedScenarios)
                setAnalytics(null)
                setAnalyticsError(false)
                setIsAnalyticsLoading(Boolean(defaultScenarioId))
                setSelectedScenarioId(defaultScenarioId)
            })
            .catch(() => {
                if (!cancelled) setScenariosError(true)
            })
            .finally(() => {
                if (!cancelled) setIsScenariosLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [scenariosReloadKey])

    useEffect(() => {
        if (!selectedScenarioId) return

        let cancelled = false

        void getScenarioAnalytics(selectedScenarioId)
            .then((loadedAnalytics) => {
                if (!cancelled) setAnalytics(loadedAnalytics)
            })
            .catch(() => {
                if (!cancelled) {
                    setAnalytics(null)
                    setAnalyticsError(true)
                }
            })
            .finally(() => {
                if (!cancelled) setIsAnalyticsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [analyticsReloadKey, selectedScenarioId])

    const selectedScenario = scenarios.find(
        ({id}) => id === selectedScenarioId,
    )
    const isLoading = isScenariosLoading || isAnalyticsLoading
    const hasError = scenariosError || analyticsError
    const hasNoScenarios = !isScenariosLoading && !scenariosError && scenarios.length === 0
    const hasNoAnalytics = analytics?.started === 0

    const selectScenario = (scenarioId: string) => {
        setAnalytics(null)
        setAnalyticsError(false)
        setReportError(false)
        setIsAnalyticsLoading(true)
        setSelectedScenarioId(scenarioId)
    }

    const downloadReport = async () => {
        if (!selectedScenarioId || isReportLoading) return

        setIsReportLoading(true)
        setReportError(false)

        try {
            const {blob, filename} = await getScenarioAnalyticsReport(selectedScenarioId)
            const objectUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = objectUrl
            link.download = filename
            document.body.append(link)
            link.click()
            link.remove()
            globalThis.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
        } catch {
            setReportError(true)
        } finally {
            setIsReportLoading(false)
        }
    }

    const retryLoad = () => {
        if (scenariosError) {
            setIsScenariosLoading(true)
            setScenariosError(false)
            setScenariosReloadKey((key) => key + 1)
            return
        }

        setIsAnalyticsLoading(true)
        setAnalyticsError(false)
        setAnalyticsReloadKey((key) => key + 1)
    }

    return (
        <div className="analytics-page">

            <main className="analytics-page__main">
                <div className="analytics-page__content">
                    <header className="analytics-page__header">
                        <h1 className="analytics-page__title">Аналитика</h1>
                        {selectedScenario && (
                            <Link
                                className="analytics-page__edit-link"
                                to={`/scenarios/${selectedScenario.id}`}
                            >
                                Редактировать сценарий
                            </Link>
                        )}
                    </header>

                    {!scenariosError && scenarios.length > 0 && (
                        <div className="analytics-page__scenario-picker">
                            <label className="analytics-page__field">
                                <span className="analytics-page__field-label">Сценарий</span>
                                <span className="analytics-page__select-wrap">
                                    <select
                                        className="analytics-page__select"
                                        disabled={isScenariosLoading}
                                        onChange={(event) =>
                                            selectScenario(event.target.value)
                                        }
                                        value={selectedScenarioId}
                                    >
                                        {scenarios.map((scenario) => (
                                            <option key={scenario.id} value={scenario.id}>
                                                {scenario.title}
                                            </option>
                                        ))}
                                    </select>
                                </span>
                            </label>
                            <div className="analytics-page__report-actions">
                                <Button
                                    disabled={isLoading || isReportLoading}
                                    onClick={() => void downloadReport()}
                                    variant="secondary"
                                >
                                    {isReportLoading
                                        ? 'Формируем отчёт…'
                                        : 'Получить отчёт в PDF'}
                                </Button>
                                {reportError && (
                                    <span
                                        className="analytics-page__report-error"
                                        role="alert"
                                    >
                                        Не удалось получить PDF. Попробуйте ещё раз.
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {isLoading && (
                        <div className="analytics-page__state" role="status">
                            <span className="analytics-page__spinner"/>
                            <p>Загрузка</p>
                        </div>
                    )}

                    {!isLoading && hasError && (
                        <div className="analytics-page__state" role="alert">
                            <h2>Не удалось загрузить аналитику</h2>
                            <Button onClick={retryLoad}>Повторить</Button>
                        </div>
                    )}

                    {!isLoading && !hasError && hasNoScenarios && (
                        <div className="analytics-page__state">
                            <h2>Пока нет сценариев</h2>
                            <p>Создайте сценарий, чтобы начать собирать статистику.</p>
                        </div>
                    )}

                    {!isLoading && !hasError && hasNoAnalytics && (
                        <div className="analytics-page__state">
                            <h2>Пока нет данных</h2>
                            <p>
                                Сценарий ещё никто не запускал.<br/>
                                Статистика появится после первого прохождения.
                            </p>
                        </div>
                    )}

                    {!isLoading && !hasError && analytics && analytics.started > 0 && (
                        <>
                            <section
                                aria-label="Основные показатели"
                                className="analytics-page__metrics"
                            >
                                <div className="analytics-page__metric-card">
                                    <span>Запустили</span>
                                    <strong>{formatUsers(analytics.started)}</strong>
                                </div>
                                <div className="analytics-page__metric-card">
                                    <span>Завершили</span>
                                    <strong>{formatUsers(analytics.finished)}</strong>
                                </div>
                                <div className="analytics-page__metric-card">
                                    <span>Завершили сценарий</span>
                                    <strong>{Math.round(analytics.conversion)}%</strong>
                                </div>
                            </section>

                            <section
                                aria-labelledby="analytics-steps-title"
                                className="analytics-page__steps-section"
                            >
                                <h2 id="analytics-steps-title">Прохождение шагов</h2>
                                {analytics.steps.length === 0 ? (
                                    <div className="analytics-page__steps-empty">
                                        В сценарии пока нет шагов.
                                    </div>
                                ) : (
                                    <div className="analytics-page__steps-card">
                                    {analytics.steps.map((step, index) => {
                                        const percent = getPercent(
                                            step.completed,
                                            analytics.started,
                                        )
                                        const previousCompleted =
                                            index === 0
                                                ? analytics.started
                                                : analytics.steps[index - 1]?.completed ??
                                                  analytics.started
                                        const loss = Math.max(
                                            previousCompleted - step.completed,
                                            0,
                                        )

                                        return (
                                            <div
                                                className="analytics-page__step"
                                                key={step.stepId}
                                            >
                                                <span className="analytics-page__step-index">
                                                    {step.stepOrder}
                                                </span>
                                                <div className="analytics-page__step-body">
                                                    <div className="analytics-page__step-heading">
                                                        <span className="analytics-page__step-title">
                                                            {step.title}
                                                        </span>
                                                        <span className="analytics-page__step-stats">
                                                            <span>{formatUsers(step.completed)}</span>
                                                            <strong>{percent}%</strong>
                                                        </span>
                                                    </div>
                                                    <div
                                                        aria-label={`Шаг ${step.stepOrder}: завершили ${percent}%`}
                                                        aria-valuemax={100}
                                                        aria-valuemin={0}
                                                        aria-valuenow={Math.min(percent, 100)}
                                                        className="analytics-page__step-track"
                                                        role="progressbar"
                                                    >
                                                        <span
                                                            className="analytics-page__step-fill"
                                                            style={{
                                                                width: `${Math.min(percent, 100)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    {loss > 0 && (
                                                        <span className="analytics-page__step-loss">
                                                            −{formatUsers(loss)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
