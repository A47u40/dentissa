import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API } from '../../context/AuthContext'

// Generate 30-min slots from 07:00 to 19:30
const ALL_SLOTS = (() => {
  const slots = []
  for (let h = 7; h <= 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 19 && m === 30) continue
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  return slots
})()

const calcHoraFin = (inicio, minutos) => {
  if (!inicio) return ''
  const [h, m] = inicio.split(':').map(Number)
  const fin = new Date(2000, 0, 1, h, m + minutos)
  return `${String(fin.getHours()).padStart(2, '0')}:${String(fin.getMinutes()).padStart(2, '0')}`
}

const formatSlot = (slot) => {
  const [h, m] = slot.split(':').map(Number)
  const period = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export default function AdminBookAppointment() {
  const [especialistas, setEspecialistas] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [servicios, setServicios] = useState([])
  const [citasExistentes, setCitasExistentes] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    paciente: '',
    especialista: '',
    servicio_id: '',
    fecha_cita: '',
    hora_inicio: '',
  })

  useEffect(() => {
    axios.get(`${API}/especialistas/`).then(r => setEspecialistas(r.data)).catch(() => {})
    axios.get(`${API}/usuarios/`).then(r => {
      setPacientes(r.data.filter(u => u.rol_nombre === 'Paciente'))
    }).catch(() => {})
    axios.get(`${API}/servicios/`).then(r => setServicios(r.data.filter(s => s.activo))).catch(() => {})
  }, [])

  useEffect(() => {
    if (form.fecha_cita) {
      // Fetch ALL clinic appointments for the day — shared schedule
      axios.get(`${API}/citas/?fecha=${form.fecha_cita}`)
        .then(r => setCitasExistentes(
          r.data
            .filter(c => ['Pendiente', 'Confirmada'].includes(c.estado))
            .map(c => ({ ...c, hora_inicio: c.hora_inicio?.slice(0,5), hora_fin: c.hora_fin?.slice(0,5) }))
        ))
        .catch(() => {})
    } else {
      setCitasExistentes([])
    }
    setForm(f => ({ ...f, hora_inicio: '' }))
  }, [form.fecha_cita])

  const servicioSeleccionado = servicios.find(s => String(s.id) === String(form.servicio_id))
  const duracion = servicioSeleccionado?.duracion_minutos ?? 60

  const isSlotDisabled = (slot) => {
    const fin = calcHoraFin(slot, duracion)
    if (fin > '20:00') return true
    return citasExistentes.some(c => slot < c.hora_fin && fin > c.hora_inicio)
  }

  const horaFin = form.hora_inicio ? calcHoraFin(form.hora_inicio, duracion) : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.paciente || !form.especialista || !form.fecha_cita || !form.hora_inicio) {
      toast.error('Completa todos los campos requeridos.')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${API}/citas/`, {
        paciente: form.paciente,
        especialista: form.especialista,
        fecha_cita: form.fecha_cita,
        hora_inicio: form.hora_inicio,
        hora_fin: horaFin,
        servicio_realizado: servicioSeleccionado?.nombre || '',
        estado: 'Pendiente',
      })
      toast.success('¡Cita agendada! ✅')
      setForm({ paciente: '', especialista: '', servicio_id: '', fecha_cita: '', hora_inicio: '' })
    } catch (err) {
      const msg = err?.response?.data?.non_field_errors?.[0]
        || err?.response?.data?.detail
        || JSON.stringify(err?.response?.data)
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
      <main className="page-with-sidebar max-w-3xl">
        <div className="page-header animate-fade-in-down">
          <h1 className="page-title">Agendar cita</h1>
          <p className="page-subtitle">El admin asigna especialista, paciente, servicio y horario.</p>
        </div>

        <div className="animate-fade-in-up">
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Paciente */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Paciente *</label>
                  <select className="input-field" value={form.paciente} required
                    onChange={e => setForm({ ...form, paciente: e.target.value })}>
                    <option value="">Selecciona un paciente</option>
                    {pacientes.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre_completo || p.email}</option>
                    ))}
                  </select>
                </div>

                {/* Especialista */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Especialista *</label>
                  <select className="input-field" value={form.especialista} required
                    onChange={e => setForm({ ...form, especialista: e.target.value, hora_inicio: '' })}>
                    <option value="">Selecciona un especialista</option>
                    {especialistas.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.nombre_completo} — {e.perfil_especialista?.especialidad || 'General'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Servicio */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Servicio</label>
                  <select className="input-field" value={form.servicio_id}
                    onChange={e => setForm({ ...form, servicio_id: e.target.value, hora_inicio: '' })}>
                    <option value="">Sin servicio específico (60 min)</option>
                    {servicios.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} — {s.duracion_minutos} min</option>
                    ))}
                  </select>
                  {servicioSeleccionado && (
                    <p className="text-xs text-gray-400 mt-1">⏱ Duración: <strong>{servicioSeleccionado.duracion_minutos} min</strong></p>
                  )}
                </div>

                {/* Fecha */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Fecha *</label>
                  <input type="date" required min={today} className="input-field"
                    value={form.fecha_cita}
                    onChange={e => setForm({ ...form, fecha_cita: e.target.value, hora_inicio: '' })} />
                </div>

                {/* Hora — dropdown con slots */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Hora de inicio *</label>
                  <select className="input-field" value={form.hora_inicio} required
                    onChange={e => setForm({ ...form, hora_inicio: e.target.value })}>
                    <option value="">Selecciona un horario</option>
                    {ALL_SLOTS
                      .filter(slot => !isSlotDisabled(slot))
                      .map(slot => (
                        <option key={slot} value={slot}>{formatSlot(slot)}</option>
                      ))
                    }
                  </select>
                  {form.hora_inicio && (
                    <p className="text-xs text-gray-500 mt-1">
                      Finaliza a las <strong>{horaFin}</strong> ({duracion} min)
                    </p>
                  )}
                </div>
              </div>

              {/* Citas del día */}
              {citasExistentes.length > 0 && (
                <div className="rounded-xl p-4 bg-yellow-50 border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-700 mb-2">📅 Citas agendadas para ese día:</p>
                  <div className="space-y-1">
                    {citasExistentes
                      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                      .map(c => (
                        <p key={c.id} className="text-xs text-yellow-600">
                          • {c.hora_inicio.slice(0,5)}–{c.hora_fin.slice(0,5)} — {c.especialista_nombre} con {c.paciente_nombre} ({c.servicio_realizado || 'General'})
                        </p>
                      ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="btn-primary w-full justify-center py-3.5">
                {loading ? 'Agendando...' : '✅ Confirmar cita'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
