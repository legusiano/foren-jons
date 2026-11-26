import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/* ============================================================
   Серебряный браслет-цепочка. Управление — только на самом
   объекте: клик (анимации), драг (вращение с инерцией),
   ховер (блик + лёгкое приближение), двойной клик (сброс ракурса).

   Анимации чередуются при каждом клике из покоя:
   1. unfold  — раскрытие звеньев в дугу / складывание обратно
   2. scatter — распад на звенья с зависанием и сборкой
   3. spin    — доворот на профиль 360° и возврат
   4. wave    — волна гибкости по окружности
   5. pulse   — волна блика по металлу (без изменения формы)
   ============================================================ */

const N = 22 // количество звеньев
const R = 3 // радиус кольца
const SPACING = (Math.PI * 2 * R) / N
const ARC_R = 6.5 // радиус дуги при раскладке
const BASE_ENV = 1.5
const HOVER_ENV = 0.6

const MODES = ['unfold', 'scatter', 'spin', 'wave', 'pulse']
const ONESHOT = new Set(['spin', 'wave', 'pulse'])
// длительность [наружу, возврат] в секундах — у каждой анимации свой тайминг
const DUR = {
  unfold: [1.3, 1.05],
  scatter: [1.1, 1.4],
  spin: [1.75, 1.5],
  wave: [1.95, 1.7],
  pulse: [1.15, 0.95],
}

const clamp01 = v => Math.min(1, Math.max(0, v))
const easeOutQuint = t => 1 - Math.pow(1 - t, 5)
const easeInOutCubic = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOutBack = t => {
  const c1 = 1.12
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches
  )
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mq) return undefined
    const handler = () => setReduced(mq.matches)
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])
  return reduced
}

/* ---------- подгонка камеры под размер сцены ---------- */

function FitCamera({ fitRef }) {
  const camera = useThree(s => s.camera)
  const size = useThree(s => s.size)
  const controls = useThree(s => s.controls)

  useEffect(() => {
    const half = ((camera.fov * Math.PI) / 180) * 0.5
    const aspect = Math.max(size.width, 1) / Math.max(size.height, 1)
    const fitV = 2.05 / Math.tan(half)
    const fitH = 3.9 / (Math.tan(half) * aspect)
    const dist = Math.max(7, fitV, fitH)
    fitRef.current = dist
    const dir = camera.position.clone()
    if (dir.lengthSq() < 0.0001) dir.set(0, 0.37, 0.93)
    dir.normalize().multiplyScalar(dist)
    camera.position.copy(dir)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
    controls?.update?.()
  }, [camera, size, controls, fitRef])

  return null
}

/* ---------- цепочка и все её анимации ---------- */

function Chain({ apiRef, reduced, onHover, name }) {
  const floatRef = useRef(null)
  const chainRef = useRef(null)
  const linkRefs = useRef([])
  const hoverIdx = useRef(-1)
  const hoverAmt = useRef(new Float32Array(N))
  const lastCursor = useRef(false)

  const st = useRef({ mode: 'rest', dir: 0, t: 0, cycle: 0 })

  const raycaster = useThree(s => s.raycaster)
  const camera = useThree(s => s.camera)
  const gl = useThree(s => s.gl)
  const ndc = useMemo(() => new THREE.Vector2(), [])

  const geometry = useMemo(() => new THREE.TorusGeometry(0.5, 0.135, 12, 30), [])
  const materials = useMemo(() => {
    const list = []
    for (let i = 0; i < N; i += 1) {
      const m = new THREE.MeshStandardMaterial({
        color: '#f0f2f5',
        metalness: 1,
        roughness: 0.12,
        envMapIntensity: BASE_ENV,
        emissive: new THREE.Color('#d7e0ec'),
        emissiveIntensity: 0,
      })
      list.push(m)
    }
    return list
  }, [])

  useEffect(
    () => () => {
      geometry.dispose()
      materials.forEach(m => m.dispose())
    },
    [geometry, materials]
  )

  // позы покоя и позы «дуги» для раскрытия + параметры распада
  const poses = useMemo(() => {
    const circle = []
    const arc = []
    const scatter = []
    for (let i = 0; i < N; i += 1) {
      const th = (i / N) * Math.PI * 2
      const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, th + Math.PI / 2))
      circle.push({
        pos: new THREE.Vector3(R * Math.cos(th), R * Math.sin(th), 0),
        quat,
      })
      const a = (i - (N - 1) / 2) * (SPACING / ARC_R)
      arc.push({
        pos: new THREE.Vector3(ARC_R * Math.sin(a), ARC_R * (1 - Math.cos(a)), 0),
        quat: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, a)),
      })
      // детерминированные «случайности» для распада
      const seed = Math.sin(i * 12.9898) * 43758.5453
      const rnd = seed - Math.floor(seed)
      const rnd2 = ((seed * 7.13) % 1 + 1) % 1
      const dir = new THREE.Vector3(
        Math.cos(th) + (rnd - 0.5) * 0.5,
        Math.sin(th) + (rnd2 - 0.5) * 0.5,
        (rnd2 - 0.5) * 2.6
      ).normalize()
      scatter.push({
        dir,
        dist: 1.5 + rnd * 1.8,
        quat: quat
          .clone()
          .multiply(
            new THREE.Quaternion().setFromEuler(
              new THREE.Euler(
                (rnd - 0.5) * 1.6,
                (rnd2 - 0.5) * 1.6,
                (rnd - 0.5) * 1.2
              )
            )
          ),
      })
    }
    return { circle, arc, scatter }
  }, [])

  // API сцены: клик и сброс — без каких-либо кнопок
  useEffect(() => {
    if (!apiRef.current) apiRef.current = {}
    apiRef.current.click = () => {
      const s = st.current
      if (s.mode === 'rest') {
        s.mode = MODES[s.cycle % MODES.length]
        s.cycle += 1
        s.t = 0
        s.dir = 1
      } else if (!ONESHOT.has(s.mode)) {
        // раскрытие/распад: покой или игра → возврат; возврат → снова наружу
        s.dir = s.dir === -1 ? 1 : -1
      } else if (s.dir === 1) {
        s.dir = -1 // корректное прерывание одноразовой анимации
      }
      // во время возврата одноразовой анимации клик игнорируется
    }
    apiRef.current.reset = () => {
      const s = st.current
      s.mode = 'rest'
      s.dir = s.t > 0 ? -1 : 0
      if (s.t <= 0) s.t = 0
    }
    // синхронная проверка «попал ли указатель в звено» — работает и для тапа
    apiRef.current.hitTest = (clientX, clientY) => {
      const el = gl.domElement
      if (!el) return false
      const rect = el.getBoundingClientRect()
      if (!rect.width || !rect.height) return false
      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1
      )
      raycaster.setFromCamera(ndc, camera)
      const objs = linkRefs.current.filter(Boolean)
      return raycaster.intersectObjects(objs, true).length > 0
    }
    return () => {
      apiRef.current.click = null
      apiRef.current.reset = null
      apiRef.current.hitTest = null
    }
  }, [apiRef, raycaster, camera, gl, ndc])

  const tmpPos = useMemo(() => new THREE.Vector3(), [])
  const tmpQuat = useMemo(() => new THREE.Quaternion(), [])
  const tmpQuat2 = useMemo(() => new THREE.Quaternion(), [])
  const tmpEuler = useMemo(() => new THREE.Euler(), [])

  // dev-отладка (в прод-сборку не попадает): состояние анимаций для проверки
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined
    window.__bracelet = window.__bracelet || {}
    window.__bracelet[name || 'default'] = { st, hoverIdx }
    return () => {
      if (import.meta.env.DEV && window.__bracelet) delete window.__bracelet[name || 'default']
    }
  }, [st, hoverIdx, name])

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05)
    const time = state.clock.elapsedTime
    const s = st.current

    // ---- временной прогресс активной анимации ----
    if (s.mode !== 'rest' && s.dir !== 0) {
      const dur = DUR[s.mode] || [1, 1]
      const step = dt / (s.dir === 1 ? dur[0] : dur[1])
      if (s.dir === 1) {
        s.t = Math.min(1, s.t + step)
        if (s.t >= 1) s.dir = ONESHOT.has(s.mode) ? -1 : 0
      } else {
        s.t = Math.max(0, s.t - step)
        if (s.t <= 0) {
          s.mode = 'rest'
          s.dir = 0
        }
      }
    }
    const mode = s.mode
    const t = s.t
    const stagger = reduced ? 0 : 0.5

    // ---- трансформация всей группы ----
    if (chainRef.current) {
      let rx = -Math.PI / 2
      let ry = 0
      if (mode === 'spin') {
        const te = easeInOutCubic(t)
        rx = -Math.PI / 2 + (Math.PI / 2 - 0.14) * Math.sin(Math.PI * te)
        ry = Math.PI * 2 * te
      }
      chainRef.current.rotation.set(rx, ry, 0)
      let sc = 1
      if (mode === 'unfold') sc = 1 - 0.56 * t
      else if (mode === 'scatter') sc = 1 - 0.12 * t
      else if (mode === 'spin') sc = 1 - 0.4 * Math.sin(Math.PI * easeInOutCubic(t))
      chainRef.current.scale.setScalar(sc)
    }

    // ---- парение в воздухе + лёгкое приближение при ховере ----
    if (floatRef.current) {
      const amp = reduced ? 0 : 1
      floatRef.current.position.y = Math.sin(time * 0.75) * 0.17 * amp
      floatRef.current.rotation.z = Math.sin(time * 0.45) * 0.055 * amp
      floatRef.current.rotation.x = Math.sin(time * 0.6) * 0.035 * amp
      const wantScale = hoverIdx.current >= 0 && !reduced ? 1.045 : 1
      const cur = floatRef.current.scale.x
      const next = cur + (wantScale - cur) * (1 - Math.exp(-dt / 0.16))
      floatRef.current.scale.setScalar(next)
    }

    // ---- позы звеньев ----
    for (let i = 0; i < N; i += 1) {
      const link = linkRefs.current[i]
      if (!link) continue
      const c = poses.circle[i]

      if (mode === 'unfold') {
        const d = (i / N) * stagger
        const u = easeOutQuint(clamp01((t - d) / Math.max(0.001, 1 - stagger)))
        tmpPos.lerpVectors(c.pos, poses.arc[i].pos, u)
        tmpQuat.slerpQuaternions(c.quat, poses.arc[i].quat, u)
      } else if (mode === 'scatter') {
        const d = (i / N) * stagger
        const u = easeOutBack(clamp01((t - d) / Math.max(0.001, 1 - stagger)))
        tmpPos.copy(c.pos).addScaledVector(poses.scatter[i].dir, poses.scatter[i].dist * u)
        tmpQuat.slerpQuaternions(c.quat, poses.scatter[i].quat, u)
      } else if (mode === 'wave') {
        const env = Math.sin(Math.PI * t)
        const ph = (i / N) * Math.PI * 4 - t * Math.PI * 3.4
        const w = (reduced ? 0.22 : 0.52) * env * Math.sin(ph)
        tmpPos.set(c.pos.x, c.pos.y, c.pos.z + w)
        const tilt = 0.17 * env * Math.cos(ph)
        tmpEuler.set(tilt, 0, 0)
        tmpQuat2.setFromEuler(tmpEuler)
        tmpQuat.multiplyQuaternions(c.quat, tmpQuat2)
      } else {
        tmpPos.copy(c.pos)
        tmpQuat.copy(c.quat)
      }

      link.position.copy(tmpPos)
      link.quaternion.copy(tmpQuat)
    }

    // ---- материал: блик при ховере + волна pulse ----
    const pulseOn = mode === 'pulse'
    const envP = pulseOn ? Math.sin(Math.PI * t) : 0
    const arr = hoverAmt.current
    for (let i = 0; i < N; i += 1) {
      const want = i === hoverIdx.current ? 1 : 0
      arr[i] += (want - arr[i]) * (1 - Math.exp(-dt / 0.12))
      let em = 0.32 * arr[i]
      let env = BASE_ENV + HOVER_ENV * arr[i]
      if (pulseOn) {
        const d = i / N - t
        const g = Math.exp(-(d * d) / (2 * 0.014)) * envP
        em += 1.8 * g
        env += 2.4 * g
      }
      const m = materials[i]
      m.emissiveIntensity = em
      m.envMapIntensity = env
    }
  })

  const handleOver = index => e => {
    e.stopPropagation()
    hoverIdx.current = index
    if (!lastCursor.current) {
      lastCursor.current = true
      onHover?.(true)
    }
  }
  const handleOut = () => {
    hoverIdx.current = -1
    if (lastCursor.current) {
      lastCursor.current = false
      onHover?.(false)
    }
  }

  return (
    <group ref={floatRef}>
      <group ref={chainRef} rotation={[-Math.PI / 2, 0, 0]}>
        {Array.from({ length: N }, (_, i) => (
          <group
            key={i}
            ref={el => {
              linkRefs.current[i] = el
            }}
          >
            <mesh
              geometry={geometry}
              material={materials[i]}
              scale={[1.42, 0.95, 0.5]}
              rotation-x={i % 2 ? Math.PI / 2 : 0}
              onPointerOver={handleOver(i)}
              onPointerOut={handleOut}
            />
          </group>
        ))}
      </group>
    </group>
  )
}

/* ---------- сцена целиком ---------- */

function Rig({ apiRef, reduced, onHover, onDragChange, resetSignal, fitRef, name }) {
  const controls = useThree(s => s.controls)

  useEffect(() => {
    if (resetSignal > 0 && controls) {
      const dir = new THREE.Vector3(0, 0.37, 0.93).normalize().multiplyScalar(fitRef.current || 8.6)
      controls.object.position.copy(dir)
      controls.object.lookAt(0, 0, 0)
      controls.target.set(0, 0, 0)
      controls.update()
      controls.saveState?.()
    }
  }, [resetSignal, controls, fitRef])

  return (
    <>
      <FitCamera fitRef={fitRef} />
      <ambientLight intensity={0.16} />
      <directionalLight position={[5, 8, 6]} intensity={0.95} />
      <directionalLight position={[-6, 4, -5]} intensity={0.35} />

      {/* локальная студийная среда — без внешних загрузок */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#585d65']} />
        <Lightformer
          intensity={4.2}
          position={[0, 6, 3]}
          rotation-x={Math.PI / 2}
          scale={[14, 9, 1]}
        />
        <Lightformer intensity={2.1} position={[-6, 2, 4]} rotation-y={Math.PI / 3.4} scale={[8, 8, 1]} />
        <Lightformer intensity={2.7} position={[6, 3, -3]} rotation-y={-Math.PI / 3.2} scale={[7, 9, 1]} />
        <Lightformer
          intensity={1.3}
          position={[0, -5, 2]}
          rotation-x={-Math.PI / 2}
          scale={[12, 8, 1]}
        />
      </Environment>

      <Chain apiRef={apiRef} reduced={reduced} onHover={onHover} name={name} />

      <OrbitControls
        makeDefault
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.07}
        rotateSpeed={0.75}
        autoRotate={!reduced}
        autoRotateSpeed={0.55}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI - 0.25}
        target={[0, 0, 0]}
        onStart={() => onDragChange?.(true)}
        onEnd={() => onDragChange?.(false)}
      />
    </>
  )
}

/**
 * Обёртка: drag/свайп — вращение, клик — анимации, двойной клик — сброс ракурса.
 * Кнопок нет: управление только самим браслетом.
 */
export default function Bracelet3D({ variant = 'hero' }) {
  const [hover, setHover] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [ready, setReady] = useState(false)
  const [inView, setInView] = useState(true)
  const [resetSignal, setResetSignal] = useState(0)

  const apiRef = useRef({})
  const fitRef = useRef(8.6)
  const downRef = useRef(null)
  const wrapRef = useRef(null)
  const reduced = usePrefersReducedMotion()

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return undefined
    const io = new IntersectionObserver(
      entries => entries.forEach(e => setInView(e.isIntersecting)),
      { threshold: 0.02 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const onPointerDown = e => {
    downRef.current = { x: e.clientX, y: e.clientY }
  }

  const onPointerUp = e => {
    const start = downRef.current
    downRef.current = null
    if (!start) return
    // короткое нажатие ИМЕННО по звену браслета = анимация (драг не считается)
    if (Math.hypot(e.clientX - start.x, e.clientY - start.y) >= 7) return
    if (apiRef.current.hitTest?.(start.x, start.y)) apiRef.current.click?.()
  }

  const onDoubleClick = () => {
    apiRef.current.reset?.()
    setResetSignal(v => v + 1)
  }

  const onKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      apiRef.current.click?.()
    }
  }

  const handleCreated = useCallback(() => setReady(true), [])
  const handleHover = useCallback(v => setHover(v), [])
  const handleDrag = useCallback(v => setDragging(v), [])

  const cursorClass = dragging ? 'is-grabbing' : hover ? 'is-pointer' : ''

  return (
    <div
      ref={wrapRef}
      className={`stage stage-${variant}${cursorClass ? ` ${cursorClass}` : ''}`}
      role="img"
      tabIndex={0}
      aria-label="Интерактивная 3D-модель серебряного браслета VOREN JONS: перетаскивание вращает, клик запускает анимацию, двойной клик сбрасывает ракурс."
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
    >
      <span className="stage-badge">3D · 925</span>

      <Canvas
        dpr={[1, 1.75]}
        frameloop={inView ? 'always' : 'never'}
        camera={{ position: [0, 3.2, 8.4], fov: 34 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={handleCreated}
      >
        <Suspense fallback={null}>
          <Rig
            apiRef={apiRef}
            reduced={reduced}
            onHover={handleHover}
            onDragChange={handleDrag}
            resetSignal={resetSignal}
            fitRef={fitRef}
            name={variant}
          />
        </Suspense>
      </Canvas>

      <div className={`stage-loader${ready ? ' is-done' : ''}`} aria-hidden={ready}>
        <div className="loader-ring" />
        <span className="loader-label">Загрузка модели</span>
      </div>

      <p className="stage-hint">Вращайте • кликните, чтобы раскрыть</p>
    </div>
  )
}
