import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext.jsx'

function ProtectedRoute({ children }) {
  const { admin, isLoading } = useContext(AuthContext)
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="shell-card-strong w-full max-w-md p-8 text-center">
          <div className="loading-skeleton mx-auto h-12 w-12 rounded-2xl" />
          <p className="mt-5 text-sm font-medium text-ui-body">Checking session and role access...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export default ProtectedRoute
