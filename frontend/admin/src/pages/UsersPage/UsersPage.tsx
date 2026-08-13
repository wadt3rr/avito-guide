import {useCallback, useEffect, useState} from 'react'
import {getUsers, type AdminUser} from '../../api/users'
import {Button} from '../../components/Button/Button'
import {Icon} from '../../components/Icon/Icon'
import {UserCreateModal} from './UserCreateModal'
import {UserDeleteModal} from './UserDeleteModal'
import './UsersPage.scss'

const loadErrorMessage = 'Не удалось загрузить пользователей. Проверьте подключение к API.'

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

export function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      setUsers(await getUsers())
    } catch {
      setUsers([])
      setLoadError(loadErrorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    void getUsers()
      .then((loadedUsers) => {
        if (!cancelled) setUsers(loadedUsers)
      })
      .catch(() => {
        if (!cancelled) {
          setUsers([])
          setLoadError(loadErrorMessage)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="users-page">
      <header className="users-page__header">
        <h1>Пользователи</h1>
        <Button
          className="users-page__create-button"
          leadingIcon={<Icon name="add" size={18}/>}
          onClick={() => setCreateOpen(true)}
        >
          Добавить пользователя
        </Button>
      </header>

      {isLoading && <p className="users-page__state" role="status">Загрузка</p>}

      {!isLoading && loadError && (
        <div className="users-page__error" role="alert">
          <p>{loadError}</p>
          <Button onClick={() => void loadUsers()} variant="secondary">Повторить</Button>
        </div>
      )}

      {!isLoading && !loadError && users.length === 0 && (
        <p className="users-page__state">Пользователей пока нет</p>
      )}

      {!isLoading && !loadError && users.length > 0 && (
        <section aria-label="Список пользователей" className="users-list">
          {users.map((user) => (
            <article className="user-row" key={user.id}>
              <div className="user-row__content">
                <div className="user-row__identity">
                  <h2>{user.email}</h2>
                  <span className={`user-row__role user-row__role--${user.role}`}>
                    {user.role === 'superadmin' ? 'Суперадминистратор' : 'Администратор'}
                  </span>
                </div>
                <dl className="user-row__metadata">
                  <div>
                    <dt>ID</dt>
                    <dd>{user.id}</dd>
                  </div>
                  <div>
                    <dt>Создан</dt>
                    <dd>{formatDate(user.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Обновлён</dt>
                    <dd>{formatDate(user.updated_at)}</dd>
                  </div>
                </dl>
              </div>

              {user.role !== 'superadmin' && (
                <div className="user-row__action">
                  <Button
                    aria-label={`Удалить ${user.email}`}
                    onClick={() => setDeleteTarget(user)}
                    variant="danger"
                  >
                    Удалить
                  </Button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}

      <UserCreateModal
        onClose={() => setCreateOpen(false)}
        onCreated={loadUsers}
        open={createOpen}
      />
      <UserDeleteModal
        onClose={() => setDeleteTarget(null)}
        onDeleted={loadUsers}
        user={deleteTarget}
      />
    </main>
  )
}
