import './App.css'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AnalyticsPage } from './pages/AnalyticsPage/AnalyticsPage'
import { ScenarioEditorPage } from './pages/ScenarioEditorPage/ScenarioEditorPage'
import { ScenariosPage } from './pages/ScenariosPage/ScenariosPage'

function App() {
  return (
    <Routes>
      <Route element={<Navigate replace to="/scenarios" />} path="/" />
      <Route element={<AnalyticsPage />} path="/analytics" />
      <Route element={<ScenariosPage />} path="/scenarios" />
      <Route element={<ScenarioEditorPage />} path="/scenarios/new" />
      <Route
        element={<ScenarioEditorPage />}
        path="/scenarios/:scenarioId"
      />
      <Route element={<Navigate replace to="/scenarios" />} path="*" />
    </Routes>
  )
}

export default App
