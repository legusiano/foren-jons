import { useEffect, useRef } from 'react'

/**
 * Лёгкий параллакс: блок смещается относительно соседнего контента
 * по мере прокрутки. Трансформ считается один раз на кадр (rAF),
 * при prefers-reduced-motion отключён.
 */
export default function Parallax({
  as: Tag = 'div',
  speed = 0.05,
  className = '',
  children,
  ...rest
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
    if (reduced) return undefined

    let raf = 0
    const update = () => {
      raf = 0
      const rect = el.getBoundingClientRect()
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return
      const delta = rect.top + rect.height / 2 - window.innerHeight / 2
      el.style.transform = `translate3d(0, ${(-delta * speed).toFixed(1)}px, 0)`
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      el.style.transform = ''
    }
  }, [speed])

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  )
}
