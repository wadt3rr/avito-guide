import {useEffect, useState} from 'react'
import {deleteUser, type AdminUser} from '../../api/users'
import {Button} from '../../components/Button/Button'
import {Icon} from '../../components/Icon/Icon'

interface UserDeleteModalProps {
  user: AdminUser | null
  onClose: () => void
  onDeleted: () => void | Promise<void>
}

export function UserDeleteModal({user, onClose, onDeleted}: UserDeleteModalProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, pending, user])

  if (!user) return null

  const closeModal = () => {
    if (pending) return
    setError('')
    onClose()
  }

  const handleDelete = async () => {
    setPending(true)
    setError('')

    try {
      await deleteUser(user.id)
      setError('')
      onClose()
      await onDeleted()
    } catch {
      setError('Не удалось удалить пользователя. Попробуйте ещё раз.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="users-modal" role="presentation">
      <section
        aria-labelledby="delete-user-title"
        aria-modal="true"
        className="users-modal__dialog users-modal__dialog--delete"
        role="dialog"
      >
        <div className="users-modal__header">
          <div>
            <h2 id="delete-user-title">Удалить пользователя?</h2>
            <p className="users-delete__email">{user.email}</p>
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

        <p className="users-delete__warning">
          Вы уверены? Это удалит пользователя и все его сценарии.
        </p>
        {error && <p className="users-form__error" role="alert">{error}</p>}

        <div className="users-form__actions">
          <Button disabled={pending} onClick={closeModal} variant="secondary">
            Отмена
          </Button>
          <Button disabled={pending} onClick={() => void handleDelete()} variant="danger">
            {pending ? 'Удаляем…' : 'Удалить'}
          </Button>
        </div>
      </section>
    </div>
  )
}
