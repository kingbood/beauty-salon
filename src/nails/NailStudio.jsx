import { useState } from 'react'

const COLORS = [
  { id: 'nude', name: 'Nude Silk', hex: '#c9a48a', finish: 'glossy' },
  { id: 'rouge', name: 'Rouge Noir', hex: '#7a1220', finish: 'glossy' },
  { id: 'black', name: 'Noir Velvet', hex: '#141416', finish: 'matte' },
  { id: 'blush', name: 'Blush Milk', hex: '#e7c9c9', finish: 'glossy' },
  { id: 'chrome', name: 'Chrome Pearl', hex: '#d8d9de', finish: 'chrome' },
  { id: 'choco', name: 'Cocoa', hex: '#5a3a2c', finish: 'glossy' },
]

// A stylised hand illustration; each nail is its own path so a colour +
// finish can be composited onto it independently, the same way a real
// "photo over photo" overlay would clip a polish layer to a nail mask.
function Hand({ color }) {
  const nailFill = color.hex
  const isChrome = color.finish === 'chrome'
  const isMatte = color.finish === 'matte'

  return (
    <svg viewBox="0 0 420 520" className="nail-hand">
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3a2a24" />
          <stop offset="1" stopColor="#2a1d19" />
        </linearGradient>
        <linearGradient id="polishGloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="0.35" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="1" stopColor="rgba(0,0,0,0.25)" />
        </linearGradient>
        <linearGradient id="polishChrome" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.5" stopColor="#9ea3ab" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      <path
        d="M60 480 C40 420 30 360 40 300 C46 230 60 180 80 130 C88 108 108 100 116 120
           C122 138 118 165 122 190 L130 190 C126 150 128 90 138 60 C144 40 168 38 174 60
           C180 88 178 150 182 190 L190 190 C190 140 196 70 206 45 C212 26 236 26 240 48
           C246 78 240 150 244 190 L252 190 C256 150 264 90 274 68 C280 50 302 52 304 74
           C308 108 296 170 296 220 C310 230 330 250 336 280 C344 320 336 400 300 460
           C270 505 200 512 150 500 C110 492 78 500 60 480 Z"
        fill="url(#skin)"
      />

      {/* nails: pinky, ring, middle, index, thumb */}
      {[
        { id: 'pinky', d: 'M110 118 C106 100 118 92 124 108 C128 122 126 142 122 150 C112 150 108 132 110 118 Z' },
        { id: 'ring', d: 'M168 44 C164 24 182 18 188 40 C192 60 190 92 186 106 C174 106 168 66 168 44 Z' },
        { id: 'middle', d: 'M232 28 C230 8 250 4 254 26 C258 50 254 86 250 100 C238 100 232 52 232 28 Z' },
        { id: 'index', d: 'M296 50 C296 30 316 28 318 50 C320 74 314 104 308 116 C298 114 294 74 296 50 Z' },
        { id: 'thumb', d: 'M300 152 C312 138 332 146 328 166 C324 184 306 200 292 202 C286 188 292 164 300 152 Z' },
      ].map((n) => (
        <g key={n.id}>
          <path d={n.d} fill={isChrome ? 'url(#polishChrome)' : nailFill} />
          {!isMatte && <path d={n.d} fill="url(#polishGloss)" />}
          <path d={n.d} fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
        </g>
      ))}
    </svg>
  )
}

export default function NailStudio({ active }) {
  const [color, setColor] = useState(COLORS[0])

  return (
    <div className={`nail-stage ${active ? 'is-active' : ''}`}>
      <div className="nail-visual">
        <Hand color={color} />
      </div>
      <div className="nail-panel">
        <p className="eyebrow">Ногтевой сервис</p>
        <h2>Примерьте цвет перед визитом</h2>
        <p className="nail-copy">
          Выберите оттенок — покрытие накладывается поверх фото в реальном
          времени, как готовый маникюр.
        </p>
        <div className="swatches">
          {COLORS.map((c) => (
            <button
              key={c.id}
              className={`swatch ${c.id === color.id ? 'is-active' : ''}`}
              style={{ background: c.hex }}
              onClick={() => setColor(c)}
              aria-label={c.name}
              type="button"
            />
          ))}
        </div>
        <div className="nail-current">
          <span className="nail-current-dot" style={{ background: color.hex }} />
          {color.name}
        </div>
        <button className="cta" type="button">Записаться на маникюр</button>
      </div>
    </div>
  )
}
