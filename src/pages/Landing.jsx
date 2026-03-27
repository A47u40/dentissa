import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import Header from '../components/Header'
import { API } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'
import AuthModal from '../components/AuthModal'

/* ── Whatsapp number ─── change to real number */
const WA_NUMBER = '5615406871'
const WA_LINK = `https://wa.me/${WA_NUMBER}?text=Hola%2C%20me%20gustar%C3%ADa%20obtener%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20servicios.`

const SERVICIOS = [
  { icon: '🦷', nombre: 'Odontología General', desc: 'Atención dental integral para toda la familia' },
  { icon: '✨', nombre: 'Limpiezas', desc: 'Profilaxis y blanqueamiento dental profesional' },
  { icon: '🔧', nombre: 'Extracciones', desc: 'Procedimientos seguros con mínimo malestar' },
  { icon: '🛡️', nombre: 'Caries', desc: 'Diagnóstico y tratamiento temprano de caries' },
  { icon: '💎', nombre: 'Resina', desc: 'Restauraciones estéticas de alta calidad' },
  { icon: '📐', nombre: 'Ortodoncia', desc: 'Alineación dental con técnicas modernas' },
  { icon: '🔩', nombre: 'Brackets', desc: 'Corrección de mordida con brackets metálicos o estéticos' },
  { icon: '🧬', nombre: 'Ortopedia Maxilar', desc: 'Tratamiento del desarrollo óseo facial' },
]

/* Especialistas se carga del API */

/* ── Intersection Observer hook ─── */
function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

/* ── Before/After Carousel ─── */
function BeforeAfterCarousel({ casos }) {
  const [idx, setIdx] = useState(0)
  const total = casos.length
  const prev = () => setIdx(i => (i - 1 + total) % total)
  const next = () => setIdx(i => (i + 1) % total)

  // auto-play
  useEffect(() => {
    if (total < 2) return
    const t = setInterval(next, 4500)
    return () => clearInterval(t)
  }, [total])

  if (total === 0) return null
  const c = casos[idx]

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl border border-pink-100 max-w-2xl mx-auto">
      <div className="grid grid-cols-2">
        {c.imagen_antes ? (
          <div className="relative">
            <img src={c.imagen_antes} alt="Antes" className="w-full h-64 object-cover"
              onError={(e) => e.target.style.display = 'none'} />
            <div className="absolute top-3 left-3 bg-gray-900/70 text-white text-xs font-bold px-3 py-1 rounded-full">
              ANTES
            </div>
          </div>
        ) : (
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center text-4xl">🦷</div>
        )}
        {c.imagen_despues ? (
          <div className="relative">
            <img src={c.imagen_despues} alt="Después" className="w-full h-64 object-cover"
              onError={(e) => e.target.style.display = 'none'} />
            <div className="absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'var(--pink)' }}>
              DESPUÉS
            </div>
          </div>
        ) : (
          <div className="w-full h-64 flex items-center justify-center text-4xl"
            style={{ background: 'var(--pink-light)' }}>✨</div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 mb-1">{c.titulo}</h3>
        <p className="text-sm text-gray-500">{c.descripcion}</p>
      </div>
      {total > 1 && (
        <>
          <button onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors text-gray-700">
            ‹
          </button>
          <button onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 rounded-full shadow flex items-center justify-center hover:bg-white transition-colors text-gray-700">
            ›
          </button>
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5">
            {casos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ background: i === idx ? 'var(--pink)' : '#d1d5db' }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ── Promo Modal ─── */
function PromoModal({ promo, onClose, user, onLoginRequired }) {
  const waMsg = encodeURIComponent(`Hola, me interesa la promoción: ${promo.titulo}`)
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waMsg}`

  const getDashLink = () => {
    if (user?.rol === 'Admin' || user?.rol === 'Especialista') return '/admin'
    if (user?.rol === 'Asistente') return '/assistant'
    return '/dashboard'
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-lg animate-scale-in">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {promo.imagen_url && (
          <img src={promo.imagen_url} alt={promo.titulo}
            className="w-full h-52 object-cover rounded-2xl mb-5"
            onError={(e) => e.target.style.display = 'none'} />
        )}

        <div className="mb-2">
          <span className="badge badge-pink text-xs mb-3">🎉 Promoción activa</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">{promo.titulo}</h2>
        <p className="text-gray-600 mb-4 leading-relaxed">{promo.descripcion}</p>

        {promo.fecha_fin && (
          <div className="bg-pink-50 border border-pink-100 rounded-xl px-4 py-3 mb-5">
            <p className="text-sm font-medium" style={{ color: 'var(--pink)' }}>
              ⏰ Válido hasta: {new Date(promo.fecha_fin).toLocaleDateString('es-MX', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {user ? (
            <a href={getDashLink()} className="btn-primary flex-1 justify-center text-center">
              📅 Agendar cita
            </a>
          ) : (
            <button onClick={onLoginRequired} className="btn-primary flex-1 justify-center">
              📅 Agendar cita
            </button>
          )}
          <a href={waLink} target="_blank" rel="noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200"
            style={{ background: '#25D366' }}>
            💬 WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

/* ── Especialista Modal ─── */
function EspecialistaModal({ esp, onClose }) {
  const perfil = esp.perfil_especialista || {}
  const initials = esp.nombre_completo
    ? esp.nombre_completo.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '👨‍⚕️'
  const waMsg = encodeURIComponent(`Hola, me gustaría agendar una cita con ${esp.nombre_completo}.`)
  const waLink = `https://wa.me/${WA_NUMBER}?text=${waMsg}`

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-md animate-scale-in">
        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header con avatar */}
        <div className="flex flex-col items-center text-center mb-6 pt-2">
          {perfil.foto_url ? (
            <img
              src={perfil.foto_url}
              alt={esp.nombre_completo}
              className="w-24 h-24 rounded-full object-cover border-4 mb-4"
              style={{ borderColor: 'var(--pink-light)' }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4"
              style={{ background: 'linear-gradient(135deg, var(--pink) 0%, #a855f7 100%)' }}>
              {initials}
            </div>
          )}
          <h2 className="text-xl font-bold text-gray-900">{esp.nombre_completo}</h2>
          {perfil.especialidad && (
            <span className="badge badge-pink text-xs mt-2">{perfil.especialidad}</span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-3 mb-6">
          {perfil.anos_experiencia && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--pink-light)' }}>
              <span className="text-xl">🏆</span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Experiencia</p>
                <p className="text-sm font-medium text-gray-800">{perfil.anos_experiencia} años</p>
              </div>
            </div>
          )}
          {perfil.bio && (
            <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: '#f8f9fa' }}>
              <span className="text-xl mt-0.5">📋</span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Acerca del especialista</p>
                <p className="text-sm text-gray-700 leading-relaxed">{perfil.bio}</p>
              </div>
            </div>
          )}
          {esp.email && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#f8f9fa' }}>
              <span className="text-xl">✉️</span>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Correo</p>
                <p className="text-sm text-gray-700">{esp.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Botón WhatsApp */}
        <a href={waLink} target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
          style={{ background: '#25D366' }}>
          💬 Contactar por WhatsApp
        </a>
      </div>
    </div>
  )
}

/* ── Section wrapper with reveal ─── */
function Section({ id, className, children, style }) {
  const ref = useReveal()
  return (
    <section id={id} ref={ref} className={`reveal ${className || ''}`} style={style}>
      {children}
    </section>
  )
}

/* ═══════════════════════════════════════════════════════ */
export default function Landing() {
  const { user } = useAuth()
  const [promociones, setPromociones] = useState([])
  const [faqs, setFaqs] = useState([])
  const [casos, setCasos] = useState([])
  const [especialistas, setEspecialistas] = useState([])
  const [openFaq, setOpenFaq] = useState(null)
  const [selectedPromo, setSelectedPromo] = useState(null)
  const [selectedEsp, setSelectedEsp] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    axios.get(`${API}/promociones/`).then(r => setPromociones(r.data)).catch(() => { })
    axios.get(`${API}/faqs/`).then(r => setFaqs(r.data)).catch(() => { })
    axios.get(`${API}/casos-exito/`).then(r => setCasos(r.data)).catch(() => { })
    axios.get(`${API}/especialistas/`).then(r => setEspecialistas(r.data)).catch(() => { })
  }, [])

  const promosActivas = promociones.filter(p => p.activo)

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Header />

      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative overflow-hidden pt-20 pb-28 px-6">
        <div className="absolute inset-0 -z-10" style={{
          background: 'linear-gradient(135deg, #fdf2f8 0%, #fce4f3 50%, #f0f9ff 100%)'
        }} />
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 -z-10 animate-float"
          style={{ background: 'var(--pink)' }} />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full opacity-10 -z-10 animate-float"
          style={{ background: '#a855f7', animationDelay: '1.5s' }} />

        <div className="max-w-6xl mx-auto text-center">
          <span className="badge badge-pink text-xs mb-6 inline-block animate-fade-in-down">
            🦷 Clínica Dental de Confianza
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight animate-fade-in-up delay-100">
            Tu sonrisa es nuestra<br />
            <span className="text-gradient">mayor prioridad</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200">
            En Dentiss ofrecemos atención dental especializada con tecnología de vanguardia.
            Agenda tu cita hoy y descubre la diferencia.
          </p>
          <div className="flex flex-wrap gap-4 justify-center animate-fade-in-up delay-300">
            <a href="#servicios" className="btn-primary text-base px-8 py-4">
              Ver servicios →
            </a>
            <a
              href={WA_LINK}
              target="_blank"
              rel="noreferrer"
              className="btn-outline text-base px-8 py-4 flex items-center gap-2"
            >
              💬 Contáctanos
            </a>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto mt-16 animate-fade-in-up delay-400">
            {[
              { num: '5,000+', label: 'Pacientes felices' },
              { num: '15+', label: 'Años de experiencia' },
              { num: '8', label: 'Especialidades' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-extrabold" style={{ color: 'var(--pink)' }}>{s.num}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICIOS ────────────────────────────── */}
      <Section id="servicios" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-pink text-xs mb-3">Nuestros servicios</span>
            <h2 className="text-4xl font-bold text-gray-900">¿Qué hacemos en Dentiss?</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Atención integral para toda la familia con los más altos estándares de calidad.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SERVICIOS.map((s, i) => (
              <div key={s.nombre} className={`card-hover p-5 text-center group reveal delay-${Math.min(i * 100, 500)}`}
                ref={(el) => {
                  if (!el) return
                  const obs = new IntersectionObserver(([e]) => {
                    if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect() }
                  }, { threshold: 0.1 })
                  obs.observe(el)
                }}>
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{s.icon}</div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{s.nombre}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── MISIÓN Y VISIÓN ───────────────────────── */}
      <Section id="mision" className="py-20 px-6" style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f0f9ff 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge badge-pink text-xs mb-3">Quiénes somos</span>
            <h2 className="text-4xl font-bold text-gray-900">Misión y Visión</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Misión */}
            <div className="card p-8 border-l-4 reveal-left" ref={(el) => {
              if (!el) return
              const obs = new IntersectionObserver(([e]) => {
                if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect() }
              }, { threshold: 0.1 })
              obs.observe(el)
            }} style={{ borderLeftColor: 'var(--pink)' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5 animate-pulse-pink"
                style={{ background: 'var(--pink-light)' }}>
                🎯
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nuestra Misión</h3>
              <p className="text-gray-600 leading-relaxed">
                Brindar atención odontológica de excelencia con un enfoque humano, ético y profesional.
                Nos dedicamos a transformar la experiencia dental de cada paciente, ofreciendo tratamientos
                personalizados que combinan tecnología de vanguardia con el más cálido trato humano.
                En Dentissa, cada sonrisa importa.
              </p>
            </div>
            {/* Visión */}
            <div className="card p-8 border-l-4 reveal-right" ref={(el) => {
              if (!el) return
              const obs = new IntersectionObserver(([e]) => {
                if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect() }
              }, { threshold: 0.1 })
              obs.observe(el)
            }} style={{ borderLeftColor: '#a855f7' }}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-5"
                style={{ background: '#f3e8ff' }}>
                🌟
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Nuestra Visión</h3>
              <p className="text-gray-600 leading-relaxed">
                Ser la clínica dental líder de referencia en la región, reconocida por la calidad de nuestros
                tratamientos, la calidez de nuestra atención y el impacto positivo en la salud bucal de
                nuestra comunidad. Aspiramos a que cada paciente que nos visita se convierta en un
                embajador de la salud dental y del poder de una sonrisa plena.
              </p>
            </div>
          </div>

          {/* Valores */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { icon: '💖', val: 'Calidez', txt: 'Trato humano y cercano' },
              { icon: '🔬', val: 'Innovación', txt: 'Tecnología de vanguardia' },
              { icon: '🏆', val: 'Excelencia', txt: 'Estándares de calidad máximos' },
              { icon: '🤝', val: 'Confianza', txt: 'Transparencia en cada paso' },
            ].map((v, i) => (
              <div key={v.val} className={`text-center p-5 bg-white rounded-2xl shadow-sm reveal delay-${i * 100 + 100}`}
                ref={(el) => {
                  if (!el) return
                  const obs = new IntersectionObserver(([e]) => {
                    if (e.isIntersecting) { el.classList.add('visible'); obs.disconnect() }
                  }, { threshold: 0.1 })
                  obs.observe(el)
                }}>
                <div className="text-3xl mb-2">{v.icon}</div>
                <p className="font-bold text-gray-900 text-sm">{v.val}</p>
                <p className="text-xs text-gray-500 mt-1">{v.txt}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── ESPECIALISTAS ─────────────────────────── */}
      <Section id="especialistas" className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge badge-pink text-xs mb-3">Nuestro equipo</span>
            <h2 className="text-4xl font-bold text-gray-900">Nuestros Especialistas</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto">
              Contamos con un equipo de profesionales altamente capacitados y comprometidos con tu bienestar dental.
            </p>
          </div>
          {especialistas.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-3">👩‍⚕️</p>
              <p>Próximamente presentaremos a nuestro equipo de especialistas.</p>
            </div>
          ) : (
            <div className={`grid gap-6 ${
              especialistas.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' :
              especialistas.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-lg mx-auto' :
              especialistas.length === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-3xl mx-auto' :
              'grid-cols-2 md:grid-cols-4'
            }`}>
              {especialistas.map((esp, i) => {
                const perfil = esp.perfil_especialista || {}
                const initials = esp.nombre_completo
                  ? esp.nombre_completo.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                  : '👨‍⚕️'
                return (
                  <div key={esp.id}
                    className={`card text-center p-6 group hover:border-pink-200 transition-all duration-300 reveal delay-${Math.min(i * 100 + 100, 500)} cursor-pointer`}
                    onClick={() => setSelectedEsp(esp)}
                    ref={(el) => {
                      if (!el) return
                      const obs = new IntersectionObserver(([entry]) => {
                        if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() }
                      }, { threshold: 0.1 })
                      obs.observe(el)
                    }}
                    style={{ border: '2px solid transparent' }}>
                    {/* Avatar: foto si existe, si no iniciales */}
                    {perfil.foto_url ? (
                      <img
                        src={perfil.foto_url}
                        alt={esp.nombre_completo}
                        className="w-20 h-20 mx-auto mb-4 rounded-full object-cover group-hover:scale-110 transition-transform duration-300 border-2"
                        style={{ borderColor: 'var(--pink-light)' }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center text-2xl font-bold text-white
                        group-hover:scale-110 transition-transform duration-300"
                        style={{ background: 'linear-gradient(135deg, var(--pink) 0%, #a855f7 100%)' }}>
                        {initials}
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-sm mb-2">{esp.nombre_completo}</h3>
                    {perfil.especialidad && (
                      <span className="badge badge-pink text-xs mb-2">{perfil.especialidad}</span>
                    )}
                    {perfil.bio && (
                      <p className="text-xs text-gray-400 mt-2 line-clamp-2">{perfil.bio}</p>
                    )}
                    {perfil.anos_experiencia && (
                      <p className="text-xs text-gray-400 mt-1">{perfil.anos_experiencia} años de experiencia</p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Section>

      {/* ── PROMOCIONES ──────────────────────────── */}
      {promosActivas.length > 0 && (
        <Section id="promociones" className="py-20 px-6" style={{ background: 'var(--pink-light)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="badge badge-pink text-xs mb-3">🎉 Ofertas especiales</span>
              <h2 className="text-4xl font-bold text-gray-900">Promociones activas</h2>
              <p className="text-gray-500 mt-3">Haz clic en una promoción para ver más detalles y agendar tu cita.</p>
            </div>
            <div className={`grid gap-6 justify-items-center ${promosActivas.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' :
                promosActivas.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' :
                  'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              }`}>
              {promosActivas.map((p, i) => (
                <div
                  key={p.id}
                  className={`promo-card w-full reveal delay-${Math.min(i * 100 + 100, 500)}`}
                  ref={(el) => {
                    if (!el) return
                    const obs = new IntersectionObserver(([entry]) => {
                      if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() }
                    }, { threshold: 0.1 })
                    obs.observe(el)
                  }}
                  onClick={() => setSelectedPromo(p)}
                >
                  {p.imagen_url && (
                    <img src={p.imagen_url} alt={p.titulo}
                      className="w-full h-48 object-cover rounded-xl mb-4"
                      onError={(e) => e.target.style.display = 'none'} />
                  )}
                  {!p.imagen_url && (
                    <div className="w-full h-32 rounded-xl mb-4 flex items-center justify-center text-4xl"
                      style={{ background: 'linear-gradient(135deg, var(--pink-light), #f0f9ff)' }}>
                      🎁
                    </div>
                  )}
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{p.titulo}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{p.descripcion}</p>
                  {p.fecha_fin && (
                    <p className="text-xs mt-3 font-medium" style={{ color: 'var(--pink)' }}>
                      ⏰ Válido hasta: {new Date(p.fecha_fin).toLocaleDateString('es-MX')}
                    </p>
                  )}
                  <div className="mt-4 flex items-center gap-1 text-xs font-semibold" style={{ color: 'var(--pink)' }}>
                    <span>Ver detalles</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* ── ANTES Y DESPUÉS ───────────────────────── */}
      {casos.length > 0 && (
        <Section className="py-20 px-6 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <span className="badge badge-pink text-xs mb-3">Resultados reales</span>
              <h2 className="text-4xl font-bold text-gray-900">Antes y Después</h2>
              <p className="text-gray-500 mt-3 max-w-xl mx-auto">
                Transforma tu sonrisa como nuestros pacientes. Resultados reales, cambios reales.
              </p>
            </div>
            <BeforeAfterCarousel casos={casos} />
          </div>
        </Section>
      )}

      {/* ── PREGUNTAS FRECUENTES ─────────────────── */}
      <Section id="faqs" className="py-20 px-6" style={{ background: '#fdf6fb' }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="badge badge-pink text-xs mb-3">Resolvemos tus dudas</span>
            <h2 className="text-4xl font-bold text-gray-900">Preguntas frecuentes</h2>
          </div>
          {faqs.length === 0 ? (
            <div className="card text-center py-10 text-gray-400">
              <p>Sin preguntas frecuentes por el momento.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faqs.map(faq => (
                <div key={faq.id} className="card overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between text-left py-1 font-semibold text-gray-900"
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                  >
                    <span>{faq.pregunta}</span>
                    <span className="text-xl ml-4" style={{ color: 'var(--pink)' }}>
                      {openFaq === faq.id ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === faq.id && (
                    <p className="text-gray-600 text-sm mt-3 pt-3 border-t border-gray-100 animate-fade-in">
                      {faq.respuesta}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer id="contacto" className="py-12 px-6" style={{ background: 'var(--gray-900)', color: 'white' }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/imagenes/logo.png" alt="Dentiss" className="h-10 object-contain"
              onError={(e) => e.target.style.display = 'none'} />
            <div>
              <p className="font-bold text-white">Dentissa</p>
              <p className="text-xs text-gray-400">Clínica Dental</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">© {new Date().getFullYear()} Dentissa. Todos los derechos reservados.</p>
          </div>
          <div className="flex gap-4">
            <a href={WA_LINK} className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{ background: '#25D366' }} target="_blank" rel="noreferrer">
              <span className="text-white text-lg">💬</span>
            </a>
          </div>
        </div>
      </footer>

      {/* ── PROMO MODAL ── */}
      {selectedPromo && (
        <PromoModal
          promo={selectedPromo}
          user={user}
          onClose={() => setSelectedPromo(null)}
          onLoginRequired={() => { setSelectedPromo(null); setShowAuthModal(true) }}
        />
      )}

      {/* ── ESPECIALISTA MODAL ── */}
      {selectedEsp && (
        <EspecialistaModal
          esp={selectedEsp}
          onClose={() => setSelectedEsp(null)}
        />
      )}

      {/* ── AUTH MODAL (from promo) ── */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
