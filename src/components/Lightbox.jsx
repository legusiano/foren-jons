import { useRef } from 'react'
import { ArrowLeft, ArrowRight, X } from 'lucide-react'
import { useFocusTrap } from '../lib/focusTrap'

export default function Lightbox({ images, index, onClose, onStep }) {
  const innerRef = useRef(null)
  const closeRef = useRef(null)
  useFocusTrap(index !== null, innerRef, closeRef)

  if (index === null) return null
  const image = images[index]

  return (
    <div
      className="lightbox"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={innerRef}
        className="lightbox__inner"
        role="dialog"
        aria-modal="true"
        aria-label="Просмотр изделия"
      >
        <div className="lightbox__bar">
          <span>{image.label}</span>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Закрыть просмотр">
            <X size={18} />
          </button>
        </div>
        <div className="lightbox__frame">
          <img src={image.src} alt={image.alt} />
        </div>
        <div className="lightbox__nav">
          <button type="button" onClick={() => onStep(-1)} aria-label="Предыдущее изображение">
            <ArrowLeft size={17} />
          </button>
          <span>
            {String(index + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </span>
          <button type="button" onClick={() => onStep(1)} aria-label="Следующее изображение">
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
