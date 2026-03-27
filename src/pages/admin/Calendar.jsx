import { useState, useEffect, useCallback, useMemo } from 'react'
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API, useAuth } from '../../context/AuthContext'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = { es }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

const COLOR_MAP = {
  Pendiente: '#f59e0b',
  Confirmada: '#E91E8C',
  Realizada: '#22c55e',
  Cancelada: '#ef4444',
  Reprogramada: '#8b5cf6',
}

// Clinic hours: 07:00 – 20:00
const CLINIC_OPEN = new Date()
CLINIC_OPEN.setHours(7, 0, 0, 0)
const CLINIC_CLOSE = new Date()
CLINIC_CLOSE.setHours(20, 0, 0, 0)
const scrollToTime = CLINIC_OPEN

export default function AdminCalendar() {
  const { user } = useAuth()
  const esEspecialista = user?.rol === 'Especialista'

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [especialistas, setEspecialistas] = useState([])
  // Specialists are locked to their own filter; admins can switch
  const [filtro, setFiltro] = useState('')
  const [view, setView] = useState(Views.WEEK)
  const [date, setDate] = useState(new Date())

  useEffect(() => {
    axios.get(`${API}/especialistas/`).then(r => setEspecialistas(r.data)).catch(() => {})
  }, [])

  const fetchCitas = useCallback(() => {
    setLoading(true)
    // Specialists only see their own appointments
    const id = esEspecialista ? user.id : filtro
    const params = id ? `?especialista_id=${id}` : ''
    axios.get(`${API}/citas/${params}`)
      .then(r => {
        const evts = r.data.map(c => ({
          id: c.id,
          title: `${c.paciente_nombre || 'Paciente'} — ${c.servicio_realizado || 'General'}`,
          start: new Date(`${c.fecha_cita}T${c.hora_inicio}`),
          end: new Date(`${c.fecha_cita}T${c.hora_fin}`),
          resource: c,
          color: COLOR_MAP[c.estado] || '#9e9e9e',
        }))
        setEvents(evts)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filtro])

  useEffect(() => { fetchCitas() }, [fetchCitas])

  const actualizarEstado = async (id, estado) => {
    try {
      await axios.patch(`${API}/citas/${id}/`, { estado })
      toast.success('Estado actualizado.')
      fetchCitas()
      setSelected(null)
    } catch {
      toast.error('Error al actualizar el estado.')
    }
  }

  const eventStyleGetter = (event) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: '6px',
      color: 'white',
      border: 'none',
      fontSize: '0.75rem',
      padding: '2px 6px',
    }
  })

  const messages = useMemo(() => ({
    today: 'Hoy',
    previous: '‹',
    next: '›',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    agenda: 'Agenda',
    date: 'Fecha',
    time: 'Hora',
    event: 'Evento',
    noEventsInRange: 'No hay citas en este período.',
  }), [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="page-header flex items-start justify-between animate-fade-in-down flex-shrink-0">
          <div>
          <h1 className="page-title">Calendario de citas</h1>
            <p className="page-subtitle">
              {esEspecialista ? 'Tu agenda de citas.' : 'Vista general de todas las citas activas.'}
            </p>
          </div>
          {!esEspecialista && (
            <select className="input-field w-64" value={filtro} onChange={e => setFiltro(e.target.value)}>
              <option value="">Todos los especialistas</option>
              {especialistas.map(e => (
                <option key={e.id} value={e.id}>{e.nombre_completo}</option>
              ))}
            </select>
          )}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 flex-wrap flex-shrink-0">
          {Object.entries(COLOR_MAP).map(([estado, color]) => (
            <span key={estado} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
              {estado}
            </span>
          ))}
        </div>

        {/* Calendar — flex-grow so it fills remaining height */}
        <div
          className="card p-0 overflow-hidden animate-fade-in-up"
          style={{ flex: 1, minHeight: 0 }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">⏳ Cargando calendario...</p>
            </div>
          ) : (
            <Calendar
              localizer={localizer}
              events={events}
              step={30}
              timeslots={2}
              view={view}
              onView={setView}
              date={date}
              onNavigate={setDate}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              scrollToTime={scrollToTime}
              min={CLINIC_OPEN}
              max={CLINIC_CLOSE}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={(e) => setSelected(e.resource)}
              culture="es"
              style={{ height: '100%', padding: '16px' }}
              messages={messages}
            />
          )}
        </div>

        {/* Cita modal */}
        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                ✕
              </button>
              <h3 className="text-lg font-bold mb-4">Detalles de la cita</h3>

              {/* Estado badge */}
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ background: COLOR_MAP[selected.estado] || '#9e9e9e' }}>
                  <span className="w-2 h-2 rounded-full bg-white/60" />
                  {selected.estado}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                {[
                  { l: '👤 Paciente', v: selected.paciente_nombre },
                  { l: '🦷 Especialista', v: selected.especialista_nombre },
                  { l: '📅 Fecha', v: selected.fecha_cita },
                  { l: '⏰ Horario', v: `${selected.hora_inicio?.slice(0,5)} – ${selected.hora_fin?.slice(0,5)}` },
                  { l: '🛠️ Servicio', v: selected.servicio_realizado || 'General' },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between gap-4">
                    <span className="text-gray-500 flex-shrink-0">{l}</span>
                    <span className="font-medium text-gray-900 text-right">{v}</span>
                  </div>
                ))}
              </div>

              {selected.comentario_especialista && (
                <div className="mt-4 p-3 rounded-xl text-xs text-gray-600 leading-relaxed"
                  style={{ background: '#f8f9fa' }}>
                  <p className="text-xs text-gray-400 uppercase font-semibold mb-1">📋 Nota</p>
                  {selected.comentario_especialista}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button onClick={() => actualizarEstado(selected.id, 'Confirmada')}
                  className="btn-primary text-xs py-2 justify-center">
                  ✅ Confirmar
                </button>
                <button onClick={() => actualizarEstado(selected.id, 'Cancelada')}
                  className="text-xs py-2 px-3 rounded-xl border-2 border-red-300 text-red-500 hover:bg-red-50 transition-all font-semibold">
                  ❌ Cancelar
                </button>
                <button onClick={() => actualizarEstado(selected.id, 'Realizada')}
                  className="col-span-2 text-xs py-2 px-3 rounded-xl border-2 border-green-300 text-green-600 hover:bg-green-50 transition-all font-semibold">
                  🦷 Marcar como Realizada
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
