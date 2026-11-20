/**
 * Базовая защита контента сайта FOREN JON'S.
 *
 * Что блокируем:
 *  - выделение и копирование текста (в полях ввода — разрешено);
 *  - контекстное меню (правый клик «Сохранить картинку…»);
 *  - перетаскивание картинок и любых элементов (dragstart);
 *  - картинки: pointer-events выключены, сохранение/открытие невозможны;
 *  - средний клик (открытие ресурса в новой вкладке);
 *  - горячие клавиши: Ctrl+C/X/A/S/U/P/O, F12, Ctrl+Shift+I/J/C/K,
 *    PrintScreen, вызов window.print();
 *  - экспорт 3D-сцены: canvas.toDataURL() и canvas.toBlob() отключены.
 *
 * Это сдерживающие меры для обычного пользователя. Абсолютной защиты
 * в браузере не существует: исходники и пиксели доступны тому, кто очень
 * хочет (DevTools, скриншоты, роботы). Для боевого запуска добавьте
 * заголовки X-Frame-Options / CSP на уровне хостинга.
 */

const isEditable = el =>
  !!el &&
  (el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable === true)

const HARD_KEYS = ['c', 'x', 's', 'u', 'p', 'a', 'o']

export function initContentProtection() {
  if (typeof document === 'undefined') return

  // ---- выделение и копирование ----
  document.addEventListener('selectstart', e => {
    if (!isEditable(e.target)) e.preventDefault()
  })
  document.addEventListener('copy', e => {
    if (!isEditable(e.target)) e.preventDefault()
  })

  // ---- контекстное меню (в т.ч. «Сохранить картинку») ----
  document.addEventListener('contextmenu', e => {
    if (!isEditable(e.target)) e.preventDefault()
  })

  // ---- перетаскивание картинок и элементов ----
  document.addEventListener('dragstart', e => e.preventDefault())
  document.addEventListener('drop', e => e.preventDefault())

  // ---- средний клик: открытие ресурса в новой вкладке ----
  document.addEventListener('auxclick', e => {
    if (e.button === 1) e.preventDefault()
  })
  document.addEventListener('mousedown', e => {
    if (e.button === 1) e.preventDefault()
  })

  // ---- горячие клавиши ----
  document.addEventListener('keydown', e => {
    const key = (e.key || '').toLowerCase()
    const mod = e.ctrlKey || e.metaKey

    // DevTools
    if (
      e.key === 'F12' ||
      (mod && e.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) ||
      (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key))
    ) {
      e.preventDefault()
      return
    }

    // скриншот (там, где браузер его перехватывает)
    if (e.key === 'PrintScreen') {
      e.preventDefault()
      return
    }

    // копирование / сохранение / печать / выделение / открытие
    if (mod && HARD_KEYS.includes(key)) {
      if (isEditable(e.target)) return
      e.preventDefault()
    }
  })

  // ---- печать страницы ----
  try {
    window.print = () => {}
  } catch {
    /* noop */
  }

  // ---- экспорт холста (3D-сцена, любые canvas) ----
  try {
    const blank = 'data:image/png;base64,'
    HTMLCanvasElement.prototype.toDataURL = () => blank
    HTMLCanvasElement.prototype.toBlob = cb => {
      if (typeof cb === 'function') cb(null)
    }
    if ('convertToBlob' in HTMLCanvasElement.prototype) {
      HTMLCanvasElement.prototype.convertToBlob = () => Promise.resolve(new Blob([]))
    }
  } catch {
    /* noop */
  }
}
