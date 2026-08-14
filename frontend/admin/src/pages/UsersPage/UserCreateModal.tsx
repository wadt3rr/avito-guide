import {useRef, useState, type FormEvent} from 'react'
import {ApiError} from '../../api/client'
import {createAdmin} from '../../api/users'
import {Button} from '../../components/Button/Button'
import {Icon} from '../../components/Icon/Icon'
import {useModalFocus} from '../../hooks/useModalFocus'

interface UserCreateModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void | Promise<void>
}

export function UserCreateModal({open, onClose, onCreated}: UserCreateModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const modalRootRef = useRef<HTMLDivElement>(null)

  const closeModal = () => {
    if (pending) return
    setEmail('')
    setPassword('')
    setError('')
    onClose()
  }

  useModalFocus({
    active: open,
    closeDisabled: pending,
    containerRef: dialogRef,
    initialFocusRef: emailRef,
    modalRootRef,
    onClose: closeModal,
  })

  if (!open) return null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPending(true)
    setError('')

    try {
      await createAdmin({email: email.trim(), password})
      setEmail('')
      setPassword('')
      onClose()
      await onCreated()
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
    <div className="users-modal" ref={modalRootRef} role="presentation">
      <section
        aria-labelledby="create-admin-title"
        aria-modal="true"
        className="users-modal__dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="users-modal__header">
          <div>
            <h2 id="create-admin-title">Новый администратор</h2>
            <p>Новый пользователь получит доступ к сценариям и аналитике.</p>
          </div>
          <button
            aria-label="Закрыть"
            className="users-modal__close"
            disabled={pending}
            onClick={closeModal}
            type="button"
          >
            <Icon name="close" size={20}/>
          </button>
        </div>

        <form className="users-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input
              autoComplete="off"
              onChange={(event) => setEmail(event.target.value)}
              ref={emailRef}
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
          <div className="users-form__actions">
            <Button disabled={pending} onClick={closeModal} variant="secondary">
              Отмена
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? 'Создаём…' : 'Создать администратора'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  )
}
