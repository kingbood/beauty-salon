// Strand-based hair physics: Verlet integration + wind field driven by cursor (hairdryer).

const GRAVITY = 380 // px/s^2, image-space
const DAMPING = 0.97
const CONSTRAINT_ITERATIONS = 8

function dist(ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  return Math.sqrt(dx * dx + dy * dy) || 0.0001
}

class Strand {
  constructor(anchorX, anchorY, length, segmentCount, seed) {
    this.segLen = length / segmentCount
    this.seed = seed
    this.px = new Float32Array(segmentCount + 1)
    this.py = new Float32Array(segmentCount + 1)
    this.ox = new Float32Array(segmentCount + 1)
    this.oy = new Float32Array(segmentCount + 1)
    this.anchorX = anchorX
    this.anchorY = anchorY
    this.width = 1.4 + (seed % 1) * 1.8
    this.tone = seed % 1 // 0..1 used for color variance
    this.initialized = false
  }

  get count() {
    return this.px.length
  }

  // Moves the anchor to (x, y). The first call lays the whole strand out
  // hanging from that point; later calls (e.g. on resize) translate every
  // existing point by the same delta so the strand keeps its current
  // physics shape instead of snapping the root across the canvas while
  // the rest of the chain is left behind (which reads as a huge fake
  // stretch and makes the solver fling the strand like a whip).
  relocate(x, y) {
    if (!this.initialized) {
      const n = this.count
      for (let i = 0; i < n; i++) {
        const py = y + i * this.segLen
        const px = x + Math.sin(this.seed * 12.9 + i * 0.15) * 1.5
        this.px[i] = px
        this.py[i] = py
        this.ox[i] = px
        this.oy[i] = py
      }
      this.initialized = true
    } else {
      const dx = x - this.anchorX
      const dy = y - this.anchorY
      const n = this.count
      for (let i = 0; i < n; i++) {
        this.px[i] += dx
        this.py[i] += dy
        this.ox[i] += dx
        this.oy[i] += dy
      }
    }
    this.anchorX = x
    this.anchorY = y
  }

  step(dt, windFn, t) {
    const n = this.count
    const px = this.px, py = this.py, ox = this.ox, oy = this.oy

    // Verlet integration
    for (let i = 1; i < n; i++) {
      const vx = (px[i] - ox[i]) * DAMPING
      const vy = (py[i] - oy[i]) * DAMPING
      ox[i] = px[i]
      oy[i] = py[i]

      let ax = 0
      let ay = GRAVITY

      const w = windFn(px[i], py[i])
      ax += w.x
      ay += w.y

      // gentle ambient flutter so hair is never perfectly static
      const flutter = Math.sin(t * 1.6 + this.seed * 7 + i * 0.4)
      ax += flutter * 6
      ay += Math.cos(t * 1.2 + this.seed * 5 + i * 0.3) * 2

      px[i] += vx + 0.5 * ax * dt * dt
      py[i] += vy + 0.5 * ay * dt * dt
    }

    // root pinned to anchor (moves with head, fixed relative point)
    px[0] = this.anchorX
    py[0] = this.anchorY
    ox[0] = this.anchorX
    oy[0] = this.anchorY

    // distance constraints (keeps strand length ~constant)
    for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
      for (let i = 0; i < n - 1; i++) {
        const dx = px[i + 1] - px[i]
        const dy = py[i + 1] - py[i]
        const d = Math.sqrt(dx * dx + dy * dy) || 0.0001
        const diff = (d - this.segLen) / d
        const offX = dx * 0.5 * diff
        const offY = dy * 0.5 * diff
        if (i !== 0) {
          px[i] += offX
          py[i] += offY
        }
        px[i + 1] -= offX
        py[i + 1] -= offY
      }
      px[0] = this.anchorX
      py[0] = this.anchorY
    }
  }
}

export class HairSystem {
  constructor() {
    this.strands = []
    this.wind = { x: 0, y: 0, active: false }
    this.time = 0
  }

  // anchors: array of {fx, fy, lenFrac, segs, seed}. fx/fy are 0..1 fractions of the "cover rect".
  build(anchors) {
    this.anchorDefs = anchors
    this.strands = anchors.map((a) =>
      new Strand(0, 0, a.lenPx, a.segs, a.seed)
    )
  }

  updateAnchors(rect) {
    for (let i = 0; i < this.strands.length; i++) {
      const a = this.anchorDefs[i]
      this.strands[i].relocate(rect.x + a.fx * rect.w, rect.y + a.fy * rect.h)
    }
  }

  // cursor in same coordinate space as anchors (canvas px). null => no wind.
  setCursor(cursor, prevCursor) {
    this.cursor = cursor
    this.cursorVel = cursor && prevCursor
      ? { x: cursor.x - prevCursor.x, y: cursor.y - prevCursor.y }
      : { x: 0, y: 0 }
  }

  step(dt) {
    this.time += dt
    const cursor = this.cursor
    const cursorVel = this.cursorVel || { x: 0, y: 0 }
    const t = this.time

    const windFn = (px, py) => {
      if (!cursor) return { x: 0, y: 0 }
      const dx = px - cursor.x
      const dy = py - cursor.y
      const d = Math.sqrt(dx * dx + dy * dy) || 0.0001
      const radius = cursor.radius || 420
      if (d > radius) return { x: 0, y: 0 }
      const falloff = Math.pow(1 - d / radius, 1.6)
      const strength = (cursor.strength || 2200) * falloff
      // hairdryer blast: mostly horizontal push away from nozzle,
      // with a little upward lift + directional kick from cursor movement
      const nx = dx / d
      const ny = dy / d
      const swirl = Math.sin(t * 9 + px * 0.01) * 0.18
      return {
        x: nx * strength + cursorVel.x * 9 + swirl * strength,
        y: ny * strength * 0.35 - strength * 0.12,
      }
    }

    for (const s of this.strands) s.step(dt, windFn, t)
  }
}
