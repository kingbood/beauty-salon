import { useEffect, useRef, useState } from 'react'
import { HairSystem } from './HairSystem'
import { buildHairAnchors } from './anchors'
import modelSrc from '../assets/model.webp'

// Computes a CSS `background-size: cover`-equivalent rect for drawing
// `img` into a `cw`x`ch` canvas.
// topAlign: 0 keeps the very top of the image pinned (crop only from the
// bottom), 0.5 centers the crop. We bias toward the top so the hairline
// never scrolls out of frame on wide/short viewports.
function coverRect(iw, ih, cw, ch, topAlign = 0.5) {
  const scale = Math.max(cw / iw, ch / ih)
  const w = iw * scale
  const h = ih * scale
  const x = (cw - w) / 2
  const y = h <= ch ? (ch - h) / 2 : -(h - ch) * topAlign
  return { x, y, w, h }
}

function strokeStrand(ctx, s, rect) {
  const n = s.count
  const px = s.px, py = s.py
  const rootAlpha = 0.92
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = 0; i < n - 1; i++) {
    const t = i / (n - 1)
    const width = s.width * (1 - t * 0.75)
    const shade = 6 + s.tone * 10 + t * 14 // darker at root, faint warm lift at tip
    const alpha = rootAlpha * (1 - t * 0.55)
    ctx.strokeStyle = `rgba(${shade + 4}, ${shade}, ${shade + 2}, ${alpha})`
    ctx.lineWidth = Math.max(0.4, width)
    ctx.beginPath()
    const mx = (px[i] + px[i + 1]) / 2
    const my = (py[i] + py[i + 1]) / 2
    if (i === 0) {
      ctx.moveTo(px[i], py[i])
    } else {
      const pmx = (px[i - 1] + px[i]) / 2
      const pmy = (py[i - 1] + py[i]) / 2
      ctx.moveTo(pmx, pmy)
    }
    ctx.quadraticCurveTo(px[i], py[i], mx, my)
    ctx.stroke()
  }
}

export default function HairCanvas({ active }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const cursorRef = useRef(null)
  const imgRef = useRef(null)
  const systemRef = useRef(null)
  const rectRef = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const cursorPos = useRef(null)
  const prevCursorPos = useRef(null)
  const rafRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [blowing, setBlowing] = useState(false)

  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.src = modelSrc
    img.onload = () => {
      if (cancelled) return
      imgRef.current = img
      systemRef.current = new HairSystem()
      systemRef.current.build(buildHairAnchors())
      setReady(true)
    }
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const ctx = canvas.getContext('2d')
    let dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      const w = wrap.clientWidth
      const h = wrap.clientHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      rectRef.current = coverRect(imgRef.current.width, imgRef.current.height, w, h, 0.07)
      systemRef.current.updateAnchors(rectRef.current)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    function toLocal(clientX, clientY) {
      const b = wrap.getBoundingClientRect()
      return { x: clientX - b.left, y: clientY - b.top }
    }

    function handleMove(clientX, clientY) {
      const p = toLocal(clientX, clientY)
      prevCursorPos.current = cursorPos.current
      cursorPos.current = p
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${p.x}px, ${p.y}px)`
      }
    }

    function onPointerMove(e) {
      handleMove(e.clientX, e.clientY)
      setBlowing(true)
    }
    function onPointerLeave() {
      cursorPos.current = null
      setBlowing(false)
    }
    function onPointerDown() {
      setBlowing(true)
    }

    wrap.addEventListener('pointermove', onPointerMove)
    wrap.addEventListener('pointerleave', onPointerLeave)
    wrap.addEventListener('pointerdown', onPointerDown)

    let last = performance.now()
    function frame(now) {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now

      const rect = rectRef.current
      const sys = systemRef.current

      let cursor = null
      if (cursorPos.current) {
        cursor = { ...cursorPos.current, radius: rect.w * 0.42, strength: 2600 }
      }
      sys.setCursor(cursor, prevCursorPos.current)
      sys.step(dt)

      const w = wrap.clientWidth
      const h = wrap.clientHeight
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(imgRef.current, rect.x, rect.y, rect.w, rect.h)

      for (const s of sys.strands) strokeStrand(ctx, s, rect)

      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafRef.current)
      ro.disconnect()
      wrap.removeEventListener('pointermove', onPointerMove)
      wrap.removeEventListener('pointerleave', onPointerLeave)
      wrap.removeEventListener('pointerdown', onPointerDown)
    }
  }, [ready])

  return (
    <div className={`hair-stage ${active ? 'is-active' : ''}`} ref={wrapRef}>
      <canvas ref={canvasRef} className="hair-canvas" />
      <div className={`dryer-cursor ${blowing ? 'is-blowing' : ''}`} ref={cursorRef}>
        <svg viewBox="0 0 64 64" width="64" height="64">
          <g transform="translate(32,32)">
            <path
              d="M -22 -6 L 6 -14 Q 20 -14 20 0 Q 20 14 6 14 L -22 6 Z"
              fill="url(#body)"
              stroke="#0c0c0f"
              strokeWidth="1.5"
            />
            <path d="M -10 6 L -14 22 L -2 22 L 2 6 Z" fill="url(#handle)" stroke="#0c0c0f" strokeWidth="1.5" />
            <circle cx="15" cy="0" r="8.5" fill="#1a1a1e" stroke="#3a3a42" strokeWidth="1" />
            <circle cx="15" cy="0" r="5.5" fill="#0a0a0c" />
            <g className="dryer-blast" stroke="#ffd9a0" strokeWidth="1.4" strokeLinecap="round" opacity="0.85">
              <path d="M -26 -3 L -40 -9" />
              <path d="M -27 0 L -44 0" />
              <path d="M -26 3 L -40 9" />
            </g>
          </g>
          <defs>
            <linearGradient id="body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#3a3a42" />
              <stop offset="1" stopColor="#17171b" />
            </linearGradient>
            <linearGradient id="handle" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2a2a30" />
              <stop offset="1" stopColor="#111114" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}
