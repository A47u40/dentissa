import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const API = '/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('dentiss_token'))
  const [loading, setLoading] = useState(true)

  // Set axios default header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Load user from stored token on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('dentiss_user')
    if (storedUser && token) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login/`, { email, password })
    localStorage.setItem('dentiss_token', data.access)
    localStorage.setItem('dentiss_user', JSON.stringify(data.usuario))
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.access}`
    setToken(data.access)
    setUser(data.usuario)
    return data.usuario
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await axios.post(`${API}/auth/register/`, payload)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('dentiss_token')
    localStorage.removeItem('dentiss_user')
    delete axios.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }, [])

  const isAdmin = user?.rol === 'Admin' || user?.rol === 'Especialista'
  const isAssistant = user?.rol === 'Asistente'
  const isPatient = user?.rol === 'Paciente'

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAdmin, isAssistant, isPatient }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export { API }
