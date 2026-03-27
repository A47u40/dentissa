import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public
import Landing from './pages/Landing'

// Patient
import PatientDashboard from './pages/patient/Dashboard'
import BookAppointment from './pages/patient/BookAppointment'
import AppointmentHistory from './pages/patient/AppointmentHistory'
import PatientProfile from './pages/patient/Profile'

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminCalendar from './pages/admin/Calendar'
import AdminBookAppointment from './pages/admin/BookAppointment'
import AppointmentNotes from './pages/admin/AppointmentNotes'
import AdminAppointmentHistory from './pages/admin/AppointmentHistory'
import SpecialistBookAppointment from './pages/admin/SpecialistBookAppointment'
import ManageUsers from './pages/admin/ManageUsers'
import ManageSpecialists from './pages/admin/ManageSpecialists'
import ManageServices from './pages/admin/ManageServices'
import WebContent from './pages/admin/WebContent'

// Assistant
import AssistantDashboard from './pages/assistant/Dashboard'
import Reminders from './pages/assistant/Reminders'

// Shared
import MyProfile from './pages/shared/MyProfile'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              fontFamily: 'Inter, sans-serif',
              borderRadius: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
              fontSize: '0.9rem',
            },
            success: {
              iconTheme: { primary: '#E91E8C', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          {/* ── PUBLIC ─── */}
          <Route path="/" element={<Landing />} />

          {/* ── PATIENT ─── */}
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['Paciente']}>
              <PatientDashboard />
            </ProtectedRoute>
          } />
          <Route path="/book" element={
            <ProtectedRoute roles={['Paciente']}>
              <BookAppointment />
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute roles={['Paciente']}>
              <AppointmentHistory />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute roles={['Paciente', 'Admin', 'Especialista', 'Asistente']}>
              <MyProfile />
            </ProtectedRoute>
          } />

          {/* ── ADMIN / SPECIALIST ─── */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['Admin', 'Especialista']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/calendar" element={
            <ProtectedRoute roles={['Admin', 'Especialista']}>
              <AdminCalendar />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute roles={['Admin']}>
              <ManageUsers />
            </ProtectedRoute>
          } />
          <Route path="/admin/specialists" element={
            <ProtectedRoute roles={['Admin']}>
              <ManageSpecialists />
            </ProtectedRoute>
          } />
          <Route path="/admin/book" element={
            <ProtectedRoute roles={['Admin']}>
              <AdminBookAppointment />
            </ProtectedRoute>
          } />
          <Route path="/admin/notes" element={
            <ProtectedRoute roles={['Admin', 'Especialista']}>
              <AppointmentNotes />
            </ProtectedRoute>
          } />
          <Route path="/admin/history" element={
            <ProtectedRoute roles={['Admin', 'Especialista']}>
              <AdminAppointmentHistory />
            </ProtectedRoute>
          } />
          <Route path="/admin/specialist-book" element={
            <ProtectedRoute roles={['Especialista']}>
              <SpecialistBookAppointment />
            </ProtectedRoute>
          } />
          <Route path="/admin/services" element={
            <ProtectedRoute roles={['Admin', 'Especialista']}>
              <ManageServices />
            </ProtectedRoute>
          } />
          <Route path="/admin/content" element={
            <ProtectedRoute roles={['Admin', 'Especialista']}>
              <WebContent />
            </ProtectedRoute>
          } />

          {/* ── ASSISTANT ─── */}
          <Route path="/assistant" element={
            <ProtectedRoute roles={['Asistente']}>
              <AssistantDashboard />
            </ProtectedRoute>
          } />
          <Route path="/assistant/reminders" element={
            <ProtectedRoute roles={['Asistente']}>
              <Reminders />
            </ProtectedRoute>
          } />
          <Route path="/assistant/content" element={
            <ProtectedRoute roles={['Asistente']}>
              <WebContent />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Landing />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
