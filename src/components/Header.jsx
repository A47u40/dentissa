import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

export default function Header() {
  const { user, logout, isAdmin, isAssistant } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [userDropOpen, setUserDropOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const dropRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (dropRef.current && !dropRef.current.contains(e.target)) setUserDropOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate('/')
  }

  const getDashLink = () => {
    if (isAdmin) return '/admin'
    if (isAssistant) return '/assistant'
    return '/dashboard'
  }

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/#servicios', label: 'Servicios' },
    { href: '/#mision', label: 'Misión y Visión' },
    { href: '/#especialistas', label: 'Especialistas' },
    { href: '/#promociones', label: 'Promociones' },
    { href: '/#faqs', label: 'Preguntas frecuentes' },
  ]

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-md'
          : 'bg-white/80 backdrop-blur-sm border-b border-pink-50 shadow-sm'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/imagenes/logo.png"
              alt="Dentiss Logo"
              className="h-9 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <span className="text-xl font-bold text-gradient">Dentissa</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(l => (
              <a key={l.label} href={l.href} className="btn-ghost text-sm">{l.label}</a>
            ))}
          </nav>

          {/* Desktop auth actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative" ref={dropRef}>
                <button
                  id="user-menu-btn"
                  onClick={() => setUserDropOpen(!userDropOpen)}
                  className="flex items-center gap-2 btn-ghost"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'var(--pink)' }}>
                    {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">{user.nombre}</span>
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userDropOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 card py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-500">Firmado como</p>
                      <p className="text-sm font-semibold truncate">{user.email}</p>
                      <span className="badge badge-pink text-xs mt-1">{user.rol}</span>
                    </div>
                    <Link to={getDashLink()} className="block px-4 py-2 text-sm hover:bg-pink-50 text-gray-700"
                      onClick={() => setUserDropOpen(false)}>🏠 Mi Panel</Link>
                    {!isAdmin && !isAssistant && (
                      <Link to="/profile" className="block px-4 py-2 text-sm hover:bg-pink-50 text-gray-700"
                        onClick={() => setUserDropOpen(false)}>👤 Mi Perfil</Link>
                    )}
                    <button onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600">
                      🚪 Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button id="btn-login" onClick={() => setShowModal(true)} className="btn-outline text-sm px-5 py-2">
                  Iniciar sesión
                </button>
                <button id="btn-register" onClick={() => setShowModal(true)} className="btn-primary text-sm px-5 py-2">
                  Registrarse
                </button>
              </>
            )}
          </div>

          {/* Mobile: hamburger */}
          <div className="flex md:hidden items-center gap-2" ref={menuRef}>
            {/* If user is logged in on mobile show avatar */}
            {user && (
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'var(--pink)' }}>
                {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            <button
              id="hamburger-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menú"
              className="p-2 rounded-xl transition-colors"
              style={{ color: 'var(--pink)' }}
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Mobile dropdown menu */}
            {menuOpen && (
              <div className="absolute top-16 left-0 right-0 bg-white border-b border-pink-100 shadow-lg z-50 animate-slide-down">
                <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
                  {/* Nav links */}
                  {navLinks.map(l => (
                    <a
                      key={l.label}
                      href={l.href}
                      className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-pink-50 transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      {l.label}
                    </a>
                  ))}

                  <div className="border-t border-gray-100 my-2" />

                  {/* Auth section */}
                  {user ? (
                    <>
                      <div className="px-4 py-2 text-sm text-gray-500">
                        <span className="font-semibold text-gray-900">{user.nombre}</span>
                        <span className="ml-2 badge badge-pink">{user.rol}</span>
                      </div>
                      <Link to={getDashLink()} className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-pink-50 transition-colors"
                        onClick={() => setMenuOpen(false)}>🏠 Mi Panel</Link>
                      {!isAdmin && !isAssistant && (
                        <Link to="/profile" className="block px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-pink-50 transition-colors"
                          onClick={() => setMenuOpen(false)}>👤 Mi Perfil</Link>
                      )}
                      <button onClick={handleLogout}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        🚪 Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2 pt-1">
                      <button
                        id="mobile-btn-login"
                        onClick={() => { setShowModal(true); setMenuOpen(false) }}
                        className="btn-outline text-sm w-full justify-center"
                      >
                        Iniciar sesión
                      </button>
                      <button
                        id="mobile-btn-register"
                        onClick={() => { setShowModal(true); setMenuOpen(false) }}
                        className="btn-primary text-sm w-full justify-center"
                      >
                        Registrarse
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {showModal && <AuthModal onClose={() => setShowModal(false)} />}
    </>
  )
}
