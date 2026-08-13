import {useState, type FormEvent} from 'react'
import {ApiError} from '../../api/client'
import {createAdmin} from '../../api/users'
import './UsersPage.scss'

export function UsersPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setError('')
    setSuccess('')

    try {
      const user = await createAdmin({email: email.trim(), password})
      setEmail('')
      setPassword('')
      setSuccess(`Администратор ${user.email} создан.`)
    } catch (requestError) {
      setPassword('')
      setError(requestError instanceof ApiError && requestError.status === 409
        ? 'Пользователь с таким email уже существует.'
        : 'Не удалось создать администратора. Попробуйте ещё раз.')
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="users-page">
      <header className="users-page__header">
        <div>
          <h1>Пользователи</h1>
          <p>Создавайте аккаунты для других администраторов продукта.</p>
        </div>
      </header>

      <section className="users-card" aria-labelledby="create-admin-title">
        <h2 id="create-admin-title">Новый администратор</h2>
        <p>Новый пользователь получит доступ к сценариям и аналитике.</p>

        <form className="users-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              autoComplete="off"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            <span>Пароль</span>
            <input
              aria-label="Пароль"
              autoComplete="new-password"
              minLength={8}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            <small>Минимум 8 символов.</small>
          </label>
          {error && <p className="users-form__error" role="alert">{error}</p>}
          {success && <p className="users-form__success" role="status">{success}</p>}
          <button disabled={pending} type="submit">
            {pending ? 'Создаём…' : 'Создать администратора'}
          </button>
        </form>
      </section>
    </main>
  )
}
