import {useRef, useState} from 'react'
import {deleteUser, type AdminUser} from '../../api/users'
import {Button} from '../../components/Button/Button'
import {Icon} from '../../components/Icon/Icon'
import {useModalFocus} from '../../hooks/useModalFocus'

interface UserDeleteModalProps {
  user: AdminUser | null
  onClose: () => void
  onDeleted: () => void | Promise<void>
}

export function UserDeleteModal({user, onClose, onDeleted}: UserDeleteModalProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const modalRootRef = useRef<HTMLDivElement>(null)

  const closeModal = () => {
    if (pending) return
    setError('')
    onClose()
  }

  useModalFocus({
    active: Boolean(user),
    closeDisabled: pending,
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    modalRootRef,
    onClose: closeModal,
  })

  if (!user) return null

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
    <div className="users-modal" ref={modalRootRef} role="presentation">
      <section
        aria-labelledby="delete-user-title"
        aria-modal="true"
        className="users-modal__dialog users-modal__dialog--delete"
        ref={dialogRef}
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
            ref={closeButtonRef}
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
