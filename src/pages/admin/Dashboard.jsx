import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import Sidebar from '../../components/Sidebar'
import { API, useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()

  // Specialists have no dashboard — send them to their history page
  if (user?.rol === 'Especialista') {
    return <Navigate to="/admin/history" replace />
  }

  const [stats, setStats] = useState({})
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API}/estadisticas/`),
      axios.get(`${API}/citas/`),
    ]).then(([sRes, cRes]) => {
      setStats(sRes.data)
      setCitas(cRes.data.slice(0, 10))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const ESTADO_BADGE = {
    Pendiente: 'badge-yellow', Confirmada: 'badge-pink',
    Realizada: 'badge-green', Cancelada: 'badge-red', Reprogramada: 'badge-gray',
  }

  const statCards = [
    { label: 'Total de citas', val: stats.total || 0, icon: '📊', color: '#e0f2fe', text: '#0369a1' },
    { label: 'Realizadas', val: stats.Realizada || 0, icon: '✅', color: '#dcfce7', text: '#16a34a' },
    { label: 'Pendientes', val: stats.Pendiente || 0, icon: '⏳', color: '#fef9c3', text: '#854d0e' },
    { label: 'Canceladas', val: stats.Cancelada || 0, icon: '❌', color: '#fee2e2', text: '#dc2626' },
  ]

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-header animate-fade-in-down">
          <h1 className="page-title">Panel de Administración</h1>
          <p className="page-subtitle">Resumen general de citas y actividad de la clínica.</p>
        </div>

        {/* Stat cards with staggered animation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
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

        {/* Recent appointments */}
        <div className="card animate-fade-in-up delay-500">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Citas recientes</h2>
          {loading ? (
            <p className="text-gray-400 text-center py-6">Cargando...</p>
          ) : citas.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No hay citas registradas.</p>
          ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Paciente</th>
                  <th>Especialista</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {citas.map((c, i) => (
                  <tr key={c.id} className={`animate-fade-in delay-${Math.min(i * 50, 500)}`}
                    style={{ animationDelay: `${0.55 + i * 0.04}s` }}>
                    <td className="text-gray-400 text-xs">#{c.id}</td>
                    <td className="font-medium">{c.paciente_nombre || '—'}</td>
                    <td>{c.especialista_nombre || '—'}</td>
                    <td>{c.fecha_cita}</td>
                    <td className="text-xs">{c.hora_inicio}–{c.hora_fin}</td>
                    <td>
                      <span className={`badge ${ESTADO_BADGE[c.estado] || 'badge-gray'}`}>
                        {c.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </main>
    </div>
  )
}
