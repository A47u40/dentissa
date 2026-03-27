import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API } from '../../context/AuthContext'

export default function WebContent() {
  const [tab, setTab] = useState('promociones')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})

  const endpoints = {
    promociones: `${API}/promociones/`,
    faqs: `${API}/faqs/`,
    casos: `${API}/casos-exito/`,
  }

  const labels = { promociones: 'Promociones', faqs: 'Preguntas Frecuentes', casos: 'Casos de Éxito' }

  const fetchItems = () => {
    setLoading(true)
    axios.get(endpoints[tab]).then(r => setItems(r.data)).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchItems() }, [tab])

  const blankForms = {
    promociones: { titulo: '', descripcion: '', imagen_url: '', activo: true, fecha_inicio: '', fecha_fin: '' },
    faqs: { pregunta: '', respuesta: '' },
    casos: { titulo: '', descripcion: '', imagen_antes: '', imagen_despues: '' },
  }

  const openCreate = () => { setEditing(null); setForm(blankForms[tab]); setShowForm(true) }
  const openEdit = (item) => { setEditing(item); setForm(item); setShowForm(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await axios.patch(`${endpoints[tab]}${editing.id}/`, form)
        toast.success('Actualizado correctamente.')
      } else {
        await axios.post(endpoints[tab], form)
        toast.success('Creado correctamente.')
      }
      fetchItems(); setShowForm(false)
    } catch { toast.error('Error al guardar.') }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este elemento?')) return
    await axios.delete(`${endpoints[tab]}${id}/`)
    toast.success('Eliminado.')
    fetchItems()
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1 className="page-title">Contenido Web</h1>
            <p className="page-subtitle">Gestiona lo que aparece en el sitio público.</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>+ Nuevo</button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {Object.entries(labels).map(([k, v]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === k ? 'bg-white shadow text-pink-600' : 'text-gray-500'}`}>
              {v}
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? <p className="text-center py-6 text-gray-400">Cargando...</p>
            : items.length === 0 ? <p className="text-center py-10 text-gray-400">Sin contenido. Crea el primero.</p>
            : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-start justify-between p-4 rounded-xl border border-gray-100 hover:border-pink-200 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{item.titulo || item.pregunta}</p>
                      <p className="text-sm text-gray-500 truncate">{item.descripcion || item.respuesta || ''}</p>
                      {tab === 'promociones' && (
                        <span className={`badge mt-1 ${item.activo ? 'badge-green' : 'badge-gray'}`}>
                          {item.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button onClick={() => openEdit(item)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">✏️</button>
                      <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
              <h2 className="text-xl font-bold mb-5">{editing ? 'Editar' : 'Nuevo'} — {labels[tab]}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                {tab === 'promociones' && (
                  <>
                    <input type="text" placeholder="Título" required className="input-field"
                      value={form.titulo || ''} onChange={e => setForm({ ...form, titulo: e.target.value })} />
                    <textarea placeholder="Descripción" className="input-field resize-none" rows={3}
                      value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                    <input type="text" placeholder="URL de imagen" className="input-field"
                      value={form.imagen_url || ''} onChange={e => setForm({ ...form, imagen_url: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <input type="datetime-local" className="input-field"
                        value={form.fecha_inicio || ''} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} />
                      <input type="datetime-local" className="input-field"
                        value={form.fecha_fin || ''} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} />
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input type="checkbox" checked={form.activo} onChange={e => setForm({ ...form, activo: e.target.checked })} />
                      Activa
                    </label>
                  </>
                )}
                {tab === 'faqs' && (
                  <>
                    <textarea placeholder="Pregunta" required className="input-field resize-none" rows={2}
                      value={form.pregunta || ''} onChange={e => setForm({ ...form, pregunta: e.target.value })} />
                    <textarea placeholder="Respuesta" required className="input-field resize-none" rows={4}
                      value={form.respuesta || ''} onChange={e => setForm({ ...form, respuesta: e.target.value })} />
                  </>
                )}
                {tab === 'casos' && (
                  <>
                    <input type="text" placeholder="Título del caso" required className="input-field"
                      value={form.titulo || ''} onChange={e => setForm({ ...form, titulo: e.target.value })} />
                    <textarea placeholder="Descripción" className="input-field resize-none" rows={2}
                      value={form.descripcion || ''} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                    <input type="text" placeholder="URL imagen (Antes)" className="input-field"
                      value={form.imagen_antes || ''} onChange={e => setForm({ ...form, imagen_antes: e.target.value })} />
                    <input type="text" placeholder="URL imagen (Después)" className="input-field"
                      value={form.imagen_despues || ''} onChange={e => setForm({ ...form, imagen_despues: e.target.value })} />
                  </>
                )}
                <button type="submit" className="btn-primary w-full justify-center">
                  {editing ? 'Guardar cambios' : 'Crear'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
