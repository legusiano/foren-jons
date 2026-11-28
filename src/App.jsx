import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  Check,
  Heart,
  Menu,
  ShoppingBag,
  X,
} from 'lucide-react'
import CartDrawer from './components/CartDrawer'
import ChainStudy from './components/ChainStudy'
import Lightbox from './components/Lightbox'
import { useFocusTrap } from './lib/focusTrap'

const asset = path => `${import.meta.env.BASE_URL}${path}`

const navLinks = [
  { href: '#product', label: 'Коллекция' },
  { href: '#craft', label: 'Мастерство' },
  { href: '#study', label: 'Цепь' },
  { href: '#about', label: 'О бренде' },
  { href: '#features', label: 'Условия' },
  { href: '#contact', label: 'Подписка' },
]

// Две отдельные цепи для продажи. Изображения без фона, полный объект не обрезан.
// Вырезаны из собственных фотографий/scripts/sources скриптом scripts/prepare_assets.py.
const products = [
  {
    id: 'curb',
    number: '01',
    title: 'Curb Link 925',
    lead:
      'Плотное плетение из плоских звеньев ложится на запястье без зазоров. Каждое звено паяется и полируется вручную — линия остаётся ровной на всей длине.',
    price: 14900,
    images: [
      {
        src: asset('media/chain-01.webp'),
        label: 'Целая цепь',
        alt: 'Полная серебряная цепь без фона, замкнутый контур',
      },
      {
        src: asset('media/chain-02.webp'),
        label: 'Контраст',
        alt: 'Та же цепь при контрастном освещении, без фона',
      },
      {
        src: asset('media/chain-03.webp'),
        label: 'Звенья',
        alt: 'Отдельные звенья и замок цепи, без фона',
      },
    ],
  },
  {
    id: 'sample',
    number: '02',
    title: 'Цепь по образцу 925',
    lead:
      'Отдельная цепь по присланному образцу. Характеристики, вес и комплект документов уточняются продавцом до покупки.',
    price: 17900,
    images: [
      {
        src: asset('media/chain-05.webp'),
        label: 'Образец',
        alt: 'Серебряная цепь по образцу, без фона',
      },
      {
        src: asset('media/chain-06.webp'),
        label: 'Деталь',
        alt: 'Крупный план звеньев цепи по образцу, без фона',
      },
    ],
  },
]

const formatPrice = value => `${new Intl.NumberFormat('ru-RU').format(value)} ₽`

const sizes = ['17', '18', '19', '20']
const finishes = [
  { id: 'polished', label: 'Полированный' },
  { id: 'oxidised', label: 'Оксидированный' },
]

const steps = [
  {
    num: '01',
    title: 'Ручная сборка',
    text: 'Звенья соединяются вручную: натяжение, геометрия и посадка проверяются по шаблону.',
  },
  {
    num: '02',
    title: 'Отделка',
    text: 'Полировка формирует ровный серебристый тон. Состав покрытия уточняется продавцом.',
  },
  {
    num: '03',
    title: 'Документы',
    text: 'Проба, вес и комплект документов подтверждаются продавцом до оформления покупки.',
  },
]

const anatomy = [
  { x: 47, y: 17.5, label: 'Замок-кольцо' },
  { x: 26, y: 43, label: 'Звено curb' },
  { x: 46.5, y: 77, label: 'Пайка' },
]

const timeline = [
  { step: '01', text: 'Подбор звеньев и контроль геометрии.' },
  { step: '02', text: 'Формирование плетения Curb.' },
  { step: '03', text: 'Полировка и проверка отделки.' },
  { step: '04', text: 'Интерактивная демонстрация изделия.' },
]

const assurances = [
  {
    title: 'Материал',
    text: 'Серебро 925 пробы. Точные характеристики подтверждаются продавцом.',
  },
  {
    title: 'Отделка',
    text: 'Вид полировки и покрытия уточняется для конкретного изделия.',
  },
  {
    title: 'Документы',
    text: 'Наличие паспорта или сертификата подтверждается до покупки.',
  },
  {
    title: 'Условия покупки',
    text: 'Цена, доставка, гарантия и обмен согласовываются с продавцом.',
  },
  {
    title: 'Личные данные',
    text: 'Демонстрационная форма не отправляет адрес на сервер.',
  },
]

// Юридический каркас для требований РФ. Это шаблон с явно обозначенными
// незаполненными полями, а не готовое юридическое заключение.
const TBD = '<span class="placeholder">указать</span>'

const legalDocs = {
  privacy: {
    title: 'Политика конфиденциальности',
    body: [
      'Демонстрационная версия: сайт не отправляет персональные данные на сервер, не использует cookie, аналитику и сторонние скрипты. Адрес, введённый в форму, хранится только в памяти страницы до перезагрузки.',
      `Оператор персональных данных (для рабочей версии): ${TBD}. Реквизиты и адрес для обращений: ${TBD}.`,
      'Состав данных: адрес электронной почты и содержание добровольно отправленного обращения. Специальные категории данные не запрашиваются.',
      'Цели обработки: оформление подписки и ответы на обращения. Правовое основание — согласие субъекта (ст. 6, 21 Федерального закона № 152-ФЗ); для рабочих операций основание подтверждает владелец.',
      `Сроки хранения: до отзыва согласия или достижения цели обработки. Конкретный срок для рабочей версии: ${TBD}.`,
      `Передача третьим лицам не предусмотрена, кроме случаев, прямо установленных законодательством. Фактические получатели: ${TBD}.`,
      'Субъект вправе запросить доступ, уточнение, удаление данных, отозвать согласие и обжаловать действия оператора в уполномоченный орган. Запрос направляется по адресу, указанному в сведениях об исполнителе.',
      'Отзыв согласия не ухудшает доступ к сайту. Порядок отзыва в рабочей версии и адрес для него уточняются владельцем.',
    ],
  },
  terms: {
    title: 'Пользовательское соглашение',
    body: [
      'Информация на сайте носит справочный характер и не является публичной офертой. Цены, характеристики, сроки и условия сделки подтверждаются продавцом до оформления заказа.',
      'Пользователь обязуется использовать сайт законно, не нарушать права третьих лиц и не мешать работе сайта.',
      'Владелец публикует информацию по мере возможности, но не обещает её абсолютную актуальность; демонстрационные элементы корзины и подписки не создают договор.',
      'Тексты, изображения и иные материалы сайта защищены авторским правом. Использование без разрешения правообладателя не допускается.',
      `Условия могут изменяться; актуальная редакция размещается на сайте. Споры разрешаются в порядке, установленном законодательством РФ. Реквизиты продавца: ${TBD}.`,
    ],
  },
  refund: {
    title: 'Возврат и обмен',
    body: [
      'Демонстрационная версия сайта не принимает оплату и не оформляет заказы.',
      `Для рабочей версии порядок возврата и обмена определяется Законом РФ «О защите прав потребителей» и договором. Конкретные сроки рассмотрения обращений и способ возврата денежных средств: ${TBD}.`,
      'Покупатель должен видеть цену товара, возможные комиссии и итоговую сумму до подтверждения оплаты.',
      `Основания и ограничения, если они предусмотрены законом и договором, указываются продавцом: ${TBD}. Не устанавливаются ограничения, противоречащие законодательству.`,
      `Обращение по возврату направляется по адресу: ${TBD}.`,
    ],
  },
  cookies: {
    title: 'Файлы cookie и технологии',
    body: [
      'Сайт не использует файлы cookie, localStorage/sessionStorage, счётчики посещений, пиксели и сторонние аналитические сервисы.',
      'Шрифты и изображения загружаются с этого же сайта, поэтому сторонние поставщики не получают запросы посетителей.',
      'Технически необходимые cookie не создаются. Хостинг может вести собственные технические логи; их состав и сроки хранения уточняются владельцем.',
      `Если будут подключены необязательные технологии, до их запуска будет запрошено согласие без заранее отмеченных галочек, с возможностью отказа и изменения решения. Адрес для отзыва: ${TBD}.`,
    ],
  },
  seller: {
    title: 'Сведения об исполнителе',
    body: [
      `Наименование: ${TBD}`,
      `ИНН / ОГРНИП: ${TBD}`,
      `Юридический адрес: ${TBD}`,
      `Телефон: ${TBD}`,
      `E-mail: ${TBD}`,
      `Режим работы: ${TBD}`,
      'До заполнения реквизитов сайт является демонстрационным и не предлагает заключить договор.',
    ],
  },
  delete: {
    title: 'Запрос на удаление данных',
    body: [
      'В демонстрационной версии адрес электронной почты не отправляется на сервер и не сохраняется в браузере после перезагрузки, поэтому удалять нечего. Кнопка имитации удаления не добавлена намеренно.',
      `В рабочей версии запрос направляется по адресу: ${TBD}. Для защиты прав субъекта может потребоваться подтверждение личности по контактным данным, указанным при подписке.`,
      `Срок обработки запроса, перечень систем и резервных копий, обязательные сроки хранения: ${TBD}.`,
      'Удаление производится после проверки основания и личности заявителя; мотивированный отказ направляется в установленный законом срок.',
    ],
  },
}

function useScrollReveal(dependency) {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll('[data-reveal]'))
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches

    if (reduced || typeof IntersectionObserver === 'undefined') {
      nodes.forEach(node => node.classList.add('is-in'))
      return undefined
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-in')
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    )

    nodes.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [dependency])
}

function Words({ text, className = '', as: Tag = 'h2', delay = 0, ...props }) {
  const words = text.split(' ')
  return (
    <Tag
      {...props}
      className={`words ${className}`.trim()}
      style={{ '--word-delay': `${delay}s` }}
    >
      {words.map((word, i) => (
        <span className="words__item" key={`${word}-${i}`} style={{ '--i': i }}>
          <span>{word}</span>
        </span>
      ))}
    </Tag>
  )
}

export default function App() {
  const [activeProductId, setActiveProductId] = useState(products[0].id)
  const product = products.find(item => item.id === activeProductId) ?? products[0]
  useScrollReveal(activeProductId)

  const [shot, setShot] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [email, setEmail] = useState('')
  const [dataConsent, setDataConsent] = useState(false)
  const [mailConsent, setMailConsent] = useState(false)
  const [legalOpen, setLegalOpen] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [size, setSize] = useState('19')
  const [finish, setFinish] = useState('polished')
  const [wishlist, setWishlist] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const legalPanelRef = useRef(null)
  const legalCloseRef = useRef(null)
  const progressRef = useRef(null)
  const topRef = useRef(null)
  const meshyRef = useRef(null)
  const heroScrollRef = useRef(null)
  useFocusTrap(Boolean(legalOpen), legalPanelRef, legalCloseRef)

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0)

  useEffect(() => {
    if (!toast) return undefined
    const id = window.setTimeout(() => setToast(''), 2800)
    return () => window.clearTimeout(id)
  }, [toast])

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key !== 'Escape') return
      setMenuOpen(false)
      setLegalOpen(null)
      setCartOpen(false)
      setLightbox(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    const locked = menuOpen || Boolean(legalOpen) || cartOpen || lightbox !== null
    document.body.classList.toggle('menu-open', locked)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen, legalOpen, cartOpen, lightbox])

  // Прогресс и кнопка «наверх» обновляются прямо в DOM один раз за кадр,
  // чтобы не перерисовывать всё React-дерево на каждое scroll-событие.
  useEffect(() => {
    let frame = 0
    let wasVisible = null
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${ratio})`
      }
      const visible = window.scrollY > window.innerHeight * 0.9
      if (visible !== wasVisible) {
        topRef.current?.classList.toggle('is-on', visible)
        wasVisible = visible
      }
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  // Бесконечные анимации работают только рядом с экраном.
  useEffect(() => {
    const nodes = [meshyRef.current, heroScrollRef.current].filter(Boolean)
    if (!nodes.length || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          entry.target.classList.toggle('is-paused', !entry.isIntersecting)
        })
      },
      { rootMargin: '120px' }
    )
    nodes.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [])

  const addToCart = product => {
    const itemSize = product.size ?? size
    const itemFinish = product.finish ?? finish
    const id = `${product.id}-${itemSize}-${itemFinish}`
    setCartItems(items => {
      const existing = items.find(item => item.id === id)
      if (existing) {
        return items.map(item =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [
        ...items,
        {
          id,
          title: product.title,
          size: itemSize,
          finish: finishes.find(item => item.id === itemFinish)?.label ?? '',
          price: product.price,
          qty: 1,
        },
      ]
    })
    setToast(`${product.title} · ${itemSize} см добавлен в корзину`)
  }

  const changeQty = (id, delta) => {
    setCartItems(items =>
      items
        .map(item => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter(item => item.qty > 0)
    )
  }

  const stepLightbox = useCallback(
    delta => {
      setLightbox(value =>
        value === null ? value : (value + delta + product.images.length) % product.images.length
      )
    },
    [product.images.length]
  )

  useEffect(() => {
    if (lightbox === null) return undefined
    const onKeyDown = event => {
      if (event.key === 'ArrowRight') stepLightbox(1)
      if (event.key === 'ArrowLeft') stepLightbox(-1)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [lightbox, stepLightbox])

  return (
    <>
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>

      <div className="scroll-progress" ref={progressRef} aria-hidden="true" />

      <header className="site-header">
        <div className="container site-header__inner">
          <a className="brand" href="#top" onClick={() => setMenuOpen(false)}>
            VOREN <span>JONS</span>
          </a>

          <nav className="site-nav" aria-label="Основная навигация">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="cart-count"
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label={`Корзина, товаров: ${cartCount}`}
            >
              <ShoppingBag size={15} aria-hidden="true" />
              Корзина {cartCount > 0 && <b>{cartCount}</b>}
            </button>
            <button
              className="menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
              onClick={() => setMenuOpen(value => !value)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <nav aria-label="Мобильная навигация">
          {navLinks.map((link, i) => (
            <a
              key={link.href}
              href={link.href}
              style={{ '--i': i }}
              onClick={() => setMenuOpen(false)}
            >
              <span>{String(i + 1).padStart(2, '0')}</span>
              {link.label}
            </a>
          ))}
        </nav>
        <p className="mobile-menu__foot">Серебряные цепи · демонстрационный проект</p>
      </div>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="container hero__layout">
            <div className="hero__copy" data-reveal>
              <p className="index-label">01 / Серебряные цепи · коллекция Curb</p>
              <h1 className="hero__title" id="hero-title">
                <span>VOREN</span>
                <span className="hero__title-line">JONS<i>.</i></span>
              </h1>
              <p className="hero__kicker">Серебро, которое чувствуешь</p>
              <p className="hero__body">
                Исследование формы серебряной цепи: ровная линия звеньев,
                сдержанная отделка и точность деталей — без лишнего.
              </p>
              <div className="hero__actions">
                <a className="button button--dark" href="#product">
                  Смотреть коллекцию
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
                <a className="button button--text" href="#about">
                  История бренда
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
              </div>
              <a className="hero__scroll" ref={heroScrollRef} href="#product">
                <ArrowDown size={14} aria-hidden="true" />
                Листайте вниз
              </a>
            </div>

            <div className="hero__visual" data-reveal style={{ '--i': 1 }}>
              <div className="hero__figure">
                <img
                  src={products[0].images[0].src}
                  alt="Серебряный браслет Curb Link 925"
                  width="1000"
                  height="1000"
                  decoding="async"
                  fetchPriority="high"
                />
                <span className="hero__figure-index">CURB LINK / 01</span>
                <span className="hero__figure-note">Родий · 19 см · 32 г</span>
              </div>
            </div>
          </div>

          <div className="container">
            <div className="hero__rule" data-reveal data-reveal-variant="line" />
          </div>
        </section>

        <div className="statement">
          <div className="container statement__inner">
            <span>Форма без лишнего</span>
            <span className="statement__dot" aria-hidden="true" />
            <span>Ручная сборка</span>
            <span className="statement__dot" aria-hidden="true" />
            <span>Серебро 925</span>
          </div>
        </div>

        <section className="section product" id="product" aria-labelledby="product-title">
          <div className="container">
            <div className="product-switch" role="group" aria-label="Выбрать цепь">
              {products.map(item => (
                <button
                  key={item.id}
                  type="button"
                  className={`product-switch__item${item.id === activeProductId ? ' is-active' : ''}`}
                  aria-pressed={item.id === activeProductId}
                  onClick={() => {
                    setActiveProductId(item.id)
                    setShot(0)
                    setWishlist(false)
                  }}
                >
                  <span className="product-switch__num">{item.number}</span>
                  <span>{item.title}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="container product__layout">
            <div className="product__gallery" data-reveal>
              <div className="product__stage">
                <img
                  key={product.images[shot].src}
                  className={finish === 'oxidised' ? 'is-oxidised' : ''}
                  src={product.images[shot].src}
                  alt={product.images[shot].alt}
                  width="1000"
                  height="1000"
                  loading="lazy"
                  decoding="async"
                  role="button"
                  tabIndex={0}
                  aria-label="Открыть большой просмотр"
                  onClick={() => setLightbox(shot)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      setLightbox(shot)
                    }
                  }}
                />
                <span className="product__counter">
                  {String(shot + 1).padStart(2, '0')} / {String(product.images.length).padStart(2, '0')}
                </span>
              </div>
              <div className="gallery-nav" role="group" aria-label="Ракурсы изделия">
                {product.images.map((item, i) => (
                  <button
                    key={item.src}
                    className={`gallery-nav__item${i === shot ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={i === shot}
                    onClick={() => setShot(i)}
                  >
                    <span className="gallery-nav__num">{String(i + 1).padStart(2, '0')}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="product__detail">
              <p className="index-label" data-reveal>
                Изделие {product.number} — {product.title}
              </p>
              <div className="product__title-row" data-reveal>
                <Words
                  as="h2"
                  id="product-title"
                  className="product__title"
                  text={product.title}
                  delay={0.05}
                />
                <button
                  className={`wishlist${wishlist ? ' is-on' : ''}`}
                  type="button"
                  aria-pressed={wishlist}
                  aria-label={wishlist ? 'Убрать из избранного' : 'В избранное'}
                  onClick={() => {
                    setWishlist(value => !value)
                    setToast(wishlist ? 'Убрано из избранного' : 'Добавлено в избранное')
                  }}
                >
                  <Heart size={18} aria-hidden="true" />
                </button>
              </div>
              <p className="product__lead" data-reveal>
                {product.lead}
              </p>

              <div className="product__price" data-reveal>
                <strong>{formatPrice(product.price)}</strong>
                <span>наличие и доставка уточняются продавцом</span>
              </div>
              <p className="product__disclaimer" data-reveal>
                Цена и условия приведены для примера и не являются публичной офертой.
              </p>

              <div className="options" data-reveal>
                <div className="options__group">
                  <span className="options__label">Длина</span>
                  <div className="options__row" role="group" aria-label="Длина браслета">
                    {sizes.map(item => (
                      <button
                        key={item}
                        type="button"
                        className={size === item ? 'is-active' : ''}
                        aria-pressed={size === item}
                        onClick={() => setSize(item)}
                      >
                        {item} см
                      </button>
                    ))}
                  </div>
                </div>
                <div className="options__group">
                  <span className="options__label">Отделка</span>
                  <div className="options__row" role="group" aria-label="Отделка поверхности">
                    {finishes.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        className={finish === item.id ? 'is-active' : ''}
                        aria-pressed={finish === item.id}
                        onClick={() => setFinish(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <dl className="specs" data-reveal>
                <div>
                  <dt>Материал</dt>
                  <dd>Серебро 925 пробы</dd>
                </div>
                <div>
                  <dt>Покрытие</dt>
                  <dd>Уточняется продавцом</dd>
                </div>
                <div>
                  <dt>Длина</dt>
                  <dd>{product.id === 'curb' ? '19 см + 2 см удлинитель' : 'Уточняется продавцом'}</dd>
                </div>
                <div>
                  <dt>Вес</dt>
                  <dd>{product.id === 'curb' ? '32 г (пример)' : 'Уточняется продавцом'}</dd>
                </div>
                <div>
                  <dt>Замок</dt>
                  <dd>{product.id === 'curb' ? 'Карабин-кольцо' : 'Уточняется продавцом'}</dd>
                </div>
              </dl>

              <div className="accordion" data-reveal>
                <button
                  type="button"
                  aria-expanded={detailsOpen}
                  onClick={() => setDetailsOpen(value => !value)}
                >
                  Состав и уход
                  <span aria-hidden="true">{detailsOpen ? '−' : '+'}</span>
                </button>
                {detailsOpen && (
                  <div className="accordion__body">
                    <p>
                      Хранить отдельно от других украшений, в сухом месте. Контакт
                      с водой, косметикой и бытовой химией сокращает срок блеска.
                      Протирать мягкой салфеткой после носки.
                    </p>
                    <p>
                      Условия гарантии и обмена уточняются у продавца до покупки.
                    </p>
                  </div>
                )}
              </div>

              <div className="product__actions" data-reveal>
                <button
                  className="button button--dark"
                  type="button"
                  onClick={() => addToCart(product)}
                >
                  Добавить в корзину
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                <button
                  className="button button--text"
                  type="button"
                  onClick={() => setLegalOpen('refund')}
                >
                  Условия возврата
                </button>
              </div>

              <ul className="product__trust" data-reveal>
                <li>Параметры — по запросу</li>
                <li>Документы — до покупки</li>
                <li>Условия — у продавца</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="section craft" id="craft" aria-labelledby="craft-title">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="index-label">02 / Анатомия изделия</p>
              <Words as="h2" id="craft-title" text="Точность в каждой детали" />
              <p className="section-head__lead">
                Мы показываем изнанку работы: звенья, замок и пайка. Именно она
                держит форму и задаёт характер изделия.
              </p>
            </div>

            <div className="craft__layout">
              <div className="craft__figure" data-reveal>
                <img
                  src={asset('media/chain-03.webp')}
                  alt="Разложенные детали браслета: звенья curb, замок-кольцо и кольца"
                  width="1312"
                  height="1312"
                  loading="lazy"
                  decoding="async"
                />
                {anatomy.map((item, i) => (
                  <span
                    key={item.label}
                    className="craft__mark"
                    style={{ left: `${item.x}%`, top: `${item.y}%`, '--i': i }}
                  >
                    <i>{String(i + 1).padStart(2, '0')}</i>
                    <b>{item.label}</b>
                  </span>
                ))}
              </div>

              <div className="craft__steps">
                {steps.map(step => (
                  <article className="craft-step" key={step.num} data-reveal>
                    <span className="craft-step__num">{step.num}</span>
                    <div>
                      <h3>{step.title}</h3>
                      <p>{step.text}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <ChainStudy />

        <section className="section meshy" id="model" aria-labelledby="model-title">
          <div className="container meshy__layout">
            <div className="meshy__copy" data-reveal>
              <p className="index-label index-label--light">03а / 3D-визуализация</p>
              <Words
                as="h2"
                id="model-title"
                text="Объём звена"
                className="meshy__title"
              />
              <p className="meshy__lead">
                Прозрачный рендер 3D-модели veron_cuban_bracelet из Meshy. Звенья
                вращаются мягким циклом — без серого фона и стороннего плеера.
              </p>
              <a
                className="inline-link meshy__link"
                href="https://www.meshy.ai/3d-models/7ecc728f-3734-4d20-92c1-6d3cb17ae2d8?utm_medium=referral-program&utm_source=meshy&utm_content=LGNRCS&share_type=3d-models"
                target="_blank"
                rel="noopener noreferrer"
              >
                Открыть модель на Meshy
                <ArrowUpRight size={15} aria-hidden="true" />
              </a>
            </div>

            <div className="meshy__stage" data-reveal>
              <span className="meshy__code">MESHY / VERON_CUBAN_BRACELET</span>
              <img
                className="meshy__model"
                ref={meshyRef}
                src={asset('media/chain-meshy.webp')}
                alt="Объёмная 3D-модель серебряной цепи на прозрачном фоне"
                width="512"
                height="512"
                loading="lazy"
                decoding="async"
              />
              <span className="meshy__hint">3D-рендер · циклическое движение</span>
            </div>
          </div>
        </section>

        <section className="section story" id="about" aria-labelledby="about-title">
          <div className="container story__layout">
            <div data-reveal>
              <p className="index-label index-label--light">04 / О бренде</p>
              <Words
                as="h2"
                id="about-title"
                text="Мастерская, а не фабрика"
                className="story__title"
              />
            </div>
            <div className="story__body" data-reveal>
              <p className="story__lead">
                Это демонстрация подхода: украшение — не аксессуар, а продолжение
                человека.
              </p>
              <p>
                Визуальный язык построен на естественном блеске серебра, ровной линии звеньев
                и сдержанной отделке. Параметры конкретного изделия уточняются
                продавцом.
              </p>
              <p>
                Форма без лишнего. Никаких обещаний, которые нельзя подтвердить
                документами до покупки.
              </p>
            </div>
          </div>

          <div className="container">
            <ol className="timeline" aria-label="Этапы работы с изделием">
              {timeline.map((item, i) => (
                <li className="timeline__item" key={item.step} data-reveal style={{ '--i': i }}>
                  <span className="timeline__year">{item.step}</span>
                  <p>{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="manifesto" aria-label="Манифест бренда">
          <div className="container manifesto__inner" data-reveal>
            <span className="manifesto__rule" />
            <p>Форма без лишнего</p>
            <span className="manifesto__caption">VOREN JONS · Silver study · Demo</span>
          </div>
        </section>

        <section className="section assurances" id="features" aria-labelledby="features-title">
          <div className="container">
            <div className="section-head" data-reveal>
              <p className="index-label">05 / Защита и документы</p>
              <Words as="h2" id="features-title" text="Всё, что должно быть" />
              <p className="section-head__lead">
                Материал, покрытие, гарантия и документы — без мелкого шрифта
                и лишних обещаний.
              </p>
            </div>

            <div className="assurance-list">
              {assurances.map((item, i) => (
                <article className="assurance" key={item.title} data-reveal style={{ '--i': i }}>
                  <span className="assurance__num">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section closing" id="contact" aria-labelledby="closing-title">
          <div className="container closing__layout">
            <div data-reveal>
              <p className="index-label index-label--light">06 / Остаться на связи</p>
              <Words as="h2" id="closing-title" text="Браслет, который остаётся" />
              <p className="closing__lead">
                Новости коллекций и показы — редко и по делу. Форма
                демонстрационная: адрес никуда не отправляется.
              </p>
            </div>

            <form
              className="subscribe"
              data-reveal
              onSubmit={event => {
                event.preventDefault()
                if (!email.trim() || !dataConsent) return
                setSubscribed(true)
              }}
            >
              <label htmlFor="email">Подписка на новости</label>
              <div className="subscribe__row">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ваша@почта.ru"
                  value={email}
                  onChange={event => {
                    setEmail(event.target.value)
                    setSubscribed(false)
                  }}
                />
                <button className="button button--light" type="submit">
                  {subscribed ? <Check size={15} aria-hidden="true" /> : null}
                  {subscribed ? 'Готово' : 'Подписаться'}
                </button>
              </div>

              <label className="consent">
                <input
                  type="checkbox"
                  checked={dataConsent}
                  onChange={event => {
                    setDataConsent(event.target.checked)
                    setSubscribed(false)
                  }}
                  required
                />
                <span className="consent__box" aria-hidden="true">
                  <Check size={12} />
                </span>
                <span>Согласен на обработку адреса электронной почты</span>
              </label>
              <label className="consent">
                <input
                  type="checkbox"
                  checked={mailConsent}
                  onChange={event => {
                    setMailConsent(event.target.checked)
                    setSubscribed(false)
                  }}
                />
                <span className="consent__box" aria-hidden="true">
                  <Check size={12} />
                </span>
                <span>Согласен получать письма с новостями (необязательно)</span>
              </label>
              <div className="subscribe__links">
                <button
                  className="inline-link"
                  type="button"
                  onClick={() => setLegalOpen('privacy')}
                >
                  Конфиденциальность
                </button>
                <button
                  className="inline-link"
                  type="button"
                  onClick={() => setLegalOpen('delete')}
                >
                  Удаление данных
                </button>
                <button
                  className="inline-link"
                  type="button"
                  onClick={() => setLegalOpen('cookies')}
                >
                  Cookie
                </button>
              </div>

              <p className="subscribe__note" role={subscribed ? 'status' : undefined}>
                {subscribed
                  ? 'Форма демонстрационная: адрес не отправлен и не сохранён.'
                  : 'Отдельное согласие на письма можно не ставить.'}
              </p>
            </form>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer__top">
            <div className="footer__brand">
              <p>VOREN JONS</p>
              <span>Демонстрация серебряных цепей. Реквизиты не указаны.</span>
            </div>
            <div className="footer__col">
              <h3>Навигация</h3>
              <ul>
                {navLinks.map(link => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer__col">
              <h3>Реквизиты</h3>
              <ul className="footer__placeholders">
                <li>Наименование — <span>указать</span></li>
                <li>ИНН / ОГРНИП — <span>указать</span></li>
                <li>Адрес — <span>указать</span></li>
                <li>Телефон — <span>указать</span></li>
                <li>E-mail — <span>указать</span></li>
              </ul>
            </div>
            <div className="footer__col">
              <h3>Документы</h3>
              <ul>
                <li>
                  <button type="button" onClick={() => setLegalOpen('privacy')}>
                    Конфиденциальность <ArrowUpRight size={12} aria-hidden="true" />
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalOpen('terms')}>
                    Пользовательское соглашение <ArrowUpRight size={12} aria-hidden="true" />
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalOpen('seller')}>
                    Сведения об исполнителе <ArrowUpRight size={12} aria-hidden="true" />
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalOpen('refund')}>
                    Возврат и обмен <ArrowUpRight size={12} aria-hidden="true" />
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalOpen('cookies')}>
                    Файлы cookie <ArrowUpRight size={12} aria-hidden="true" />
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setLegalOpen('delete')}>
                    Удаление данных <ArrowUpRight size={12} aria-hidden="true" />
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 VOREN JONS. Все права защищены.</span>
            <span>Демонстрационная версия · реквизиты не указаны</span>
          </div>
        </div>
      </footer>

      {legalOpen && (
        <div
          className="legal"
          role="presentation"
          onMouseDown={event => {
            if (event.target === event.currentTarget) setLegalOpen(null)
          }}
        >
          <div
            ref={legalPanelRef}
            className="legal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="legal-title"
          >
            <button
              ref={legalCloseRef}
              className="legal__close"
              type="button"
              aria-label="Закрыть"
              onClick={() => setLegalOpen(null)}
            >
              <X size={18} aria-hidden="true" />
            </button>
            <p className="index-label">Юридическая информация</p>
            <h2 id="legal-title">{legalDocs[legalOpen].title}</h2>
            <div className="legal__body">
              {legalDocs[legalOpen].body.map((paragraph, i) => (
                <p key={i} dangerouslySetInnerHTML={{ __html: paragraph }} />
              ))}
            </div>
            <p className="legal__foot">
              Демонстрационная версия. Заполните реквизиты до публикации.
            </p>
          </div>
        </div>
      )}

      <div className={`toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>

      <button
        className="to-top"
        ref={topRef}
        type="button"
        aria-label="Наверх"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp size={17} aria-hidden="true" />
      </button>

      <CartDrawer
        open={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onQty={changeQty}
        onRemove={id => setCartItems(items => items.filter(item => item.id !== id))}
      />

      <Lightbox
        images={product.images}
        index={lightbox}
        onClose={() => setLightbox(null)}
        onStep={stepLightbox}
      />
    </>
  )
}
