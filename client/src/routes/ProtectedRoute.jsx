import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowRoles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/select-role" replace state={{ from: location.pathname }} />
  }

  if (allowRoles && !allowRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard/home' : '/student/dashboard/home'} replace />
  }

  return children
}
