import { useState, useEffect } from 'react'
import axios from 'axios'
import Sidebar from '../../components/Sidebar'
import { API } from '../../context/AuthContext'
import { useAuth } from '../../context/AuthContext'

const ESTADO_BADGE = {
  Pendiente: 'badge-yellow',
  Confirmada: 'badge-pink',
  Realizada: 'badge-green',
  Cancelada: 'badge-red',
  Reprogramada: 'badge-gray',
}

export default function AppointmentHistory() {
  const { user } = useAuth()
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    axios.get(`${API}/citas/?paciente_id=${user.id}`)
      .then(r => setCitas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-header">
          <h1 className="page-title">Historial de citas</h1>
          <p className="page-subtitle">Todas tus consultas anteriores en un solo lugar.</p>
        </div>

        <div className="card">
          {loading ? (
            <p className="text-gray-400 text-center py-8">Cargando...</p>
          ) : citas.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📋</p>
              <p className="text-gray-500">No tienes citas registradas aún.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Especialista</th>
                    <th>Servicio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {citas.map(c => (
                    <tr key={c.id}>
                      <td className="font-medium">{c.fecha_cita}</td>
                      <td>{c.hora_inicio} – {c.hora_fin}</td>
                      <td>{c.especialista_nombre || '—'}</td>
                      <td>{c.servicio_realizado || 'General'}</td>
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
