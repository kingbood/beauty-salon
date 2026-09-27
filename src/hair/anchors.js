// Generates hair-strand anchor points tracing the approximate hairline of the
// portrait in src/assets/model.webp. Coordinates are fractions (0..1) of the
// "cover rect" the photo is drawn into (which always matches the full image's
// aspect ratio), so the layout is resolution independent.
//
// The face in the source photo sits right of center (part around fx 0.60),
// with less hair over the forehead on the right side and more sweeping down
// the left cheek -- these control points were hand-picked against the photo,
// not symmetric.

function mulberry32(seed) {
  let a = seed
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function pointOnPolyline(points, t) {
  const segs = points.length - 1
  const f = t * segs
  const i = Math.min(Math.floor(f), segs - 1)
  const local = f - i
  const [ax, ay] = points[i]
  const [bx, by] = points[i + 1]
  return [ax + (bx - ax) * local, ay + (by - ay) * local]
}

const LEFT_HAIRLINE = [
  [0.58, 0.07],
  [0.47, 0.13],
  [0.38, 0.21],
  [0.30, 0.32],
  [0.24, 0.45],
  [0.20, 0.58],
  [0.17, 0.72],
  [0.15, 0.88],
]

const RIGHT_HAIRLINE = [
  [0.63, 0.055],
  [0.705, 0.095],
  [0.775, 0.15],
  [0.83, 0.23],
  [0.865, 0.34],
  [0.885, 0.47],
  [0.90, 0.61],
  [0.91, 0.80],
]

function hairlineStrands(rand, polyline, count, out, tStart = 0) {
  for (let i = 0; i < count; i++) {
    const t = tStart + (i / (count - 1)) * (1 - tStart)
    const [fx, fy] = pointOnPolyline(polyline, t)
    // hair nearer the crown is longer (falls further past the shoulder);
    // hair starting already low on the shoulder needs less extra length.
    const lenPx = 620 - t * 180 + rand() * 180
    out.push({ fx, fy, lenPx, segs: 22, seed: rand() * 1000 })
  }
}

function backVolume(rand, side, count, out) {
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const fx = side < 0 ? 0.12 - t * 0.03 : 0.93 + t * 0.03
    const fy = 0.30 + t * 0.18
    const lenPx = 380 + rand() * 240
    out.push({ fx, fy, lenPx, segs: 16, seed: rand() * 1000 })
  }
}

function crownWisps(rand, count, out) {
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1)
    const fx = 0.56 + t * 0.10
    const fy = 0.05 + Math.sin(t * Math.PI) * 0.008
    const lenPx = 60 + rand() * 50
    out.push({ fx, fy, lenPx, segs: 6, seed: rand() * 1000 })
  }
}

export function buildHairAnchors() {
  const rand = mulberry32(1337)
  const anchors = []

  hairlineStrands(rand, LEFT_HAIRLINE, 26, anchors, 0.3)
  hairlineStrands(rand, RIGHT_HAIRLINE, 26, anchors, 0.32)
  backVolume(rand, -1, 14, anchors)
  backVolume(rand, 1, 14, anchors)
  crownWisps(rand, 8, anchors)

  return anchors
}
