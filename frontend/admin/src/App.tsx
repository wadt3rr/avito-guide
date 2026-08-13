import './App.css'
import { Navigate, type RouteObject } from 'react-router-dom'
import {ProtectedRoute} from './auth/ProtectedRoute'
import {RoleGuard} from './auth/RoleGuard'
import {AdminShell} from './components/AdminShell/AdminShell'
import { AnalyticsPage } from './pages/AnalyticsPage/AnalyticsPage'
import {ForbiddenPage} from './pages/ForbiddenPage/ForbiddenPage'
import {LoginPage} from './pages/LoginPage/LoginPage'
import { ScenarioEditorPage } from './pages/ScenarioEditorPage/ScenarioEditorPage'
import { ScenariosPage } from './pages/ScenariosPage/ScenariosPage'
import {UsersPage} from './pages/UsersPage/UsersPage'

export const appRoutes: RouteObject[] = [
  {element: <LoginPage/>, path: '/login'},
  {
    element: <ProtectedRoute/>,
    children: [
      {
        element: <AdminShell/>,
        children: [
          {element: <Navigate replace to="/scenarios" />, path: '/'},
          {element: <AnalyticsPage />, path: '/analytics'},
          {element: <ScenariosPage />, path: '/scenarios'},
          {element: <ScenarioEditorPage />, path: '/scenarios/new'},
          {element: <ScenarioEditorPage />, path: '/scenarios/:scenarioId'},
          {
            element: <RoleGuard roles={['superadmin']}/>,
            children: [{element: <UsersPage/>, path: '/users'}],
          },
          {element: <ForbiddenPage/>, path: '/forbidden'},
          {element: <Navigate replace to="/scenarios" />, path: '*'},
        ],
      },
    ],
  },
]
