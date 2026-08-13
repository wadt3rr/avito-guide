import {useEffect, useRef, useState, type PointerEvent as ReactPointerEvent} from 'react'
import {Outlet, useLocation} from 'react-router-dom'
import {Icon} from '../Icon/Icon'
import {Sidebar} from '../Sidebar/Sidebar'
import {resolveDrawerSwipe, type Point} from './swipe'
import './AdminShell.scss'

function getPageTitle(pathname: string) {
  if (pathname === '/analytics') return 'Аналитика'
  if (pathname === '/users') return 'Пользователи'
  if (pathname === '/forbidden') return 'Нет доступа'
  if (pathname === '/scenarios/new') return 'Новый сценарий'
  if (pathname.startsWith('/scenarios/')) return 'Редактор сценария'
  return 'Сценарии'
}

export function AdminShell() {
  const {pathname} = useLocation()
  const [openOnPath, setOpenOnPath] = useState<string | null>(null)
  const mobileOpen = openOnPath === pathname
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const restoreMenuFocusRef = useRef(false)
  const pointerStartRef = useRef<Point | null>(null)

  useEffect(() => {
    if (!mobileOpen) return

    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const menuButton = menuButtonRef.current
    const content = contentRef.current
    document.body.style.overflow = 'hidden'
    if (content) content.inert = true

    const firstLink = document.querySelector<HTMLElement>('.sidebar__navigation a')
    firstLink?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenOnPath(null)
        return
      }
      if (event.key !== 'Tab') return

      const focusable = Array.from(document.querySelectorAll<HTMLElement>(
        '.sidebar--mobile-open button:not(:disabled), .sidebar--mobile-open a[href]',
      ))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (content) content.inert = false
      if (restoreMenuFocusRef.current) {
        menuButton?.focus()
        restoreMenuFocusRef.current = false
      } else {
        previousFocus?.focus()
      }
    }
  }, [mobileOpen])

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return
    const target = event.target instanceof Element ? event.target : null
    if (target?.closest('.step-editor-drawer, .step-editor-backdrop')) return
    if (mobileOpen && !target?.closest('.sidebar')) return
    pointerStartRef.current = {x: event.clientX, y: event.clientY}
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const start = pointerStartRef.current
    pointerStartRef.current = null
    if (!start) return

    const action = resolveDrawerSwipe(
      start,
      {x: event.clientX, y: event.clientY},
      mobileOpen,
    )
    if (action === 'open') {
      restoreMenuFocusRef.current = false
      setOpenOnPath(pathname)
    } else if (action === 'close') {
      setOpenOnPath(null)
    }
  }

  return (
    <div
      className="admin-shell"
      onPointerCancel={() => {
        pointerStartRef.current = null
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <header className="admin-shell__mobile-header">
        <button
          aria-controls="admin-navigation"
          aria-expanded={mobileOpen}
          aria-label="Открыть меню"
          className="admin-shell__menu-button"
          onClick={() => {
            restoreMenuFocusRef.current = true
            setOpenOnPath(pathname)
          }}
          ref={menuButtonRef}
          type="button"
        >
          <Icon name="menu" size={22}/>
        </button>
        <span className="admin-shell__mobile-brand">Avito Tipper</span>
        <span className="admin-shell__mobile-title">{getPageTitle(pathname)}</span>
      </header>

      {mobileOpen && (
        <button
          aria-label="Закрыть меню"
          className="admin-shell__backdrop"
          onClick={() => setOpenOnPath(null)}
          tabIndex={-1}
          type="button"
        />
      )}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setOpenOnPath(null)}/>

      <div className="admin-shell__content" ref={contentRef}>
        <Outlet/>
      </div>
    </div>
  )
}
