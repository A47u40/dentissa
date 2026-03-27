import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Sidebar from '../../components/Sidebar'
import { API, useAuth } from '../../context/AuthContext'

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

function ImageUpload({ label, value, onChange, size = 'md' }) {
  const inputRef = useRef()
  const sz = size === 'lg' ? 'w-24 h-24 rounded-2xl text-4xl' : 'w-16 h-16 rounded-xl text-2xl'
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-4">
        {value ? (
          <img src={value} alt={label} className={`${sz} object-cover border-2 flex-shrink-0`}
            style={{ borderColor: 'var(--pink-light)' }} />
        ) : (
          <div className={`${sz} flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 flex-shrink-0`}>
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
              if (file) {
                if (file.size > 2 * 1024 * 1024) { toast.error('La imagen no debe superar 2MB'); return }
                const b64 = await toBase64(file); onChange(b64)
              }
            }} />
          <p className="text-xs text-gray-400 mt-1">JPG, PNG, WebP — máx 2MB</p>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card mb-5">
      <h2 className="text-base font-bold text-gray-800 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export default function MyProfile() {
  const { user } = useAuth()
  const esEspecialista = user?.rol === 'Especialista'
  const esPaciente = user?.rol === 'Paciente'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Base user fields
  const [cuenta, setCuenta] = useState({
    nombre_completo: '',
    telefono: '',
    email: '',
  })

  // Specialist profile
  const [perfilEsp, setPerfilEsp] = useState({
    id: null,
    especialidad: '',
    whatsapp_contacto: '',
    bio: '',
    anos_experiencia: '',
    foto_url: '',
    cert_foto_1: '',
    cert_foto_2: '',
    cert_foto_3: '',
  })

  // Patient profile
  const [perfilPac, setPerfilPac] = useState({
    id: null,
    fecha_nacimiento: '',
    enfermedad_importante: '',
    alergias: '',
  })

  useEffect(() => {
    if (!user?.id) return
    setLoading(true)
    axios.get(`${API}/usuarios/${user.id}/`)
      .then(r => {
        const u = r.data
        setCuenta({
          nombre_completo: u.nombre_completo || '',
          telefono: u.telefono || '',
          email: u.email || '',
        })
        if (esEspecialista && u.perfil_especialista) {
          const p = u.perfil_especialista
          setPerfilEsp({
            id: p.id,
            especialidad: p.especialidad || '',
            whatsapp_contacto: p.whatsapp_contacto || '',
            bio: p.bio || '',
            anos_experiencia: p.anos_experiencia || '',
            foto_url: p.foto_url || '',
            cert_foto_1: p.cert_foto_1 || '',
            cert_foto_2: p.cert_foto_2 || '',
            cert_foto_3: p.cert_foto_3 || '',
          })
        }
        if (esPaciente && u.perfil_paciente) {
          const p = u.perfil_paciente
          setPerfilPac({
            id: p.id,
            fecha_nacimiento: p.fecha_nacimiento || '',
            enfermedad_importante: p.enfermedad_importante || '',
            alergias: p.alergias || '',
          })
        }
      })
      .catch(() => toast.error('Error al cargar perfil.'))
      .finally(() => setLoading(false))
  }, [user, esEspecialista, esPaciente])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      // 1. Update base user info
      await axios.patch(`${API}/usuarios/${user.id}/`, {
        nombre_completo: cuenta.nombre_completo,
        telefono: cuenta.telefono,
      })

      // 2. Update specialist profile
      if (esEspecialista && perfilEsp.id) {
        await axios.patch(`${API}/perfil-especialista/${perfilEsp.id}/`, {
          especialidad: perfilEsp.especialidad,
          whatsapp_contacto: perfilEsp.whatsapp_contacto,
          bio: perfilEsp.bio,
          anos_experiencia: perfilEsp.anos_experiencia ? Number(perfilEsp.anos_experiencia) : null,
          foto_url: perfilEsp.foto_url,
          cert_foto_1: perfilEsp.cert_foto_1,
          cert_foto_2: perfilEsp.cert_foto_2,
          cert_foto_3: perfilEsp.cert_foto_3,
        })
      }

      // 3. Update patient profile
      if (esPaciente && perfilPac.id) {
        await axios.patch(`${API}/perfil-paciente/${perfilPac.id}/`, {
          fecha_nacimiento: perfilPac.fecha_nacimiento || null,
          enfermedad_importante: perfilPac.enfermedad_importante,
          alergias: perfilPac.alergias,
        })
      }

      toast.success('Perfil actualizado ✅')
    } catch {
      toast.error('Error al guardar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  const initials = (name) => name?.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() || '?'

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="page-with-sidebar flex items-center justify-center">
          <p className="text-gray-400">Cargando perfil...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="page-with-sidebar max-w-3xl">
        {/* Header */}
        <div className="page-header animate-fade-in-down">
          <div className="flex items-center gap-5">
            {esEspecialista && perfilEsp.foto_url ? (
              <img src={perfilEsp.foto_url} alt={cuenta.nombre_completo}
                className="w-16 h-16 rounded-2xl object-cover border-2 flex-shrink-0"
                style={{ borderColor: 'var(--pink-light)' }} />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--pink) 0%, #a855f7 100%)' }}>
                {initials(cuenta.nombre_completo)}
              </div>
            )}
            <div>
              <h1 className="page-title">Mi Perfil</h1>
              <p className="page-subtitle">{cuenta.email} · {user?.rol}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="animate-fade-in-up">
          {/* Información general */}
          <Section title="👤 Información personal">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Nombre completo</label>
                <input className="input-field" type="text" value={cuenta.nombre_completo}
                  onChange={e => setCuenta({ ...cuenta, nombre_completo: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Teléfono</label>
                <input className="input-field" type="tel" value={cuenta.telefono}
                  onChange={e => setCuenta({ ...cuenta, telefono: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Correo electrónico</label>
              <input className="input-field" type="email" value={cuenta.email} readOnly
                style={{ background: '#f9fafb', color: '#9ca3af', cursor: 'not-allowed' }} />
              <p className="text-xs text-gray-400 mt-1">El correo no se puede modificar desde aquí.</p>
            </div>
          </Section>

          {/* Specialist profile */}
          {esEspecialista && (
            <>
              <Section title="🦷 Perfil profesional">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Especialidad</label>
                  <select className="input-field" value={perfilEsp.especialidad}
                    onChange={e => setPerfilEsp({ ...perfilEsp, especialidad: e.target.value })}>
                    <option value="">Selecciona especialidad</option>
                    {ESPECIALIDADES.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Años de experiencia</label>
                    <input className="input-field" type="number" min="0" placeholder="ej. 10"
                      value={perfilEsp.anos_experiencia}
                      onChange={e => setPerfilEsp({ ...perfilEsp, anos_experiencia: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">WhatsApp de contacto</label>
                    <input className="input-field" type="tel" placeholder="+52 55 ..."
                      value={perfilEsp.whatsapp_contacto}
                      onChange={e => setPerfilEsp({ ...perfilEsp, whatsapp_contacto: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Bio / Presentación</label>
                  <textarea rows={4} className="input-field resize-none" placeholder="Describe tu experiencia y enfoque..."
                    value={perfilEsp.bio} onChange={e => setPerfilEsp({ ...perfilEsp, bio: e.target.value })} />
                </div>
              </Section>

              <Section title="📷 Foto de perfil">
                <ImageUpload label="Foto de perfil" size="lg" value={perfilEsp.foto_url}
                  onChange={v => setPerfilEsp({ ...perfilEsp, foto_url: v })} />
              </Section>

              <Section title="🏅 Certificados y diplomas (máx 3)">
                <div className="space-y-5">
                  {[1, 2, 3].map(n => (
                    <ImageUpload key={n} label={`Certificado ${n}`}
                      value={perfilEsp[`cert_foto_${n}`]}
                      onChange={v => setPerfilEsp({ ...perfilEsp, [`cert_foto_${n}`]: v })} />
                  ))}
                </div>
              </Section>
            </>
          )}

          {/* Patient profile */}
          {esPaciente && (
            <Section title="🏥 Información médica">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Fecha de nacimiento</label>
                <input className="input-field" type="date" value={perfilPac.fecha_nacimiento}
                  onChange={e => setPerfilPac({ ...perfilPac, fecha_nacimiento: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Enfermedades importantes</label>
                <textarea rows={3} className="input-field resize-none" placeholder="Diabetes, hipertensión, etc."
                  value={perfilPac.enfermedad_importante}
                  onChange={e => setPerfilPac({ ...perfilPac, enfermedad_importante: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Alergias</label>
                <textarea rows={2} className="input-field resize-none" placeholder="Alergias a medicamentos, materiales, etc."
                  value={perfilPac.alergias}
                  onChange={e => setPerfilPac({ ...perfilPac, alergias: e.target.value })} />
              </div>
            </Section>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3.5">
            {saving ? 'Guardando...' : '💾 Guardar cambios'}
          </button>
        </form>
      </main>
    </div>
  )
}
