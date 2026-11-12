import { createContext, useContext, useEffect, useState } from 'react'
import { api, getToken, setToken } from './api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!getToken()) { setReady(true); return }
    api.get('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true))
  }, [])

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('copacasi:logout', onLogout)
    return () => window.removeEventListener('copacasi:logout', onLogout)
  }, [])

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password })
    setToken(res.token)
    setUser({ username: res.username })
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
