import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API } from '../../context/AuthContext'

const ESTADO_BADGE = {
  Pendiente: 'badge-yellow', Confirmada: 'badge-pink',
  Realizada: 'badge-green', Cancelada: 'badge-red', Reprogramada: 'badge-gray',
}

export default function AssistantDashboard() {
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const fetchCitas = () => {
    setLoading(true)
    const params = filter !== 'all' ? `?estado=${filter}` : ''
    axios.get(`${API}/citas/${params}`)
      .then(r => setCitas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchCitas() }, [filter])

  const cambiarEstado = async (id, estado) => {
    try {
      await axios.patch(`${API}/citas/${id}/`, { estado })
      toast.success(`Cita marcada como ${estado}.`)
      fetchCitas()
    } catch { toast.error('Error al actualizar.') }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-header">
          <h1 className="page-title">Panel de Asistente</h1>
          <p className="page-subtitle">Gestión diaria de citas y pacientes.</p>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[['all', 'Todas'], ['Pendiente', 'Pendientes'], ['Confirmada', 'Confirmadas'], ['Realizada', 'Realizadas']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${filter === val ? 'text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:border-pink-300'}`}
              style={filter === val ? { background: 'var(--pink)' } : {}}>
              {label}
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? (
            <p className="text-center py-8 text-gray-400">Cargando...</p>
          ) : citas.length === 0 ? (
            <p className="text-center py-8 text-gray-400">Sin citas para este filtro.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Especialista</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {citas.map(c => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.paciente_nombre || '—'}</td>
                      <td>{c.especialista_nombre || '—'}</td>
                      <td>{c.fecha_cita}</td>
                      <td className="text-xs">{c.hora_inicio}–{c.hora_fin}</td>
                      <td className="text-xs">{c.servicio_realizado || 'General'}</td>
                      <td><span className={`badge ${ESTADO_BADGE[c.estado] || 'badge-gray'}`}>{c.estado}</span></td>
                      <td>
                        <select
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none"
                          value={c.estado}
                          onChange={e => cambiarEstado(c.id, e.target.value)}
                        >
                          {['Pendiente', 'Confirmada', 'Realizada', 'Cancelada', 'Reprogramada'].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
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
