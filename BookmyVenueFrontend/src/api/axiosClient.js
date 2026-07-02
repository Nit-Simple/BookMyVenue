import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // sends/receives the httpOnly refresh_token cookie
})

// The access token lives in React state (AuthContext), not here — but axios
// needs it attached to every outgoing request. AuthContext calls
// setAuthToken() whenever it changes, and this interceptor reads it.
let currentAccessToken = null

export function setAuthToken(token) {
  currentAccessToken = token
}

axiosClient.interceptors.request.use((config) => {
  if (currentAccessToken) {
    config.headers.Authorization = `Bearer ${currentAccessToken}`
  }
  return config
})

export default axiosClient