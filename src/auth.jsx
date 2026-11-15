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

  // o back end devolve { token, user: { id, name, email, role } } no login e no cadastro
  function start(res) {
    setToken(res.token)
    setUser(res.user)
  }

  async function login(username, password) {
    start(await api.post('/auth/login', { username, password }))
  }

  /** Cria a conta pendente. Não entra: devolve { message, email } e a pessoa precisa confirmar o e-mail. */
  async function register(data) {
    return api.post('/auth/register', data)
  }

  /** Link do e-mail: confirma a conta e já entra. */
  async function confirmEmail(token) {
    start(await api.post('/auth/confirm-email', { token }))
  }

  /** Pede outro link de confirmação. A resposta é sempre a mesma, exista a conta ou não. */
  async function resendConfirmation(email) {
    return api.post('/auth/resend-confirmation', { email })
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, ready, login, register, confirmEmail, resendConfirmation, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)