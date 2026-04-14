import axios from 'axios'

const token = localStorage.getItem('admin_token')

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
