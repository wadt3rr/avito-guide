import {useEffect} from 'react'
import {useBlocker} from 'react-router-dom'

const warningMessage = 'Есть несохранённые изменения. Покинуть страницу?'

export function useUnsavedChangesWarning(isDirty: boolean) {
  const blocker = useBlocker(isDirty)

  useEffect(() => {
    if (blocker.state !== 'blocked') return

    if (window.confirm(warningMessage)) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker])

  useEffect(() => {
    if (!isDirty) return

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = warningMessage
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])
}
