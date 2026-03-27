import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API } from '../../context/AuthContext'

const ESPECIALIDADES = [
  'Odontología General', 'Ortodoncia', 'Implantología', 'Endodoncia',
  'Periodoncia', 'Cirugía Maxilofacial', 'Ortopedia Maxilar', 'Odontopediatría',
]

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

function ImageUpload({ label, value, onChange }) {
  const inputRef = useRef()
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt={label} className="w-16 h-16 rounded-xl object-cover border-2"
            style={{ borderColor: 'var(--pink-light)' }} />
        ) : (
          <div className="w-16 h-16 rounded-xl flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 text-2xl">
            📷
          </div>
        )}
        <div>
          <button type="button" onClick={() => inputRef.current.click()}
            className="text-xs px-3 py-1.5 rounded-lg border border-pink-200 text-pink-600 hover:bg-pink-50 font-medium transition-all">
            {value ? 'Cambiar' : 'Subir'} foto
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="ml-2 text-xs text-gray-400 hover:text-red-500 transition-colors">✕ Quitar</button>
          )}
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (file) { const b64 = await toBase64(file); onChange(b64) }
            }} />
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — máx 2MB</p>
        </div>
      </div>
    </div>
  )
}

export default function ManageSpecialists() {
  const [specialists, setSpecialists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPerfil, setEditingPerfil] = useState(null) // editing perfil of existing specialist
  const [tab, setTab] = useState('cuenta') // 'cuenta' | 'perfil'
  const [form, setForm] = useState({
    email: '', password: '', nombre_completo: '', telefono: '',
  })
  const [perfil, setPerfil] = useState({
    especialidad: '', whatsapp_contacto: '', bio: '', anos_experiencia: '',
    foto_url: '', cert_foto_1: '', cert_foto_2: '', cert_foto_3: '',
  })

  const fetchSpecialists = () => {
    setLoading(true)
    axios.get(`${API}/especialistas/`)
      .then(r => setSpecialists(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchSpecialists() }, [])

  const openCreate = () => {
    setEditingPerfil(null)
    setTab('cuenta')
    setForm({ email: '', password: '', nombre_completo: '', telefono: '' })
    setPerfil({ especialidad: '', whatsapp_contacto: '', bio: '', anos_experiencia: '', foto_url: '', cert_foto_1: '', cert_foto_2: '', cert_foto_3: '' })
    setShowForm(true)
  }

  const openEditPerfil = (sp) => {
    setEditingPerfil(sp)
    setTab('perfil')
    const p = sp.perfil_especialista || {}
    setPerfil({
      especialidad: p.especialidad || '',
      whatsapp_contacto: p.whatsapp_contacto || '',
      bio: p.bio || '',
      anos_experiencia: p.anos_experiencia || '',
      foto_url: p.foto_url || '',
      cert_foto_1: p.cert_foto_1 || '',
      cert_foto_2: p.cert_foto_2 || '',
      cert_foto_3: p.cert_foto_3 || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingPerfil) {
        // Save perfil only
        await axios.patch(`${API}/perfil-especialista/${editingPerfil.id}/`, {
          ...perfil,
          anos_experiencia: perfil.anos_experiencia ? Number(perfil.anos_experiencia) : null,
        })
        toast.success('Perfil actualizado. ✅')
      } else {
        // Create user first
        await axios.post(`${API}/auth/register/`, {
          ...form,
          rol_nombre: 'Especialista',
        })
        toast.success('Especialista creado. 🦷')
      }
      fetchSpecialists()
      setShowForm(false)
    } catch (err) {
      const msg = err?.response?.data?.email?.[0] || 'Error al guardar especialista.'
      toast.error(msg)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este especialista?')) return
    try {
      await axios.delete(`${API}/usuarios/${id}/`)
      toast.success('Especialista eliminado.')
      fetchSpecialists()
    } catch { toast.error('Error al eliminar.') }
  }

  const initials = (name) => name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar">
        <div className="page-header flex items-start justify-between animate-fade-in-down">
          <div>
            <h1 className="page-title">Especialistas</h1>
            <p className="page-subtitle">Gestiona el equipo de especialistas de la clínica.</p>
          </div>
          <button onClick={openCreate} className="btn-primary">+ Nuevo especialista</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <p className="text-gray-400 col-span-3 text-center py-8">Cargando...</p>
          ) : specialists.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-4xl mb-3">🦷</p>
              <p className="text-gray-500">Sin especialistas registrados aún.</p>
            </div>
          ) : specialists.map((sp, i) => {
            const p = sp.perfil_especialista || {}
            return (
              <div key={sp.id} className={`card-hover animate-fade-in-up delay-${Math.min(i * 100 + 100, 500)}`}>
                {/* Avatar + info */}
                <div className="flex items-center gap-4 mb-4">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={sp.nombre_completo}
                      className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border-2"
                      style={{ borderColor: 'var(--pink-light)' }} />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, var(--pink) 0%, #a855f7 100%)' }}>
                      {initials(sp.nombre_completo)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">{sp.nombre_completo}</p>
                    <p className="text-xs text-gray-500 truncate">{sp.email}</p>
                    {p.especialidad && <span className="badge badge-pink text-xs mt-1">{p.especialidad}</span>}
                  </div>
                </div>

                {/* Perfil data */}
                <div className="space-y-1.5 text-sm mb-3">
                  {p.bio && <p className="text-xs text-gray-500 line-clamp-2">{p.bio}</p>}
                  {p.anos_experiencia && (
                    <p className="text-xs text-gray-500">🏆 {p.anos_experiencia} años de experiencia</p>
                  )}
                  {(p.whatsapp_contacto || sp.telefono) && (
                    <p className="text-xs text-gray-500">📱 {p.whatsapp_contacto || sp.telefono}</p>
                  )}
                </div>

                {/* Certificados thumbnails */}
                {(p.cert_foto_1 || p.cert_foto_2 || p.cert_foto_3) && (
                  <div className="flex gap-1 mb-3">
                    {[p.cert_foto_1, p.cert_foto_2, p.cert_foto_3].filter(Boolean).map((f, idx) => (
                      <img key={idx} src={f} alt={`Cert ${idx + 1}`}
                        className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                    ))}
                    <span className="text-xs text-gray-400 self-center ml-1">Certificados</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => openEditPerfil(sp)}
                    className="flex-1 text-xs py-2 rounded-xl border border-blue-200 text-blue-600 hover:bg-blue-50 font-semibold transition-all">
                    ✏️ Editar perfil
                  </button>
                  {(p.whatsapp_contacto || sp.telefono) && (
                    <a href={`https://wa.me/${(p.whatsapp_contacto || sp.telefono).replace(/\D/g, '')}`}
                      target="_blank" rel="noreferrer"
                      className="text-xs py-2 px-3 rounded-xl font-semibold"
                      style={{ background: '#25D366', color: 'white' }}>
                      💬
                    </a>
                  )}
                  <button onClick={() => handleDelete(sp.id)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 font-medium">🗑️</button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
            <div className="modal-box max-w-lg animate-scale-in" onClick={e => e.stopPropagation()}>
              <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400">✕</button>
              <h2 className="text-xl font-bold mb-4">
                {editingPerfil ? `Perfil de ${editingPerfil.nombre_completo}` : 'Nuevo especialista'}
              </h2>

              {/* Tabs (only for editing) */}
              {editingPerfil && (
                <div className="flex bg-gray-100 rounded-xl p-1 mb-5">
                  {[['cuenta', '👤 Datos personales'], ['perfil', '🦷 Perfil profesional']].map(([key, lbl]) => (
                    <button key={key} onClick={() => setTab(key)}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${tab === key ? 'bg-white shadow text-pink-600' : 'text-gray-500'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
                {/* Tab: Cuenta (always shown for create, conditionally for edit) */}
                {(!editingPerfil || tab === 'cuenta') && (
                  <>
                    <input type="text" placeholder="Nombre completo" required={!editingPerfil} className="input-field"
                      value={editingPerfil ? editingPerfil.nombre_completo : form.nombre_completo}
                      readOnly={!!editingPerfil}
                      onChange={e => setForm({ ...form, nombre_completo: e.target.value })} />
                    {!editingPerfil && (
                      <>
                        <input type="email" placeholder="Correo electrónico" required className="input-field"
                          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        <input type="password" placeholder="Contraseña (min 6 caracteres)" required className="input-field"
                          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                      </>
                    )}
                    <input type="tel" placeholder="Teléfono" className="input-field"
                      value={editingPerfil ? editingPerfil.telefono || '' : form.telefono}
                      readOnly={!!editingPerfil}
                      onChange={e => setForm({ ...form, telefono: e.target.value })} />
                  </>
                )}

                {/* Tab: Perfil profesional */}
                {(editingPerfil || !editingPerfil) && tab === 'perfil' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Especialidad</label>
                      <select className="input-field" value={perfil.especialidad}
                        onChange={e => setPerfil({ ...perfil, especialidad: e.target.value })}>
                        <option value="">Selecciona especialidad</option>
                        {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Años de experiencia</label>
                        <input type="number" min="0" className="input-field" placeholder="ej. 10"
                          value={perfil.anos_experiencia}
                          onChange={e => setPerfil({ ...perfil, anos_experiencia: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">WhatsApp contacto</label>
                        <input type="tel" className="input-field" placeholder="+52 55 ..."
                          value={perfil.whatsapp_contacto}
                          onChange={e => setPerfil({ ...perfil, whatsapp_contacto: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Bio / Presentación</label>
                      <textarea rows={3} className="input-field resize-none" placeholder="Describe tu experiencia y enfoque..."
                        value={perfil.bio} onChange={e => setPerfil({ ...perfil, bio: e.target.value })} />
                    </div>
                    <ImageUpload label="Foto de perfil" value={perfil.foto_url}
                      onChange={v => setPerfil({ ...perfil, foto_url: v })} />
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">
                        Certificados / Especialidades (máx 3 fotos)
                      </label>
                      <div className="space-y-3">
                        {[1, 2, 3].map(n => (
                          <ImageUpload key={n} label={`Foto ${n}`}
                            value={perfil[`cert_foto_${n}`]}
                            onChange={v => setPerfil({ ...perfil, [`cert_foto_${n}`]: v })} />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <button type="submit" className="btn-primary w-full justify-center">
                  {editingPerfil ? 'Guardar perfil' : 'Crear especialista'}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
