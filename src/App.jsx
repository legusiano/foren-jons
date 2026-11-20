import { useEffect, useRef, useState } from 'react'
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Gem,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react'
import SplitText from './components/SplitText'
import Reveal from './components/Reveal'

const navLinks = [
  { href: '#product', label: 'Коллекция' },
  { href: '#about', label: 'О бренде' },
  { href: '#features', label: 'Гарантии' },
  { href: '#contact', label: 'Контакты' },
]

// учитывает base из vite.config (GitHub Pages отдаёт сайт из /foren-jons/)
const asset = path => `${import.meta.env.BASE_URL}${path}`

const gallery = [
  {
    src: asset('media/bracelet-white.jpg'),
    label: 'Общий вид',
    alt: 'Браслет Curb Link 925 из серебра на белом фоне',
  },
  {
    src: asset('media/bracelet-grey.jpg'),
    label: 'Свет и тень',
    alt: 'Браслет Curb Link 925 на сером фоне, контрастный свет',
  },
  {
    src: asset('media/chain-parts.png'),
    label: 'Звенья',
    alt: 'Разобранный браслет: отдельные звенья и замок-кольцо',
  },
]

const timeline = [
  { year: '2008', text: "FOREN JON'S основан: первая мастерская и пять моделей цепи." },
  { year: '2012', text: 'Коллекция Curb — фирменная форма плетения бренда.' },
  { year: '2019', text: 'Родиевое покрытие: защита от потемнения на все изделия.' },
  { year: '2026', text: 'Более 12 000 изделий, собранных вручную, и 24 месяца гарантии.' },
]

const steps = [
  {
    num: '01',
    title: 'Ручная сборка',
    text: 'Каждое звено соединяется вручную: натяжение, геометрия и посадка проверяются по шаблону.',
  },
  {
    num: '02',
    title: 'Холодный блеск',
    text: 'Многоступенчатая полировка и родиевое покрытие дают серебристо-стальной тон без потемнения.',
  },
  {
    num: '03',
    title: 'Контроль пробы',
    text: 'Каждая партия проходит пробирный контроль, а изделие получает индивидуальный сертификат.',
  },
]

const anatomy = [
  { x: 47, y: 17.5, label: 'Замок-кольцо' },
  { x: 26, y: 43, label: 'Звено curb' },
  { x: 46.5, y: 77, label: 'Пайка' },
]

const features = [
  {
    icon: Gem,
    title: 'Серебро 925 пробы',
    text: 'Стерлинговое серебро с гипоаллергенным составом — без никеля в контакте с кожей.',
  },
  {
    icon: Sparkles,
    title: 'Ручная полировка',
    text: 'Родиевое покрытие сохраняет холодный блеск и защищает от потемнения.',
  },
  {
    icon: ShieldCheck,
    title: 'Гарантия 24 месяца',
    text: 'Бесплатное обслуживание замков и соединений в течение двух лет.',
  },
  {
    icon: BadgeCheck,
    title: 'Сертификат подлинности',
    text: 'Паспорт изделия с пробой, весом и номером партии в каждой коробке.',
  },
  {
    icon: Truck,
    title: 'Доставка и обмен',
    text: 'Доставка по России от одного дня, обмен размера в течение 14 дней.',
  },
]

const guarantees = [
  { icon: ShieldCheck, label: 'Гарантия 24 мес.' },
  { icon: BadgeCheck, label: 'Сертификат 925' },
  { icon: Truck, label: 'Обмен 14 дней' },
]

function useReducedMotion() {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return undefined
    const apply = () => setReduced(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return reduced
}

function AssemblyFilm() {
  const reduced = useReducedMotion()
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const el = videoRef.current
    if (!el) return undefined
    if (reduced) {
      el.pause()
      return undefined
    }
    const play = el.play?.()
    if (play?.catch) play.catch(() => setPlaying(false))
    return undefined
  }, [reduced])

  const replay = () => {
    const el = videoRef.current
    if (!el) return
    el.currentTime = 0
    el.play?.().catch(() => {})
  }

  return (
    <figure className="film">
      <div className="film-frame">
        <video
          ref={videoRef}
          className="film-video"
          src={asset('media/chain-motion.mp4')}
          poster={asset('media/chain-parts.png')}
          muted
          playsInline
          preload="auto"
          aria-label="Анимация: браслет собирается из отдельных звеньев"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onCanPlay={() => setReady(true)}
        />
        <span className={`film-badge${ready ? ' is-ready' : ''}`} aria-hidden="true">
          925 · MOV
        </span>
        <button
          className={`film-replay${playing ? ' is-hidden' : ''}`}
          type="button"
          onClick={replay}
        >
          <RotateCcw size={14} aria-hidden="true" />
          Повторить сборку
        </button>
      </div>
      <figcaption>
        <span>Сборка браслета</span>
        <span>00:02 · 24 звена</span>
      </figcaption>
    </figure>
  )
}

export default function App() {
  const [toast, setToast] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [shot, setShot] = useState(0)

  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(() => setToast(''), 2600)
    return () => clearTimeout(id)
  }, [toast])

  const addToCart = () => setToast('Curb Link 925 добавлен в корзину')

  return (
    <>
      <header className="site-header">
        <div className="container">
          <a className="brand" href="#top">
            FOREN <span>JON'S</span>
          </a>
          <nav className="nav" aria-label="Основная навигация">
            {navLinks.map(link => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
            <a className="nav-cta" href="#product">
              К покупке
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        {/* ============ HERO ============ */}
        <section className="hero" aria-labelledby="hero-title">
          <div className="container hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">Серебро 925 · с 2008 года</p>

              <h1 className="hero-title" id="hero-title">
                FOREN <em>JON'S</em>
              </h1>

              <div className="dim-line" aria-hidden="true">
                <span />
                <p>19 см · родий · ручная сборка</p>
                <span />
              </div>

              <p className="hero-slogan">Серебро, которое чувствуешь</p>

              <p className="hero-text">
                Браслеты из стерлингового серебра, создаваемые вручную. Соединяем
                скандинавскую сдержанность с точностью ювелирной инженерии — форма без
                лишнего, характер без компромиссов.
              </p>

              <div className="hero-actions">
                <a className="btn btn-primary" href="#product">
                  Смотреть коллекцию
                  <ArrowRight size={15} aria-hidden="true" />
                </a>
                <a className="btn btn-ghost" href="#about">
                  О бренде
                </a>
              </div>

              <div className="hero-meta">
                <div>
                  <strong>925</strong>
                  <span>проба серебра</span>
                </div>
                <div>
                  <strong>2008</strong>
                  <span>год основания</span>
                </div>
                <div>
                  <strong>24 мес</strong>
                  <span>гарантия</span>
                </div>
              </div>
            </div>

            <AssemblyFilm />
          </div>

          <div className="container">
            <Reveal as="hr" variant="line" className="hairline" />
          </div>
        </section>

        {/* ============ ПРОДУКТ ============ */}
        <section className="section product" id="product" aria-labelledby="product-title">
          <div className="container product-grid">
            <div className="product-media">
              <div className="gallery-frame">
                <img
                  key={gallery[shot].src}
                  className="gallery-image"
                  src={gallery[shot].src}
                  alt={gallery[shot].alt}
                  width={1000}
                  height={1000}
                  loading="lazy"
                />
                <span className="gallery-count" aria-hidden="true">
                  {String(shot + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}
                </span>
              </div>

              <div className="gallery-thumbs" role="group" aria-label="Ракурсы изделия">
                {gallery.map((item, i) => (
                  <button
                    key={item.src}
                    type="button"
                    className={`thumb${i === shot ? ' is-active' : ''}`}
                    aria-pressed={i === shot}
                    onClick={() => setShot(i)}
                  >
                    <img src={item.src} alt="" width={120} height={120} loading="lazy" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="product-info">
              <Reveal as="p" className="eyebrow">
                Коллекция 01 · плетение curb
              </Reveal>

              <Reveal as="h2" className="product-name" id="product-title" delay={0.06}>
                Curb Link 925
              </Reveal>

              <Reveal className="section-lead" variant="blur" delay={0.12}>
                Плотное плетение из плоских звеньев ложится на запястье без зазоров.
                Каждое звено паяется и полируется вручную, поэтому линия остаётся ровной
                на всей длине.
              </Reveal>

              <Reveal className="price-row" delay={0.18}>
                <span className="price">14 900 ₽</span>
                <span className="price-note">в наличии · доставка от 1 дня</span>
              </Reveal>

              <Reveal delay={0.24} variant="mask">
                <dl className="spec-list">
                  <div>
                    <dt>Материал</dt>
                    <dd>Серебро 925 пробы</dd>
                  </div>
                  <div>
                    <dt>Покрытие</dt>
                    <dd>Родий, ручная полировка</dd>
                  </div>
                  <div>
                    <dt>Длина</dt>
                    <dd>19 см + 2 см удлинитель</dd>
                  </div>
                  <div>
                    <dt>Вес</dt>
                    <dd>32 г</dd>
                  </div>
                  <div>
                    <dt>Замок</dt>
                    <dd>Карабин-кольцо</dd>
                  </div>
                </dl>
              </Reveal>

              <Reveal className="product-actions" delay={0.3}>
                <button className="btn btn-primary" type="button" onClick={addToCart}>
                  Добавить в корзину
                </button>
                <a className="btn btn-ghost" href="#contact">
                  Написать консультанту
                </a>
              </Reveal>

              <Reveal className="guarantees" variant="left" delay={0.36}>
                {guarantees.map(item => (
                  <div key={item.label}>
                    <item.icon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                  </div>
                ))}
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ АНАТОМИЯ / СБОРКА ============ */}
        <section className="section anatomy" id="anatomy" aria-labelledby="anatomy-title">
          <div className="container">
            <div className="anatomy-head">
              <Reveal as="p" className="eyebrow">
                Анатомия изделия
              </Reveal>

              <div id="anatomy-title" style={{ marginTop: '18px' }}>
                <SplitText
                  text="Точность в каждой детали"
                  tag="h2"
                  className="section-title"
                  splitType="words"
                  effect="rise"
                  textAlign="left"
                  delay={70}
                  duration={1}
                  threshold={0.25}
                />
              </div>

              <Reveal className="section-lead" variant="blur" delay={0.1}>
                Браслет собирается по частям: звенья, замок и пайка. Мы показываем изнанку
                работы, потому что именно она держит форму.
              </Reveal>
            </div>

            <Reveal variant="mask" className="anatomy-figure">
              <div className="anatomy-frame">
                <img
                  src={asset('media/chain-parts.png')}
                  alt="Разложенные детали браслета: звенья curb, замок-кольцо и соединительные кольца"
                  width={1312}
                  height={1199}
                  loading="lazy"
                />
                {anatomy.map((item, i) => (
                  <span
                    key={item.label}
                    className="anatomy-mark"
                    style={{ left: `${item.x}%`, top: `${item.y}%`, '--d': `${i * 0.12}s` }}
                  >
                    <i>{String(i + 1).padStart(2, '0')}</i>
                    <b>{item.label}</b>
                  </span>
                ))}
              </div>
            </Reveal>

            <div className="assembly-grid">
              {steps.map((step, i) => (
                <Reveal
                  as="article"
                  className="assembly-card"
                  key={step.num}
                  delay={i * 0.12}
                >
                  <span className="num">{step.num}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ О БРЕНДЕ ============ */}
        <section className="section" id="about" aria-labelledby="about-title">
          <div className="container">
            <div className="about-grid">
              <div>
                <Reveal as="p" className="eyebrow">
                  О бренде
                </Reveal>
                <div id="about-title" style={{ marginTop: '18px' }}>
                  <SplitText
                    text="Мастерская, а не фабрика"
                    tag="h2"
                    className="section-title"
                    splitType="words"
                    effect="blur"
                    textAlign="left"
                    delay={60}
                    duration={1}
                    threshold={0.2}
                  />
                </div>
              </div>

              <div className="about-copy">
                <Reveal as="p" className="big" variant="blur" delay={0.05}>
                  FOREN JON'S основан в 2008 году. Мы верим, что украшение — не аксессуар,
                  а продолжение человека.
                </Reveal>
                <Reveal as="p" className="section-lead" delay={0.12}>
                  Каждый браслет создаётся вручную из стерлингового серебра 925 пробы.
                  Соединяем скандинавскую сдержанность с точностью ювелирной инженерии.
                  Форма без лишнего, характер без компромиссов.
                </Reveal>
                <Reveal as="p" className="section-lead" variant="left" delay={0.18}>
                  Небольшая мастерская, ограниченные партии и контроль каждой партии пробирным
                  надзором — так мы сохраняем качество, которое чувствуется с первого касания.
                </Reveal>
              </div>
            </div>

            <div className="timeline" aria-label="История бренда">
              {timeline.map((item, i) => (
                <Reveal key={item.year} variant="pop" delay={i * 0.1}>
                  <span className="year">{item.year}</span>
                  <p>{item.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ СЕРЕБРЯНОЕ ПОЛЕ ============ */}
        <section className="silver-field" aria-label="Манифест бренда">
          <div className="container">
            <SplitText
              text="Форма без лишнего"
              tag="p"
              className="quote"
              splitType="words"
              effect="wave"
              staggerFrom="center"
              textAlign="center"
              delay={70}
              duration={1.1}
              threshold={0.3}
            />
            <Reveal as="p" className="attrib" delay={0.15}>
              FOREN JON'S · Scandinavian silver · с 2008
            </Reveal>
          </div>
        </section>

        {/* ============ ХАРАКТЕРИСТИКИ ============ */}
        <section className="section" id="features" aria-labelledby="features-title">
          <div className="container">
            <div className="features-head">
              <Reveal as="p" className="eyebrow">
                Характеристики и защита
              </Reveal>
              <div id="features-title">
                <SplitText
                  text="Всё, что должно быть"
                  tag="h2"
                  className="section-title"
                  splitType="words, chars"
                  effect="skew"
                  textAlign="left"
                  delay={55}
                  duration={0.95}
                  threshold={0.2}
                />
              </div>
              <Reveal className="section-lead" variant="blur" delay={0.1}>
                Материал, покрытие, гарантия и документы — без мелкого шрифта.
              </Reveal>
            </div>

            <div className="features-grid">
              {features.map((item, i) => (
                <Reveal
                  as="article"
                  className="feature-card"
                  key={item.title}
                  delay={(i % 4) * 0.08}
                >
                  <span className="feature-icon">
                    <item.icon size={18} strokeWidth={1.4} aria-hidden="true" />
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ============ ФИНАЛЬНЫЙ CTA ============ */}
        <section className="section closing" id="contact" aria-labelledby="closing-title">
          <div className="container closing-grid">
            <div>
              <Reveal as="p" className="eyebrow" style={{ color: '#8a8f97' }}>
                Начните с одной детали
              </Reveal>
              <div id="closing-title" style={{ marginTop: '16px' }}>
                <SplitText
                  text="Браслет, который остаётся"
                  tag="h2"
                  className="section-title"
                  splitType="words"
                  effect="pop"
                  textAlign="left"
                  delay={60}
                  duration={1}
                  threshold={0.2}
                />
              </div>
              <Reveal as="p" className="lead" variant="left" delay={0.12}>
                Новости коллекций, дропы и закрытые показы — редко и по делу. Подписка
                необязательна и отменяется в один клик.
              </Reveal>
            </div>

            <Reveal delay={0.16}>
              <form
                className="subscribe"
                onSubmit={event => {
                  event.preventDefault()
                  setSubscribed(true)
                }}
              >
                <label htmlFor="email">Подписка на новости</label>
                <div className="subscribe-row">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="ваша@почта.ru"
                    autoComplete="email"
                  />
                  <button className="btn btn-light" type="submit">
                    {subscribed ? <Check size={15} aria-hidden="true" /> : null}
                    {subscribed ? 'Готово' : 'Подписаться'}
                  </button>
                </div>
                {subscribed ? (
                  <p className="ok" role="status">
                    Спасибо! Первое письмо придёт с анонсом новой коллекции.
                  </p>
                ) : (
                  <p className="note">Без спама. Отписка в один клик.</p>
                )}
              </form>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <p className="footer-brand">FOREN JON'S</p>
              <p style={{ fontSize: '0.9rem', maxWidth: '30ch' }}>
                Серебряные браслеты ручной работы. С 2008 года.
              </p>
            </div>

            <div>
              <h4>Навигация</h4>
              <ul>
                {navLinks.map(link => (
                  <li key={link.href}>
                    <a href={link.href}>{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4>Контакты</h4>
              <ul>
                <li>
                  <a href="tel:+74950000000">
                    <Phone size={14} aria-hidden="true" style={{ display: 'inline' }} /> +7 495
                    000-00-00
                  </a>
                </li>
                <li>
                  <a href="mailto:hello@forenjons.com">
                    <Mail size={14} aria-hidden="true" style={{ display: 'inline' }} />{' '}
                    hello@forenjons.com
                  </a>
                </li>
                <li>
                  <MapPin size={14} aria-hidden="true" style={{ display: 'inline' }} /> Москва,
                  ул. Ильинка, 12
                </li>
              </ul>
            </div>

            <div>
              <h4>Соцсети</h4>
              <ul>
                <li>
                  <a href="https://instagram.com" rel="noopener noreferrer" target="_blank">
                    Instagram
                  </a>
                </li>
                <li>
                  <a href="https://t.me" rel="noopener noreferrer" target="_blank">
                    Telegram
                  </a>
                </li>
                <li>
                  <a href="https://youtube.com" rel="noopener noreferrer" target="_blank">
                    YouTube
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <span>© 2026 FOREN JON'S. Все права защищены.</span>
            <span>
              Публичная оферта · Политика конфиденциальности · Возврат и обмен · Серебро 925
            </span>
          </div>
        </div>
      </footer>

      <div className={`toast${toast ? ' is-on' : ''}`} role="status" aria-live="polite">
        {toast}
      </div>
    </>
  )
}
