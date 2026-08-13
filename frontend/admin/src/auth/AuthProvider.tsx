import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {authenticate, getCurrentUser} from '../api/auth'
import {ApiError, AUTH_UNAUTHORIZED_EVENT} from '../api/client'
import {AuthContext, type AuthContextValue, type AuthStatus} from './auth-context'
import {
  clearSession,
  readSession,
  saveSession,
  type AuthSession,
} from './session'

export function AuthProvider({children}: {children: ReactNode}) {
  const [session, setSession] = useState<AuthSession | null>(() => readSession())
  const [status, setStatus] = useState<AuthStatus>(
    session ? 'loading' : 'anonymous',
  )
  const authOperationRef = useRef(0)

  const logout = useCallback(() => {
    authOperationRef.current += 1
    clearSession()
    setSession(null)
    setStatus('anonymous')
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)

    if (session && status === 'loading') {
      const operation = ++authOperationRef.current
      const validatedToken = session.token
      getCurrentUser()
        .then((user) => {
          if (authOperationRef.current !== operation
            || readSession()?.token !== validatedToken) return
          const validated = {token: session.token, user}
          saveSession(validated)
          setSession(validated)
          setStatus('authenticated')
        })
        .catch((error: unknown) => {
          if (authOperationRef.current !== operation
            || readSession()?.token !== validatedToken) return
          if (error instanceof ApiError && error.status === 401) {
            logout()
            return
          }
          setSession(null)
          setStatus('anonymous')
        })
    }

    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [logout, session, status])

  const login = useCallback(async (email: string, password: string) => {
    const operation = ++authOperationRef.current
    const {token} = await authenticate(email, password)
    const user = await getCurrentUser(token)
    if (authOperationRef.current !== operation) return user
    const nextSession = {token, user}
    saveSession(nextSession)
    setSession(nextSession)
    setStatus('authenticated')
    return user
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user: session?.user ?? null,
    login,
    logout,
  }), [login, logout, session, status])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
