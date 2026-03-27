import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { useAuth, API } from '../../context/AuthContext'

export default function PatientProfile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    nombre_completo: user?.nombre || '',
    telefono: '',
    email: user?.email || '',
    edad: '',
    fecha_nacimiento: '',
    enfermedad_importante: '',
    alergias: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      axios.get(`${API}/usuarios/${user.id}/`),
      axios.get(`${API}/perfil-paciente/${user.id}/`),
    ]).then(([uRes, pRes]) => {
      setForm(prev => ({
        ...prev,
        nombre_completo: uRes.data.nombre_completo || '',
        telefono: uRes.data.telefono || '',
        email: uRes.data.email || '',
        edad: pRes.data.edad || '',
        fecha_nacimiento: pRes.data.fecha_nacimiento || '',
        enfermedad_importante: pRes.data.enfermedad_importante || '',
        alergias: pRes.data.alergias || '',
      }))
    }).catch(() => {})
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await Promise.all([
        axios.patch(`${API}/usuarios/${user.id}/`, {
          nombre_completo: form.nombre_completo,
          telefono: form.telefono,
        }),
        axios.patch(`${API}/perfil-paciente/${user.id}/`, {
          fecha_nacimiento: form.fecha_nacimiento || null,
          enfermedad_importante: form.enfermedad_importante,
          alergias: form.alergias,
        }),
      ])
      toast.success('Perfil actualizado correctamente ✅')
    } catch {
      toast.error('Error al guardar el perfil.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar max-w-2xl">
        <div className="page-header">
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">Mantén tu información actualizada para una mejor atención.</p>
        </div>

        <div className="card">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8 pb-6 border-b border-gray-100">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--pink) 0%, #a855f7 100%)' }}>
              {form.nombre_completo?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{form.nombre_completo}</h2>
              <p className="text-sm text-gray-500">{form.email}</p>
              <span className="badge badge-pink text-xs mt-1">Paciente</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Nombre completo
                </label>
                <input type="text" className="input-field"
                  value={form.nombre_completo}
                  onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Correo electrónico
                </label>
                <input type="email" className="input-field bg-gray-100 cursor-not-allowed"
                  value={form.email} readOnly />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Teléfono
                </label>
                <input type="tel" className="input-field"
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Fecha de nacimiento
                </label>
                <input type="date" className="input-field"
                  value={form.fecha_nacimiento}
                  onChange={e => setForm({ ...form, fecha_nacimiento: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Edad
                </label>
                <input type="number" className="input-field bg-gray-100 cursor-not-allowed" readOnly
                  value={form.edad} placeholder="Se calcula automáticamente"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Enfermedades importantes
                </label>
                <textarea rows={2} className="input-field resize-none"
                  placeholder="ej. Diabetes, hipertensión..."
                  value={form.enfermedad_importante}
                  onChange={e => setForm({ ...form, enfermedad_importante: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Alergias
                </label>
                <textarea rows={2} className="input-field resize-none"
                  placeholder="ej. Penicilina, látex..."
                  value={form.alergias}
                  onChange={e => setForm({ ...form, alergias: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Guardando...' : '💾 Guardar cambios'}
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}
