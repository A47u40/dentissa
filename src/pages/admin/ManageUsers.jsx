import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API } from '../../context/AuthContext'

const EMPTY = { email: '', password: '', nombre_completo: '', telefono: '', rol_nombre: 'Paciente' }
const PATIENT_EMPTY = { fecha_nacimiento: '', enfermedad_importante: '', alergias: '' }

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [patientData, setPatientData] = useState(PATIENT_EMPTY)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const fetchUsers = () => {
    setLoading(true)
    axios.get(`${API}/usuarios/`)
      .then(r => setUsers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setPatientData(PATIENT_EMPTY)
    setShowForm(true)
  }

  const openEdit = (u) => {
    setEditing(u)
    setForm({ email: u.email, password: '', nombre_completo: u.nombre_completo || '', telefono: u.telefono || '', rol_nombre: u.rol_nombre || 'Paciente' })
    const pp = u.perfil_paciente || {}
    setPatientData({
      fecha_nacimiento: pp.fecha_nacimiento || '',
      enfermedad_importante: pp.enfermedad_importante || '',
      alergias: pp.alergias || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await axios.patch(`${API}/usuarios/${editing.id}/`, {
          nombre_completo: form.nombre_completo,
          telefono: form.telefono,
        })
        // Also save patient profile if Paciente
        if ((editing.rol_nombre || editing.rol) === 'Paciente') {
          try {
            await axios.patch(`${API}/perfil-paciente/${editing.id}/`, {
              fecha_nacimiento: patientData.fecha_nacimiento || null,
              enfermedad_importante: patientData.enfermedad_importante,
              alergias: patientData.alergias,
            })
          } catch { /* perfil may not exist */ }
        }
        toast.success('Usuario actualizado.')
      } else {
        await axios.post(`${API}/auth/register/`, {
          ...form,
          fecha_nacimiento: patientData.fecha_nacimiento || undefined,
          enfermedad_importante: patientData.enfermedad_importante,
          alergias: patientData.alergias,
        })
        toast.success('Usuario creado.')
      }
      fetchUsers()
      setShowForm(false)
    } catch (err) {
      const msg = err?.response?.data?.email?.[0] || 'Error al guardar usuario.'
      toast.error(msg)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este usuario?')) return
    try {
      await axios.delete(`${API}/usuarios/${id}/`)
      toast.success('Usuario eliminado.')
      fetchUsers()
    } catch { toast.error('Error al eliminar.') }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.nombre_completo?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = !roleFilter || u.rol_nombre === roleFilter
    return matchSearch && matchRole
  })

  const roleBadge = { Admin: 'badge-pink', Especialista: 'badge-green', Asistente: 'badge-yellow', Paciente: 'badge-gray' }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-header flex items-start justify-between animate-fade-in-down">
          <div>
            <h1 className="page-title">Gestión de Usuarios</h1>
            <p className="page-subtitle">Administra todos los usuarios del sistema.</p>
          </div>
          <button onClick={openCreate} className="btn-primary">+ Nuevo usuario</button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input type="search" placeholder="Buscar por nombre o correo..."
            className="input-field flex-1 min-w-[200px] max-w-sm"
            value={search} onChange={e => setSearch(e.target.value)} />
          <select className="input-field w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">Todos los roles</option>
            {['Paciente', 'Especialista', 'Asistente', 'Admin'].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="card">
          {loading ? (
            <p className="text-center py-8 text-gray-400">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No se encontraron usuarios.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Datos paciente</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const pp = u.perfil_paciente
                    return (
                      <tr key={u.id}>
                        <td className="font-medium">{u.nombre_completo || '—'}</td>
                        <td>{u.email}</td>
                        <td>{u.telefono || '—'}</td>
                        <td>
                          <span className={`badge ${roleBadge[u.rol_nombre] || 'badge-gray'}`}>
                            {u.rol_nombre || u.rol || '—'}
                          </span>
                        </td>
                        <td className="text-xs text-gray-500">
                          {pp ? (
                            <span>{pp.fecha_nacimiento || '—'} · {pp.alergias ? '⚠️' : ''}
                              {pp.enfermedad_importante ? '🏥' : ''}</span>
                          ) : '—'}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button onClick={() => openEdit(u)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">✏️ Editar</button>
                            <button onClick={() => handleDelete(u.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">🗑️ Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <div className="modal-box animate-scale-in" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
              <h2 className="text-xl font-bold mb-5">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                <div className="grid grid-cols-2 gap-3">
                  {/* Nombre */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre completo *</label>
                    <input type="text" required className="input-field"
                      value={form.nombre_completo} onChange={e => setForm({ ...form, nombre_completo: e.target.value })} />
                  </div>

                  {/* Email & password (only on create) */}
                  {!editing && (
                    <>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Correo *</label>
                        <input type="email" required className="input-field"
                          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Contraseña *</label>
                        <input type="password" required minLength={6} className="input-field"
                          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Rol</label>
                        <select className="input-field" value={form.rol_nombre}
                          onChange={e => setForm({ ...form, rol_nombre: e.target.value })}>
                          {['Paciente', 'Asistente', 'Especialista', 'Admin'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                  {/* Teléfono */}
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Teléfono</label>
                    <input type="tel" className="input-field"
                      value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                  </div>

                  {/* Patient fields */}
                  {(form.rol_nombre === 'Paciente' || (editing && (editing.rol_nombre === 'Paciente' || editing.rol === 'Paciente'))) && (
                    <>
                      <div className="col-span-2">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide border-t border-gray-100 pt-3 mb-3">
                          Datos del paciente
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Fecha de nacimiento</label>
                        <input type="date" className="input-field"
                          value={patientData.fecha_nacimiento}
                          onChange={e => setPatientData({ ...patientData, fecha_nacimiento: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Alergias</label>
                        <input type="text" placeholder="ej. Penicilina" className="input-field"
                          value={patientData.alergias}
                          onChange={e => setPatientData({ ...patientData, alergias: e.target.value })} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Enfermedades importantes</label>
                        <textarea rows={2} className="input-field resize-none" placeholder="ej. Diabetes, hipertensión"
                          value={patientData.enfermedad_importante}
                          onChange={e => setPatientData({ ...patientData, enfermedad_importante: e.target.value })} />
                      </div>
                    </>
                  )}
                </div>

                <button type="submit" className="btn-primary w-full justify-center">
                  {editing ? 'Guardar cambios' : 'Crear usuario'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
