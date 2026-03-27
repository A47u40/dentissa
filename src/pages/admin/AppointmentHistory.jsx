import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Sidebar from '../../components/Sidebar'
import { API, useAuth } from '../../context/AuthContext'

const ESTADO_BADGE = {
  Pendiente: 'badge-yellow',
  Confirmada: 'badge-pink',
  Realizada: 'badge-green',
  Cancelada: 'badge-red',
  Reprogramada: 'badge-gray',
}

const ESTADOS = ['', 'Pendiente', 'Confirmada', 'Realizada', 'Cancelada', 'Reprogramada']

export default function AdminAppointmentHistory() {
  const { user } = useAuth()
  const esEspecialista = user?.rol === 'Especialista'

  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [especialistas, setEspecialistas] = useState([])

  // Filters
  const [filtroEspecialista, setFiltroEspecialista] = useState('')
  const [filtroPaciente, setFiltroPaciente] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')

  useEffect(() => {
    if (!esEspecialista) {
      axios.get(`${API}/especialistas/`).then(r => setEspecialistas(r.data)).catch(() => {})
    }
  }, [esEspecialista])

  const fetchCitas = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()

    // Specialists can only see their own appointments
    if (esEspecialista) {
      params.set('especialista_id', user.id)
    } else if (filtroEspecialista) {
      params.set('especialista_id', filtroEspecialista)
    }

    if (filtroEstado) params.set('estado', filtroEstado)

    axios.get(`${API}/citas/?${params.toString()}`)
      .then(r => {
        let data = r.data

        // Client-side filters (backend doesn't support all)
        if (filtroPaciente) {
          const q = filtroPaciente.toLowerCase()
          data = data.filter(c => c.paciente_nombre?.toLowerCase().includes(q))
        }
        if (filtroFechaDesde) {
          data = data.filter(c => c.fecha_cita >= filtroFechaDesde)
        }
        if (filtroFechaHasta) {
          data = data.filter(c => c.fecha_cita <= filtroFechaHasta)
        }

        // Sort newest first
        data.sort((a, b) => {
          const d = b.fecha_cita.localeCompare(a.fecha_cita)
          return d !== 0 ? d : b.hora_inicio.localeCompare(a.hora_inicio)
        })

        setCitas(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [esEspecialista, user, filtroEspecialista, filtroEstado, filtroPaciente, filtroFechaDesde, filtroFechaHasta])

  useEffect(() => { fetchCitas() }, [fetchCitas])

  const clearFilters = () => {
    setFiltroEspecialista('')
    setFiltroPaciente('')
    setFiltroEstado('')
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
  }

  const hasFilters = filtroEspecialista || filtroPaciente || filtroEstado || filtroFechaDesde || filtroFechaHasta

  // Stats summary
  const stats = ESTADOS.slice(1).reduce((acc, e) => {
    acc[e] = citas.filter(c => c.estado === e).length
    return acc
  }, {})

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        {/* Header */}
        <div className="page-header flex items-start justify-between animate-fade-in-down">
          <div>
            <h1 className="page-title">Historial de citas</h1>
            <p className="page-subtitle">
              {esEspecialista
                ? 'Todas las citas que has atendido.'
                : 'Historial completo de todas las citas de la clínica.'}
            </p>
          </div>
          <button onClick={fetchCitas} className="btn-outline text-sm px-4 py-2">
            🔄 Actualizar
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 animate-fade-in-up">
          {[
            { label: 'Total', value: citas.length, color: 'var(--pink)', bg: 'var(--pink-light)' },
            { label: 'Pendientes', value: stats.Pendiente, color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Confirmadas', value: stats.Confirmada, color: '#E91E8C', bg: '#fdf2f8' },
            { label: 'Realizadas', value: stats.Realizada, color: '#22c55e', bg: '#f0fdf4' },
            { label: 'Canceladas', value: stats.Cancelada, color: '#ef4444', bg: '#fef2f2' },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className="card text-center py-3 px-2" style={{ background: bg }}>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card mb-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">🔍 Filtros</p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ✕ Limpiar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Only admin can filter by specialist */}
            {!esEspecialista && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Especialista</label>
                <select className="input-field" value={filtroEspecialista} onChange={e => setFiltroEspecialista(e.target.value)}>
                  <option value="">Todos</option>
                  {especialistas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre_completo}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Paciente</label>
              <input type="text" placeholder="Buscar por nombre..." className="input-field"
                value={filtroPaciente} onChange={e => setFiltroPaciente(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Estado</label>
              <select className="input-field" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                {ESTADOS.map(e => <option key={e} value={e}>{e || 'Todos'}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Desde</label>
              <input type="date" className="input-field" value={filtroFechaDesde}
                onChange={e => setFiltroFechaDesde(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Hasta</label>
              <input type="date" className="input-field" value={filtroFechaHasta}
                onChange={e => setFiltroFechaHasta(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="card p-0 overflow-hidden animate-fade-in-up">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">⏳</p>
              <p>Cargando historial...</p>
            </div>
          ) : citas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500">No se encontraron citas con los filtros aplicados.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="btn-outline mt-4 text-sm px-4 py-2">
                  Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Paciente</th>
                    {!esEspecialista && <th>Especialista</th>}
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {citas.map(c => (
                    <tr key={c.id}>
                      <td className="font-medium whitespace-nowrap">
                        {new Date(c.fecha_cita + 'T12:00').toLocaleDateString('es-MX', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </td>
                      <td className="whitespace-nowrap text-gray-500">
                        {c.hora_inicio?.slice(0, 5)} – {c.hora_fin?.slice(0, 5)}
                      </td>
                      <td className="font-medium">{c.paciente_nombre || '—'}</td>
                      {!esEspecialista && (
                        <td className="text-gray-600">{c.especialista_nombre || '—'}</td>
                      )}
                      <td className="text-gray-600">{c.servicio_realizado || 'General'}</td>
                      <td>
                        <span className={`badge ${ESTADO_BADGE[c.estado] || 'badge-gray'}`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="max-w-[200px]">
                        {c.comentario_especialista ? (
                          <span className="text-xs text-gray-500 line-clamp-2" title={c.comentario_especialista}>
                            {c.comentario_especialista}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300 italic">Sin nota</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {!loading && citas.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {citas.length} cita{citas.length !== 1 ? 's' : ''} encontrada{citas.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
