import { useRef } from 'react'
import { ArrowUpRight, Minus, Plus, X } from 'lucide-react'
import { useFocusTrap } from '../lib/focusTrap'

const format = value => new Intl.NumberFormat('ru-RU').format(value)

export default function CartDrawer({ open, items, onClose, onQty, onRemove }) {
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const panelRef = useRef(null)
  const closeRef = useRef(null)
  useFocusTrap(open, panelRef, closeRef)

  if (!open) return null

  return (
    <div
      className="drawer is-open"
      role="presentation"
      onMouseDown={event => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <aside
        ref={panelRef}
        className="drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Корзина"
      >
        <div className="drawer__head">
          <p className="index-label">Корзина</p>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Закрыть корзину">
            <X size={18} />
          </button>
        </div>

        <div className="drawer__body">
          {items.length === 0 ? (
            <div className="drawer__empty">
              <p>Корзина пуста</p>
              <span>Выберите размер и добавьте браслет из коллекции.</span>
            </div>
          ) : (
            <ul className="drawer__items">
              {items.map(item => (
                <li key={item.id}>
                  <div className="drawer__item-top">
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.size} см · {item.finish}</span>
                    </div>
                    <button
                      type="button"
                      aria-label={`Удалить ${item.title}`}
                      onClick={() => onRemove(item.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="drawer__item-bottom">
                    <div className="qty" role="group" aria-label="Количество">
                      <button
                        type="button"
                        aria-label="Уменьшить количество"
                        onClick={() => onQty(item.id, -1)}
                      >
                        <Minus size={13} />
                      </button>
                      <span>{item.qty}</span>
                      <button
                        type="button"
                        aria-label="Увеличить количество"
                        onClick={() => onQty(item.id, 1)}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                    <strong>{format(item.price * item.qty)} ₽</strong>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="drawer__foot">
          <div className="drawer__total">
            <span>Итого</span>
            <strong>{format(total)} ₽</strong>
          </div>
          <p>Демонстрационная корзина. Оформление заказа подключает владелец сайта.</p>
          <button className="button button--dark" type="button" disabled={!items.length}>
            Оформить
            <ArrowUpRight size={16} />
          </button>
        </div>
      </aside>
    </div>
  )
}
