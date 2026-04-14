import { createContext, useEffect, useState } from 'react'
import { canAccess } from '../data/permissions.js'
import { api, setAuthToken } from '../lib/api.js'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const { data } = await api.get('/auth/me')
        setAdmin(data.admin)
      } catch {
        setAuthToken(null)
        setAdmin(null)
      } finally {
        setIsLoading(false)
      }
    }

    bootstrapAuth()
  }, [])

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    setAuthToken(data.token)
    setAdmin(data.admin)
    return data.admin
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAuthToken(null)
      setAdmin(null)
    }
  }

  return (
    <AuthContext.Provider value={{ admin, isLoading, login, logout, can: (permission) => canAccess(admin, permission) }}>
      {children}
    </AuthContext.Provider>
  )
}
