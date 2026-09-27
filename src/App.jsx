import { useState } from 'react'
import HairCanvas from './hair/HairCanvas'
import NailStudio from './nails/NailStudio'
import './App.css'

const SERVICES = [
  { id: 'hair', label: 'Стрижки и укладка', ready: true },
  { id: 'nails', label: 'Ногти', ready: true },
  { id: 'makeup', label: 'Макияж', ready: false },
  { id: 'hairstyle', label: 'Причёски', ready: false },
  { id: 'pedicure', label: 'Педикюр', ready: false },
]

function App() {
  const [tab, setTab] = useState('hair')

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">LUMI&nbsp;STUDIO</div>
        <nav className="services-nav">
          {SERVICES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`nav-item ${tab === s.id ? 'is-active' : ''} ${!s.ready ? 'is-soon' : ''}`}
              onClick={() => s.ready && setTab(s.id)}
            >
              {s.label}
              {!s.ready && <span className="soon-tag">скоро</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="stage">
        <HairCanvas active={tab === 'hair'} />
        <NailStudio active={tab === 'nails'} />

        {(tab === 'makeup' || tab === 'hairstyle' || tab === 'pedicure') && (
          <div className="soon-stage">
            <p className="eyebrow">Совсем скоро</p>
            <h2>Этот раздел в разработке</h2>
          </div>
        )}

        {tab === 'hair' && (
          <div className="hero-copy">
            <p className="eyebrow">Парикмахерские услуги</p>
            <h1>Наведите фен —<br />уложите волосы</h1>
            <p className="hero-sub">Двигайте курсор по экрану: воздушный поток фена подхватывает пряди в реальном времени.</p>
            <button className="cta" type="button">Записаться на укладку</button>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
