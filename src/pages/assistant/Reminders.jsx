import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API } from '../../context/AuthContext'

const MEDIO_ICONS = { WhatsApp: '💬', SMS: '📱', Correo: '📧' }

export default function Reminders() {
  const [citas, setCitas] = useState([])
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState('')
  const [medio, setMedio] = useState('WhatsApp')

  useEffect(() => {
    axios.get(`${API}/citas/?estado=Confirmada`).then(r => setCitas(r.data)).catch(() => {})
    axios.get(`${API}/notificaciones/`).then(r => setNotifs(r.data.slice(0, 20))).catch(() => {})
  }, [])

  const enviar = async (e) => {
    e.preventDefault()
    if (!selected) { toast.error('Selecciona una cita.'); return }
    setLoading(true)
    try {
      await axios.post(`${API}/notificaciones/enviar/`, { cita_id: selected, medio })
      toast.success(`Recordatorio enviado por ${medio}! 📨`)
      // Refresh notifications
      axios.get(`${API}/notificaciones/`).then(r => setNotifs(r.data.slice(0, 20)))
    } catch { toast.error('Error al enviar recordatorio.') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-header">
          <h1 className="page-title">Recordatorios</h1>
          <p className="page-subtitle">Envía recordatorios manuales a pacientes y revisa el historial.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send reminder form */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Enviar recordatorio manual</h2>
            <form onSubmit={enviar} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Seleccionar cita confirmada
                </label>
                <select className="input-field" value={selected} onChange={e => setSelected(e.target.value)} required>
                  <option value="">Elige una cita...</option>
                  {citas.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.paciente_nombre} — {c.fecha_cita} {c.hora_inicio}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Canal de envío
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['WhatsApp', 'SMS', 'Correo'].map(m => (
                    <button key={m} type="button"
                      onClick={() => setMedio(m)}
                      className={`py-3 rounded-xl border-2 text-sm font-semibold flex flex-col items-center gap-1 transition-all duration-200 ${medio === m ? 'border-pink-400 text-pink-600 bg-pink-50' : 'border-gray-200 text-gray-500 hover:border-pink-300'}`}
                    >
                      <span className="text-xl">{MEDIO_ICONS[m]}</span>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
                {loading ? 'Enviando...' : '📨 Enviar recordatorio'}
              </button>
            </form>
          </div>

          {/* Notification log */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Historial de notificaciones</h2>
            {notifs.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Sin notificaciones aún.</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {notifs.map(n => (
                  <div key={n.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-xl">{MEDIO_ICONS[n.medio] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {n.tipo_aviso.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(n.fecha_envio_programada).toLocaleString('es-MX')}
                      </p>
                    </div>
                    <span className={`badge ${n.estado === 'Enviado' ? 'badge-green' : n.estado === 'Fallido' ? 'badge-red' : 'badge-yellow'}`}>
                      {n.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
