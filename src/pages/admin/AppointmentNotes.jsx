import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API, useAuth } from '../../context/AuthContext'

const ESTADO_BADGE = {
  Pendiente: 'badge-yellow',
  Confirmada: 'badge-pink',
  Realizada: 'badge-green',
  Cancelada: 'badge-red',
  Reprogramada: 'badge-gray',
}

export default function AppointmentNotes() {
  const { user } = useAuth()
  const esEspecialista = user?.rol === 'Especialista'

  const today = new Date().toISOString().split('T')[0]
  const [fecha, setFecha] = useState(today)
  const [citas, setCitas] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [nota, setNota] = useState('')
  const [savingId, setSavingId] = useState(null)

  const fetchCitas = useCallback(() => {
    setLoading(true)
    // Specialists only see their own appointments
    const params = `fecha=${fecha}${esEspecialista ? `&especialista_id=${user.id}` : ''}`
    axios.get(`${API}/citas/?${params}`)
      .then(r => setCitas(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fecha, esEspecialista, user])

  useEffect(() => { fetchCitas() }, [fetchCitas])

  const openEdit = (cita) => {
    setEditingId(cita.id)
    setNota(cita.comentario_especialista || '')
  }

  const saveNota = async (id) => {
    setSavingId(id)
    try {
      await axios.patch(`${API}/citas/${id}/`, {
        comentario_especialista: nota,
        estado: 'Realizada',
      })
      toast.success('Nota guardada ✅')
      setEditingId(null)
      fetchCitas()
    } catch {
      toast.error('Error al guardar nota.')
    } finally {
      setSavingId(null)
    }
  }

  const cambiarEstado = async (id, estado) => {
    try {
      await axios.patch(`${API}/citas/${id}/`, { estado })
      toast.success(`Estado → ${estado}`)
      fetchCitas()
    } catch { toast.error('Error al actualizar.') }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-header animate-fade-in-down">
          <div>
            <h1 className="page-title">Notas de citas</h1>
            <p className="page-subtitle">Registra lo que sucedió durante cada cita del día.</p>
          </div>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-4 mb-6 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-gray-600">Fecha:</label>
            <input type="date" className="input-field max-w-xs"
              value={fecha} onChange={e => setFecha(e.target.value)} />
          </div>
          <button onClick={fetchCitas} className="btn-outline text-sm px-4 py-2">
            🔄 Actualizar
          </button>
        </div>

        {loading ? (
          <div className="card text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">⏳</p>
            <p>Cargando citas...</p>
          </div>
        ) : citas.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-4xl mb-3">📅</p>
            <p className="text-gray-500">No hay citas para el {new Date(fecha + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 font-medium">
              {citas.length} cita{citas.length !== 1 ? 's' : ''} el {new Date(fecha + 'T12:00').toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            {citas
              .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
              .map((c, i) => (
                <div key={c.id} className={`card animate-fade-in-up delay-${Math.min(i * 100 + 100, 500)}`}>
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-lg font-bold" style={{ color: 'var(--pink)' }}>
                          {c.hora_inicio?.slice(0, 5)}
                        </p>
                        <p className="text-xs text-gray-400">{c.hora_fin?.slice(0, 5)}</p>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{c.paciente_nombre || '—'}</p>
                        <p className="text-xs text-gray-500">
                          Con: {c.especialista_nombre || '—'}
                          {c.servicio_realizado ? ` · ${c.servicio_realizado}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${ESTADO_BADGE[c.estado] || 'badge-gray'} text-xs`}>
                      {c.estado}
                    </span>
                  </div>

                  {/* Estado quick buttons */}
                  {c.estado !== 'Realizada' && c.estado !== 'Cancelada' && (
                    <div className="flex gap-2 mb-4">
                      <button onClick={() => cambiarEstado(c.id, 'Confirmada')}
                        className="text-xs px-3 py-1.5 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 font-medium transition-all">
                        ✅ Confirmar
                      </button>
                      <button onClick={() => cambiarEstado(c.id, 'Realizada')}
                        className="text-xs px-3 py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 font-medium transition-all">
                        🦷 Marcar realizada
                      </button>
                      <button onClick={() => cambiarEstado(c.id, 'Cancelada')}
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-all">
                        ❌ Cancelar
                      </button>
                    </div>
                  )}

                  {/* Nota */}
                  {editingId === c.id ? (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        📝 Comentario / nota de la cita
                      </label>
                      <textarea
                        rows={3}
                        className="input-field resize-none mb-3 text-sm"
                        placeholder="Ej: Se realizó limpieza dental. Paciente con placa moderada. Se recomienda seguimiento en 6 meses..."
                        value={nota}
                        onChange={e => setNota(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveNota(c.id)} disabled={savingId === c.id}
                          className="btn-primary text-sm px-4 py-2">
                          {savingId === c.id ? 'Guardando...' : '💾 Guardar nota'}
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="text-sm px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {c.comentario_especialista ? (
                        <div className="rounded-xl p-3 text-sm text-gray-700 leading-relaxed"
                          style={{ background: '#f8f9fa' }}>
                          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">📋 Nota registrada</p>
                          {c.comentario_especialista}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Sin nota registrada</p>
                      )}
                      <button onClick={() => openEdit(c)}
                        className="mt-2 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors">
                        {c.comentario_especialista ? '✏️ Editar nota' : '+ Agregar nota'} posterior a la cita
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </main>
    </div>
  )
}
