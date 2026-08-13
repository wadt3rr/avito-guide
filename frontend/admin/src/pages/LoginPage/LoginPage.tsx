import {useState, type FormEvent} from 'react'
import {Navigate, useLocation, useNavigate} from 'react-router-dom'
import {ApiError} from '../../api/client'
import {useAuth} from '../../auth/auth-context'
import './LoginPage.scss'

interface LoginLocationState {
  from?: string
}

export function LoginPage() {
  const {login, status} = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  if (status === 'authenticated') return <Navigate replace to="/scenarios"/>

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setPending(true)

    try {
      await login(email.trim(), password)
      setPassword('')
      const from = (location.state as LoginLocationState | null)?.from
      navigate(from?.startsWith('/') ? from : '/scenarios', {replace: true})
    } catch (requestError) {
      setPassword('')
      setError(requestError instanceof ApiError && requestError.status === 401
        ? 'Неверный email или пароль.'
        : 'Не удалось войти. Проверьте соединение и попробуйте ещё раз.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-card__brand">Avito Tipper</div>
        <h1 id="login-title">Войти</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              autoComplete="username"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>Пароль</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {error && <p className="login-form__error" role="alert">{error}</p>}
          <button disabled={pending || status === 'loading'} type="submit">
            {pending || status === 'loading' ? 'Входим…' : 'Войти'}
          </button>
        </form>
      </section>
    </main>
  )
}
