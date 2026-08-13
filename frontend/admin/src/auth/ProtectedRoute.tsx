import {Navigate, Outlet, useLocation} from 'react-router-dom'
import {useAuth} from './auth-context'

export function ProtectedRoute() {
  const {status} = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <div aria-live="polite" role="status">Проверяем сессию…</div>
  }
  if (status !== 'authenticated') {
    return <Navigate replace state={{from: `${location.pathname}${location.search}`}} to="/login"/>
  }
  return <Outlet/>
}
