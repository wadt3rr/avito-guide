import {useEffect, useEffectEvent, type RefObject} from 'react'

const focusableSelector = [
  'a[href]',
  'button:not(:disabled)',
  'input:not(:disabled)',
  'select:not(:disabled)',
  'textarea:not(:disabled)',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))
    .sort((left, right) => {
      const position = left.compareDocumentPosition(right)
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
      return 0
    })
}

interface ModalFocusOptions {
  active: boolean
  closeDisabled?: boolean
  containerRef: RefObject<HTMLElement | null>
  initialFocusRef?: RefObject<HTMLElement | null>
  modalRootRef?: RefObject<HTMLElement | null>
  onClose: () => void
}

export function useModalFocus({
  active,
  closeDisabled = false,
  containerRef,
  initialFocusRef,
  modalRootRef,
  onClose,
}: ModalFocusOptions) {
  const requestClose = useEffectEvent(() => {
    if (!closeDisabled) onClose()
  })

  useEffect(() => {
    const container = containerRef.current
    if (!active || !container) return

    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    const inertElements = new Map<HTMLElement, boolean>()
    let current = modalRootRef?.current ?? container

    while (current.parentElement) {
      const parent = current.parentElement
      for (const sibling of Array.from(parent.children)) {
        if (sibling === current || !(sibling instanceof HTMLElement)) continue
        inertElements.set(sibling, sibling.inert)
        sibling.inert = true
      }
      current = parent
      if (current === document.body) break
    }

    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        requestClose()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(container)
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) {
        event.preventDefault()
        container.focus({preventScroll: true})
        return
      }

      const activeElement = document.activeElement
      if (activeElement === container || !focusable.includes(activeElement as HTMLElement)) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus({preventScroll: true})
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus({preventScroll: true})
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus({preventScroll: true})
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    const initialFocus = initialFocusRef?.current
      ?? getFocusableElements(container)[0]
      ?? container
    initialFocus.focus({preventScroll: true})

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      inertElements.forEach((wasInert, element) => {
        element.inert = wasInert
      })
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true})
    }
  }, [active, containerRef, initialFocusRef, modalRootRef])
}
