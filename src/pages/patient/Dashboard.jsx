import { useState, useEffect } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import { useAuth } from '../../context/AuthContext'
import { API } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const ESTADO_BADGE = {
  Pendiente: 'badge-yellow',
  Confirmada: 'badge-pink',
  Realizada: 'badge-green',
  Cancelada: 'badge-red',
  Reprogramada: 'badge-gray',
}

// WhatsApp floating button
function WAButton({ phone }) {
  if (!phone) return null
  return (
    <a
      href={`https://wa.me/${phone.replace(/\D/g, '')}`}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
      style={{ background: '#25D366' }}
    >
      <span className="text-lg">💬</span>
      WhatsApp
    </a>
  )
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [paciente, setPaciente] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [citasRes, perfilRes] = await Promise.all([
          axios.get(`${API}/citas/?paciente_id=${user?.id}`),
          axios.get(`${API}/perfil-paciente/${user?.id}/`),
        ])
        setCitas(citasRes.data)
        setPaciente(perfilRes.data)
      } catch {
        // ignore errors silently
      } finally {
        setLoading(false)
      }
    }
    if (user?.id) fetchData()
  }, [user])

  const cancelar = async (id) => {
    try {
      await axios.patch(`${API}/citas/${id}/`, { estado: 'Cancelada' })
      setCitas(prev => prev.map(c => c.id === id ? { ...c, estado: 'Cancelada' } : c))
      toast.success('Cita cancelada.')
    } catch {
      toast.error('Error al cancelar la cita.')
    }
  }

  const upcoming = citas.filter(c => ['Pendiente', 'Confirmada'].includes(c.estado))
  const past = citas.filter(c => ['Realizada', 'Cancelada'].includes(c.estado))

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        {/* Header */}
        <div className="page-header animate-fade-in-down">
          <h1 className="page-title">¡Hola, {user?.nombre?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">Aquí puedes gestionar tus citas y perfil dental.</p>
        </div>

        {/* Quick stats with staggered animation */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Citas pendientes', val: upcoming.length, icon: '📅', color: '#FCE4F3', text: 'var(--pink)' },
            { label: 'Citas realizadas', val: past.filter(c => c.estado === 'Realizada').length, icon: '✅', color: '#dcfce7', text: '#16a34a' },
            { label: 'Citas canceladas', val: past.filter(c => c.estado === 'Cancelada').length, icon: '❌', color: '#fee2e2', text: '#dc2626' },
          ].map((s, i) => (
            <div key={s.label} className={`stat-card animate-fade-in-up delay-${(i + 1) * 100}`}>
              <div className="stat-icon transition-transform duration-200 hover:scale-110" style={{ background: s.color }}>
                <span>{s.icon}</span>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: s.text }}>{s.val}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming appointments */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Próximas citas</h2>
            <Link to="/book" className="btn-primary text-sm px-4 py-2">+ Agendar</Link>
          </div>
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-6">Cargando...</p>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-gray-500 mb-4">No tienes citas próximas.</p>
              <Link to="/book" className="btn-primary text-sm px-5 py-2.5">Agendar mi primera cita</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(c => (
                <div key={c.id} className="flex items-center gap-4 p-4 rounded-xl border border-pink-50 hover:border-pink-200 transition-all">
                  <div className="text-3xl">🦷</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{c.servicio_realizado || 'Consulta General'}</p>
                    <p className="text-sm text-gray-500">
                      {c.especialista_nombre} • {c.fecha_cita} • {c.hora_inicio}–{c.hora_fin}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${ESTADO_BADGE[c.estado] || 'badge-gray'}`}>{c.estado}</span>
                    {c.estado === 'Pendiente' && (
                      <button onClick={() => cancelar(c.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Patient profile summary */}
        {paciente && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Mi información médica</h2>
              <Link to="/profile" className="btn-outline text-sm px-4 py-2">Editar</Link>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: 'Edad', val: paciente.edad ? `${paciente.edad} años` : '—' },
                { label: 'Fecha de nacimiento', val: paciente.fecha_nacimiento || '—' },
                { label: 'Enfermedades', val: paciente.enfermedad_importante || 'Ninguna' },
                { label: 'Alergias', val: paciente.alergias || 'Ninguna' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{f.label}</p>
                  <p className="font-medium text-gray-800">{f.val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <WAButton phone={user?.telefono} />
    </div>
  )
}
