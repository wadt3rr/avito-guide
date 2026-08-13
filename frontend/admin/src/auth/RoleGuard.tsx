import {Navigate, Outlet} from 'react-router-dom'
import {useAuth} from './auth-context'
import type {UserRole} from './session'

export function RoleGuard({roles}: {roles: UserRole[]}) {
  const {user} = useAuth()
  return user && roles.includes(user.role) ? <Outlet/> : <Navigate replace to="/forbidden"/>
}
