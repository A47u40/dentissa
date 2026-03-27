import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('login')
  const [loading, setLoading] = useState(false)

  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' })

  // Register form
  const [regData, setRegData] = useState({
    email: '', password: '', nombre_completo: '', telefono: '',
    rol_nombre: 'Paciente', fecha_nacimiento: '', enfermedad_importante: '', alergias: ''
  })

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(loginData.email, loginData.password)
      toast.success(`¡Bienvenido, ${user.nombre}! 🦷`)
      onClose()
      if (user.rol === 'Admin' || user.rol === 'Especialista') navigate('/admin')
      else if (user.rol === 'Asistente') navigate('/assistant')
      else navigate('/dashboard')
    } catch (err) {
      const msg = err?.response?.data?.non_field_errors?.[0] || 'Error al iniciar sesión.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(regData)
      toast.success('¡Cuenta creada! Ahora inicia sesión. 🎉')
      setTab('login')
      setLoginData({ email: regData.email, password: '' })
    } catch (err) {
      const errors = err?.response?.data
      const msg = errors?.email?.[0] || errors?.non_field_errors?.[0] || 'Error al registrarse.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="text-center mb-6">
          <img src="/imagenes/logo.png" alt="Dentiss" className="h-12 mx-auto mb-2 object-contain"
            onError={(e) => e.target.style.display = 'none'} />
          <h2 className="text-xl font-bold text-gray-900">
            {tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {tab === 'login' ? 'Accede a tu cuenta de Dentiss' : 'Únete a Dentiss hoy'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            id="tab-login"
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              tab === 'login' ? 'bg-white shadow text-pink-600' : 'text-gray-500'
            }`}
          >
            Iniciar sesión
          </button>
          <button
            id="tab-register"
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
              tab === 'register' ? 'bg-white shadow text-pink-600' : 'text-gray-500'
            }`}
          >
            Registrarse
          </button>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form id="form-login" onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                id="login-email"
                type="email"
                required
                placeholder="tu@correo.com"
                className="input-field"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                id="login-password"
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              />
            </div>
            <button
              id="btn-submit-login"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Ingresando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form id="form-register" onSubmit={handleRegister} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Nombre completo
                </label>
                <input type="text" required placeholder="María García"
                  className="input-field"
                  value={regData.nombre_completo}
                  onChange={(e) => setRegData({ ...regData, nombre_completo: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Correo electrónico
                </label>
                <input type="email" required placeholder="tu@correo.com"
                  className="input-field"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Contraseña
                </label>
                <input type="password" required placeholder="Mínimo 6 caracteres"
                  className="input-field"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Teléfono
                </label>
                <input type="tel" placeholder="+52 55 0000 0000"
                  className="input-field"
                  value={regData.telefono}
                  onChange={(e) => setRegData({ ...regData, telefono: e.target.value })}
                />
              </div>
              <>
                <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Fecha de nacimiento
                    </label>
                    <input type="date" className="input-field"
                      value={regData.fecha_nacimiento}
                      onChange={(e) => setRegData({ ...regData, fecha_nacimiento: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Enfermedades importantes
                    </label>
                    <input type="text" placeholder="ej. Diabetes"
                      className="input-field"
                      value={regData.enfermedad_importante}
                      onChange={(e) => setRegData({ ...regData, enfermedad_importante: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                      Alergias
                    </label>
                    <input type="text" placeholder="ej. Penicilina"
                      className="input-field"
                      value={regData.alergias}
                      onChange={(e) => setRegData({ ...regData, alergias: e.target.value })}
                    />
                  </div>
              </>
            </div>
            <button
              id="btn-submit-register"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
