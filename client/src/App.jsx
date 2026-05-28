import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RoleSelectionPage from './pages/RoleSelectionPage'
import StudentAuthPage from './pages/StudentAuthPage'
import AdminAuthPage from './pages/AdminAuthPage'
import DashboardPage from './pages/DashboardPage'
import ProtectedRoute from './routes/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/select-role" element={<RoleSelectionPage />} />
            <Route path="/student/login" element={<StudentAuthPage mode="login" />} />
            <Route path="/student/register" element={<StudentAuthPage mode="register" />} />
            <Route path="/admin/login" element={<AdminAuthPage mode="login" />} />
            <Route path="/admin/register" element={<AdminAuthPage mode="register" />} />
            <Route
              path="/student/dashboard/:section?"
              element={
                <ProtectedRoute allowRoles={['student']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard/:section?"
              element={
                <ProtectedRoute allowRoles={['admin']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
