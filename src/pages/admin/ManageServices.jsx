import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API } from '../../context/AuthContext'

const EMPTY = { nombre: '', descripcion: '', duracion_minutos: 30, activo: true }

export default function ManageServices() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)

  const fetchServicios = () => {
    setLoading(true)
    axios.get(`${API}/servicios/?all=1`)
      .then(r => setServicios(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchServicios() }, [])

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (s) => {
    setEditing(s)
    setForm({ nombre: s.nombre, descripcion: s.descripcion || '', duracion_minutos: s.duracion_minutos, activo: s.activo })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = { ...form }
      if (editing) {
        await axios.patch(`${API}/servicios/${editing.id}/`, payload)
        toast.success('Servicio actualizado. ✅')
      } else {
        await axios.post(`${API}/servicios/`, payload)
        toast.success('Servicio creado. ✅')
      }
      fetchServicios()
      setShowForm(false)
    } catch {
      toast.error('Error al guardar servicio.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este servicio?')) return
    try {
      await axios.delete(`${API}/servicios/${id}/`)
      toast.success('Servicio eliminado.')
      fetchServicios()
    } catch { toast.error('Error al eliminar.') }
  }

  const toggleActivo = async (s) => {
    try {
      await axios.patch(`${API}/servicios/${s.id}/`, { activo: !s.activo })
      toast.success(s.activo ? 'Servicio desactivado.' : 'Servicio activado. ✅')
      fetchServicios()
    } catch { toast.error('Error al actualizar.') }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-header flex items-start justify-between animate-fade-in-down">
          <div>
            <h1 className="page-title">Servicios</h1>
            <p className="page-subtitle">Gestiona los servicios que ofrece la clínica.</p>
          </div>
          <button onClick={openCreate} className="btn-primary">+ Nuevo servicio</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-400 text-center py-8 col-span-3">Cargando...</p>
          ) : servicios.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-4xl mb-3">🛠️</p>
              <p className="text-gray-500">No hay servicios registrados.</p>
              <button onClick={openCreate} className="btn-primary mt-4">+ Crear primer servicio</button>
            </div>
          ) : servicios.map((s, i) => (
            <div key={s.id} className={`card-hover animate-fade-in-up delay-${Math.min(i * 100 + 100, 500)} flex flex-col`}>
              {/* Top: icon + name + badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: 'var(--pink-light)' }}>
                    🦷
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm leading-tight">{s.nombre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{s.duracion_minutos} min</p>
                  </div>
                </div>
                <span className={`badge text-xs flex-shrink-0 ml-2 ${s.activo ? 'badge-green' : 'badge-gray'}`}>
                  {s.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Description */}
              {s.descripcion && <p className="text-xs text-gray-500 mb-2 line-clamp-2 flex-1">{s.descripcion}</p>}

              {/* Price */}


              {/* Actions */}
              <div className="pt-3 border-t border-gray-100 mt-auto">
                {/* Row 1: Edit + Delete */}
                <div className="flex gap-2 mb-2">
                  <button onClick={() => openEdit(s)}
                    className="flex-1 text-xs py-2 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all font-medium">
                    ✏️ Editar
                  </button>
                  <button onClick={() => handleDelete(s.id)}
                    className="text-xs px-3 py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 transition-all font-medium">
                    🗑️ Eliminar
                  </button>
                </div>
                {/* Row 2: Toggle active full-width */}
                <button
                  onClick={() => toggleActivo(s)}
                  className={`w-full text-xs py-2 rounded-xl border transition-all font-medium ${
                    s.activo
                      ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                      : 'border-green-200 text-green-700 hover:bg-green-50'
                  }`}
                >
                  {s.activo ? '⏸ Desactivar servicio' : '▶ Activar servicio'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <div className="modal-box animate-scale-in">
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
              <h2 className="text-xl font-bold mb-5">{editing ? 'Editar servicio' : 'Nuevo servicio'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre *</label>
                  <input type="text" required className="input-field" placeholder="ej. Limpieza dental"
                    value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Descripción</label>
                  <textarea rows={2} className="input-field resize-none" placeholder="Descripción corta del servicio"
                    value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Duración *</label>
                  <select className="input-field" value={form.duracion_minutos}
                    onChange={e => setForm({ ...form, duracion_minutos: Number(e.target.value) })}>
                    <option value={30}>30 min</option>
                    <option value={60}>1 h</option>
                    <option value={90}>1:30 h</option>
                    <option value={120}>2 h</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.activo}
                    onChange={e => setForm({ ...form, activo: e.target.checked })}
                    className="w-4 h-4 rounded" />
                  <span className="text-sm text-gray-700">Servicio activo (visible al agendar citas)</span>
                </label>
                <button type="submit" className="btn-primary w-full justify-center">
                  {editing ? 'Guardar cambios' : 'Crear servicio'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
