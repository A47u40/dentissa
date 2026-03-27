import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const adminLinks = [
  { to: '/admin', icon: '📊', label: 'Dashboard', end: true },
  { to: '/admin/calendar', icon: '📅', label: 'Calendario' },
  { to: '/admin/book', icon: '➕', label: 'Agendar Cita' },
  { to: '/admin/notes', icon: '📝', label: 'Notas de Citas' },
  { to: '/admin/history', icon: '📋', label: 'Historial de Citas' },
  { to: '/admin/users', icon: '👥', label: 'Usuarios' },
  { to: '/admin/specialists', icon: '🦷', label: 'Especialistas' },
  { to: '/admin/services', icon: '🛠️', label: 'Servicios' },
  { to: '/admin/content', icon: '🌐', label: 'Contenido Web' },
  { to: '/profile', icon: '👤', label: 'Mi Perfil' },
]

const especialistaLinks = [
  { to: '/admin/calendar', icon: '📅', label: 'Calendario' },
  { to: '/admin/specialist-book', icon: '➕', label: 'Agendar Cita' },
  { to: '/admin/notes', icon: '📝', label: 'Notas de Citas' },
  { to: '/admin/history', icon: '📋', label: 'Historial de Citas' },
  { to: '/admin/services', icon: '🛠️', label: 'Mis Servicios' },
  { to: '/profile', icon: '👤', label: 'Mi Perfil' },
]

const assistantLinks = [
  { to: '/assistant', icon: '🏠', label: 'Dashboard', end: true },
  { to: '/assistant/reminders', icon: '🔔', label: 'Recordatorios' },
  { to: '/assistant/content', icon: '✏️', label: 'Contenido Web' },
  { to: '/profile', icon: '👤', label: 'Mi Perfil' },
]

const patientLinks = [
  { to: '/dashboard', icon: '🏠', label: 'Inicio', end: true },
  { to: '/book', icon: '📅', label: 'Agendar Cita' },
  { to: '/history', icon: '📋', label: 'Mis Citas' },
  { to: '/profile', icon: '👤', label: 'Mi Perfil' },
]

export default function Sidebar() {
  const { user, logout, isAdmin, isAssistant } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const links = user?.rol === 'Especialista' ? especialistaLinks
    : isAdmin ? adminLinks
    : isAssistant ? assistantLinks
    : patientLinks

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-pink-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/imagenes/logo.png" alt="Dentiss" className="h-9 w-auto object-contain"
            onError={(e) => (e.target.style.display = 'none')} />
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Dentiss</p>
            <p className="text-xs text-gray-400">{user?.rol}</p>
          </div>
        </div>
        {/* Close on mobile */}
        <button
          className="md:hidden text-gray-400 hover:text-gray-600 text-xl"
          onClick={() => setMobileOpen(false)}
          aria-label="Cerrar menú"
        >
          ✕
        </button>
      </div>

      {/* User info */}
      <div className="px-5 py-3 border-b border-pink-50">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: 'var(--pink)' }}
          >
            {user?.nombre?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{user?.nombre}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {links.map(({ to, icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `sidebar-link${isActive ? ' active' : ''}`
            }
          >
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-pink-50 pt-3 space-y-0.5">
        <NavLink to="/" className="sidebar-link text-gray-500" onClick={() => setMobileOpen(false)}>
          <span>🌐</span>
          <span>Ir al sitio</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-500 hover:bg-red-50"
        >
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Mobile hamburger button ─────────────── */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center text-gray-700 hover:bg-pink-50 transition-colors"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Mobile overlay ──────────────────────── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ──────────────────────── */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-screen w-72 z-50 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* ── Desktop sidebar (always visible) ───── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col z-30 bg-white border-r border-pink-50 shadow-sm">
        <SidebarContent />
      </aside>
    </>
  )
}
