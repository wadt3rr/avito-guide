import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {authenticate, getCurrentUser} from '../api/auth'
import {AUTH_UNAUTHORIZED_EVENT} from '../api/client'
import {AuthContext, type AuthContextValue, type AuthStatus} from './auth-context'
import {
  clearSession,
  readSession,
  saveSession,
  type AuthSession,
} from './session'
import {isDevAuthEnabled} from './dev-auth'

export function AuthProvider({children}: {children: ReactNode}) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession())
  const [status, setStatus] = useState<AuthStatus>(
    session ? (isDevAuthEnabled ? 'authenticated' : 'loading') : 'anonymous',
  )

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)

    if (session && status === 'loading') {
      getCurrentUser()
        .then((user) => {
          const validated = {token: session.token, user}
          saveSession(validated)
          setSession(validated)
          setStatus('authenticated')
        })
        .catch(() => logout())
    }

    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [logout, session, status])

  const login = useCallback(async (email: string, password: string) => {
    const nextSession = await authenticate(email, password)
    saveSession(nextSession)
    setSession(nextSession)
    setStatus('authenticated')
    return nextSession.user
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: session?.user ?? null,
    login,
    logout,
  }), [login, logout, session, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
