import { useEffect } from 'react'

const FOCUSABLE = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'iframe',
  'object',
  'embed',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

/**
 * Держит Tab внутри активного диалога и возвращает фокус к элементу,
 * который открыл диалог. Используется для legal/cart/lightbox.
 */
export function useFocusTrap(active, containerRef, initialRef) {
  useEffect(() => {
    if (!active) return undefined

    const container = containerRef.current
    if (!container) return undefined

    const previous = document.activeElement
    const getItems = () =>
      Array.from(container.querySelectorAll(FOCUSABLE)).filter(
        node =>
          node.getClientRects().length > 0 &&
          node.getAttribute('aria-hidden') !== 'true' &&
          node.tabIndex !== -1
      )

    const first = initialRef?.current ?? getItems()[0] ?? container
    const frame = window.requestAnimationFrame?.(() => first.focus?.())

    const onKeyDown = event => {
      if (event.key !== 'Tab') return

      const items = getItems()
      if (!items.length) {
        event.preventDefault()
        return
      }

      const firstItem = items[0]
      const lastItem = items[items.length - 1]

      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault()
        lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (frame && window.cancelAnimationFrame) window.cancelAnimationFrame(frame)
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [active, containerRef, initialRef])
}
