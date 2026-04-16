import axios from 'axios'

const token = localStorage.getItem('admin_token')
const isBrowser = typeof window !== 'undefined'
const currentHostname = isBrowser ? window.location.hostname : ''
const isLocalHost =
  currentHostname === 'localhost' ||
  currentHostname === '127.0.0.1' ||
  currentHostname === '::1'

const resolveApiBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_URL?.trim()

  if (isLocalHost) {
    return envBaseUrl || 'http://localhost:8080/api'
  }

  if (envBaseUrl) {
    return envBaseUrl
  }

  if (isBrowser) {
    return `${window.location.origin}/api`
  }

  return 'http://localhost:8080/api'
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: token ? { Authorization: `Bearer ${token}` } : {},
})

export const setAuthToken = (nextToken) => {
  if (nextToken) {
    localStorage.setItem('admin_token', nextToken)
    api.defaults.headers.Authorization = `Bearer ${nextToken}`
    return
  }

  localStorage.removeItem('admin_token')
  delete api.defaults.headers.Authorization
}
