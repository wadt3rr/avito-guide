import './App.css'
import { Navigate, type RouteObject } from 'react-router-dom'
import { AnalyticsPage } from './pages/AnalyticsPage/AnalyticsPage'
import { ScenarioEditorPage } from './pages/ScenarioEditorPage/ScenarioEditorPage'
import { ScenariosPage } from './pages/ScenariosPage/ScenariosPage'

export const appRoutes: RouteObject[] = [
  {element: <Navigate replace to="/scenarios" />, path: '/'},
  {element: <AnalyticsPage />, path: '/analytics'},
  {element: <ScenariosPage />, path: '/scenarios'},
  {element: <ScenarioEditorPage />, path: '/scenarios/new'},
  {element: <ScenarioEditorPage />, path: '/scenarios/:scenarioId'},
  {element: <Navigate replace to="/scenarios" />, path: '*'},
]
