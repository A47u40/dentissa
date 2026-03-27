import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { useAuth, API } from '../../context/AuthContext'

export default function BookAppointment() {
  const { user } = useAuth()
  const [especialistas, setEspecialistas] = useState([])
  const [form, setForm] = useState({
    especialista_id: '',
    fecha_cita: '',
    hora_inicio: '',
    servicio_realizado: '',
  })
  const [loading, setLoading] = useState(false)

  const SERVICIOS = [
    'Odontología General', 'Limpiezas', 'Extracciones', 'Caries',
    'Resina', 'Ortodoncia', 'Brackets', 'Ortopedia Maxilar',
  ]

  useEffect(() => {
    axios.get(`${API}/especialistas/`).then(r => setEspecialistas(r.data)).catch(() => {})
  }, [])

  const horaFin = (hi) => {
    if (!hi) return ''
    const [h, m] = hi.split(':').map(Number)
    const fin = new Date(2000, 0, 1, h + 2, m)
    return `${String(fin.getHours()).padStart(2, '0')}:${String(fin.getMinutes()).padStart(2, '0')}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.especialista_id || !form.fecha_cita || !form.hora_inicio) {
      toast.error('Completa todos los campos requeridos.')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API}/citas/`, {
        paciente: user.id,
        especialista: form.especialista_id,
        fecha_cita: form.fecha_cita,
        hora_inicio: form.hora_inicio,
        hora_fin: horaFin(form.hora_inicio),
        servicio_realizado: form.servicio_realizado,
        estado: 'Pendiente',
      })
      toast.success('¡Cita agendada exitosamente! 🦷')
      setForm({ especialista_id: '', fecha_cita: '', hora_inicio: '', servicio_realizado: '' })
    } catch (err) {
      const msg = err?.response?.data?.non_field_errors?.[0]
        || err?.response?.data?.detail
        || 'Error al agendar la cita.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar max-w-2xl">
        <div className="page-header">
          <h1 className="page-title">Agendar cita</h1>
          <p className="page-subtitle">Selecciona especialista, servicio y horario disponible.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Specialist */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Especialista *
              </label>
              <select
                className="input-field"
                value={form.especialista_id}
                onChange={e => setForm({ ...form, especialista_id: e.target.value })}
                required
              >
                <option value="">Selecciona un especialista</option>
                {especialistas.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.nombre_completo} — {e.perfil_especialista?.especialidad || 'General'}
                  </option>
                ))}
              </select>
            </div>

            {/* Service */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Servicio
              </label>
              <select className="input-field"
                value={form.servicio_realizado}
                onChange={e => setForm({ ...form, servicio_realizado: e.target.value })}
              >
                <option value="">Selecciona un servicio</option>
                {SERVICIOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Fecha *
              </label>
              <input type="date" min={today} required
                className="input-field"
                value={form.fecha_cita}
                onChange={e => setForm({ ...form, fecha_cita: e.target.value })}
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Hora de inicio * <span className="text-gray-400 font-normal normal-case">(horario: 7:00 a 20:00)</span>
              </label>
              <input type="time" min="07:00" max="18:00" step="1800" required
                className="input-field"
                value={form.hora_inicio}
                onChange={e => setForm({ ...form, hora_inicio: e.target.value })}
              />
              {form.hora_inicio && (
                <p className="text-xs text-gray-500 mt-1">
                  Finaliza a las <strong>{horaFin(form.hora_inicio)}</strong>
                </p>
              )}
            </div>

            {/* Info box */}
            <div className="rounded-xl p-4 text-sm" style={{ background: 'var(--pink-light)' }}>
              <p className="font-semibold mb-1" style={{ color: 'var(--pink)' }}>ℹ️ Información importante</p>
              <ul className="text-gray-600 space-y-1 text-xs">
                <li>• Recibirás confirmación por WhatsApp 24h antes.</li>
                <li>• Si no confirmas, la cita se cancela automáticamente.</li>
                <li>• Recibirás un recordatorio 1h antes de tu cita.</li>
              </ul>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3.5">
              {loading ? 'Agendando...' : '✅ Confirmar cita'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
