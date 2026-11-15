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

  // Se a senha foi trocada (em outro aparelho ou por "esqueci minha senha"), a API recusa o token antigo
  // na hora. Para uma aba parada também sair, confere a sessão a cada 30 s e ao voltar para a aba;
  // o client.js recebe o 401 e dispara o logout.
  const loggedIn = !!user
  useEffect(() => {
    if (!loggedIn) return undefined
    const check = () => { if (document.visibilityState === 'visible') api.get('/auth/me').catch(() => {}) }
    const timer = setInterval(check, 30000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [loggedIn])

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

  /** "Esqueci minha senha": pede o link. A resposta é sempre a mesma, exista a conta ou não. */
  async function forgotPassword(email) {
    return api.post('/auth/forgot-password', { email })
  }

  /** Confere se o link de nova senha ainda vale (não gasta o link). Devolve { valid }. */
  async function checkResetToken(token) {
    return api.post('/auth/reset-password/check', { token })
  }

  /** Troca a senha pelo link do e-mail e já entra. */
  async function resetPassword(token, password) {
    start(await api.post('/auth/reset-password', { token, password }))
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, ready, login, register, confirmEmail, resendConfirmation, forgotPassword, checkResetToken, resetPassword, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)