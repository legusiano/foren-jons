import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react'

const MODES = [
  { id: 'whole', num: '01', label: 'Целая цепь', note: 'Замкнутый контур · 16 звеньев' },
  { id: 'open', num: '02', label: 'Раскрытие', note: 'Замок открыт · цепь выпрямляется' },
  { id: 'exploded', num: '03', label: 'Разборка', note: 'Звенья разделены · видны пайки' },
  { id: 'macro', num: '04', label: 'Макро', note: 'Кромка · полировка · соединение' },
]

const LINKS = Array.from({ length: 16 }, (_, i) => i)

function place(mode, i) {
  const n = LINKS.length

  if (mode === 'whole') {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2
    return {
      x: 500 + Math.cos(angle) * 292,
      y: 290 + Math.sin(angle) * 186,
      r: (angle * 180) / Math.PI + 90,
      s: 1,
      o: 1,
    }
  }

  if (mode === 'open') {
    const t = i / (n - 1)
    const released = i === n - 1
    return {
      x: 132 + t * 676 + (released ? 34 : 0),
      y: 292 - Math.sin(t * Math.PI) * 96 + (released ? -74 : 0),
      r: Math.cos(t * Math.PI) * 16 + (released ? 38 : 0),
      s: 1,
      o: 1,
    }
  }

  if (mode === 'exploded') {
    const col = i % 8
    const row = Math.floor(i / 8)
    return {
      x: 132 + col * 106 + (row ? 52 : 0),
      y: 132 + row * 190 + (col % 2 ? 20 : 0),
      r: col % 2 ? -34 : 34,
      s: 0.94,
      o: 1,
    }
  }

  const visible = i >= 6 && i <= 9
  return {
    x: visible ? 205 + (i - 6) * 196 : 500,
    y: visible ? 290 + (i % 2 ? 24 : -24) : 290,
    r: visible ? (i % 2 ? -8 : 8) : 0,
    s: visible ? 2.15 : 0.2,
    o: visible ? 1 : 0,
  }
}

export default function ChainStudy() {
  const [mode, setMode] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [reduced] = useState(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  )

  const positions = useMemo(
    () => LINKS.map(i => place(MODES[mode].id, i)),
    [mode]
  )

  useEffect(() => {
    if (!playing || reduced) return undefined
    const id = window.setInterval(() => {
      setMode(value => (value + 1) % MODES.length)
    }, 2800)
    return () => window.clearInterval(id)
  }, [playing, reduced])

  const selectMode = index => {
    setMode(index)
    setPlaying(false)
  }

  const onKeyDown = event => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      selectMode((mode + 1) % MODES.length)
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      selectMode((mode + MODES.length - 1) % MODES.length)
    }
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      setPlaying(value => !value)
    }
  }


  return (
    <section className="section study" id="study" aria-labelledby="study-title">
      <div className="container">
        <div className="section-head study__head" data-reveal>
          <p className="index-label">03 / Движение цепи</p>
          <h2 className="words" id="study-title">Цепь в движении</h2>
          <p className="section-head__lead">
            Последовательно: целый контур, раскрытый замок, разобранные звенья
            и полировка кромки. Выберите этап или запустите цикл.
          </p>
        </div>

        <div className="study__stage" data-reveal>
          <div
            className="study__canvas"
            tabIndex={0}
            role="group"
            aria-label="Интерактивная схема цепи. Стрелки — этапы, пробел — воспроизведение"
            onKeyDown={onKeyDown}
          >
            <span className="study__corner study__corner--tl">ROVEN JONS / STUDY 01</span>
            <span className="study__corner study__corner--tr">СХЕМА · ДЕМО</span>

            <svg
              viewBox="0 0 1000 580"
              className="study__svg"
              role="group"
              aria-label="Схема цепи из 16 звеньев."
            >
              <defs>
                <linearGradient id="link-silver" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#5d5d5d" />
                  <stop offset="0.22" stopColor="#d8d8d8" />
                  <stop offset="0.46" stopColor="#f6f6f6" />
                  <stop offset="0.72" stopColor="#8d8d8d" />
                  <stop offset="1" stopColor="#e4e4e4" />
                </linearGradient>
              </defs>
              <g className="study__links">
                {LINKS.map((i, index) => {
                  const p = positions[index]
                  return (
                    <g
                      key={i}
                      className="study__link"
                      aria-hidden="true"
                      style={{
                        transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) scale(${p.s})`,
                        opacity: p.o,
                        transitionDelay: `${index * 32}ms`,
                      }}
                    >
                      <rect
                        x="-26"
                        y="-13"
                        width="52"
                        height="26"
                        rx="12"
                        className="study__link-body"
                      />
                      <rect
                        x="-20"
                        y="-8"
                        width="40"
                        height="16"
                        rx="8"
                        className="study__link-inner"
                      />
                      <path d="M -14 -9 L 12 -9" className="study__link-shine" />
                    </g>
                  )
                })}
              </g>
            </svg>

            <div className="study__caption" aria-live="polite">
              <span>{MODES[mode].num} / 04</span>
              <p>{MODES[mode].note}</p>
            </div>

            <button
              className="study__play"
              type="button"
              onClick={() => setPlaying(value => !value)}
              aria-pressed={playing}
            >
              {playing ? <Pause size={13} /> : <Play size={13} />}
              {playing ? 'Пауза' : 'Цикл'}
            </button>
          </div>

          <div className="study__controls">
            <div className="study__tabs" role="group" aria-label="Этапы разборки">
              {MODES.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={mode === i}
                  className={`study__tab${mode === i ? ' is-active' : ''}`}
                  onClick={() => selectMode(i)}
                >
                  <span>{item.num}</span>
                  {item.label}
                </button>
              ))}
            </div>
            <div className="study__arrows">
              <button
                type="button"
                aria-label="Предыдущий этап"
                onClick={() => selectMode((mode + MODES.length - 1) % MODES.length)}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Следующий этап"
                onClick={() => selectMode((mode + 1) % MODES.length)}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
