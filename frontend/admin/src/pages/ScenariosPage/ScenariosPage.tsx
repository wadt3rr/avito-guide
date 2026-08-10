import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {getScenarios} from '../../api/scenarios'
import {Button} from '../../components/Button/Button'
import {CreateScenarioCard} from '../../components/CreateScenarioCard/CreateScenarioCard'
import {Icon} from '../../components/Icon/Icon'
import {ScenariosCard} from '../../components/ScenariosCard/ScenariosCard'
import {Sidebar} from '../../components/Sidebar/Sidebar'
import type {IScenario} from '../../data/scenarios'
import './ScenariosPage.scss'

export function ScenariosPage() {
    const navigate = useNavigate()
    const [scenarios, setScenarios] = useState<IScenario[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false

        void getScenarios()
            .then((loadedScenarios) => {
                if (!cancelled) setScenarios(loadedScenarios)
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Не удалось загрузить сценарии. Проверьте, что API запущено.')
                }
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    const retryLoadScenarios = async () => {
        setIsLoading(true)
        setError('')

        try {
            setScenarios(await getScenarios())
        } catch {
            setError('Не удалось загрузить сценарии. Проверьте, что API запущено.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="scenarios-page">
            <Sidebar/>

            <main className="scenarios-page__main">
                <div className="scenarios-page__content">
                    <div className="scenarios-page__heading-row">
                        <h1 className="scenarios-page__title">Сценарии</h1>
                        <Button
                            className="scenarios-page__create-button"
                            leadingIcon={<Icon name="add" size={18}/>}
                            onClick={() => navigate('/scenarios/new')}
                        >
                            Создать сценарий
                        </Button>
                    </div>

                    {isLoading && (
                        <p className="scenarios-page__state" role="status">
                            Загрузка
                        </p>
                    )}

                    {error && (
                        <div className="scenarios-page__error" role="alert">
                            <p>{error}</p>
                            <Button onClick={() => void retryLoadScenarios()} variant="secondary">
                                Повторить
                            </Button>
                        </div>
                    )}

                    {!isLoading && !error && (
                    <section aria-label="Список сценариев" className="scenarios-grid">
                        {scenarios.map((scenario) => (
                            <ScenariosCard
                                id={scenario.id}
                                key={scenario.id}
                                path={scenario.path}
                                status={scenario.status}
                                steps={scenario.steps.length}
                                title={scenario.title}
                            />
                        ))}

                        <CreateScenarioCard/>
                    </section>
                    )}
                </div>
            </main>
        </div>
    )
}
