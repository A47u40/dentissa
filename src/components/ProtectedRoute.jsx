import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, roles = [] }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-4 border-pink-200 border-t-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />

  if (roles.length > 0 && !roles.includes(user.rol)) {
    // Redirect to appropriate dashboard
    if (user.rol === 'Admin' || user.rol === 'Especialista') return <Navigate to="/admin" replace />
    if (user.rol === 'Asistente') return <Navigate to="/assistant" replace />
    return <Navigate to="/dashboard" replace />
  }

  return children
}
