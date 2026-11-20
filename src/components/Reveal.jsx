import { useEffect, useRef } from 'react'

/**
 * Появление блока при скролле: сборка из частей.
 * variant: 'up' — снизу вверх, 'mask' — клип-маска, 'line' — линия,
 *          'blur' — фокус-размытие, 'left' — выезд справа налево,
 *          'pop' — мягкий масштаб-появление.
 */
export default function Reveal({
  as: Tag = 'div',
  variant = 'up',
  delay = 0,
  className = '',
  style,
  children,
  ...rest
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (reduced || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-in')
      return undefined
    }

    const io = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -4% 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const base =
    variant === 'mask'
      ? 'reveal-mask'
      : variant === 'line'
        ? 'reveal-line'
        : variant === 'blur'
          ? 'reveal-blur'
          : variant === 'left'
            ? 'reveal-left'
            : variant === 'pop'
              ? 'reveal-pop'
              : 'reveal'

  // clip-path на самом наблюдаемом элементе обнуляет бокс для
  // IntersectionObserver — поэтому клип живёт на внутреннем слое
  const content = variant === 'mask' ? <div className="rv-clip">{children}</div> : children

  return (
    <Tag
      ref={ref}
      className={`${base}${className ? ` ${className}` : ''}`}
      style={{ '--d': `${delay}s`, ...(style || {}) }}
      {...rest}
    >
      {content}
    </Tag>
  )
}
