import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { ResendButton } from '../components/CheckEmail.jsx'
import { Alert, Field } from '../components/ui.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  // conta criada mas e-mail ainda não confirmado: mostra o botão de reenviar o link
  const [unverified, setUnverified] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setUnverified(false)
    try {
      await login(username.trim(), password)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setUnverified(err.code === 'EMAIL_NOT_VERIFIED')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Entrar</h1>
        <p className="muted">Entre para organizar ou acompanhar torneios.</p>
        {unverified ? (
          <div className="unverified-box">
            <Alert kind="info">{error}</Alert>
            <ResendButton email={username.trim()} startCooling={false} />
          </div>
        ) : (
          <Alert>{error}</Alert>
        )}
        <Field label="E-mail">
          <input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        </Field>
        <Field label="Senha">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </Field>
        <p className="small forgot-link">
          <Link to="/recuperar-senha" state={{ email: username.trim() }}>Esqueci minha senha</Link>
        </p>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button>
        <p className="small muted auth-switch">
          Ainda não tem conta? <Link to="/cadastro" state={location.state}>Criar conta</Link>
        </p>
      </form>
    </div>
  )
}