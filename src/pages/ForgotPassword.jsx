import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { Alert, Field } from '../components/ui.jsx'

/** Mesmo intervalo do back end (app.mail.resend-cooldown-seconds). */
const COOLDOWN = 60

/** "Esqueci minha senha": pede o link de redefinição por e-mail. */
export default function ForgotPassword() {
  const { forgotPassword } = useAuth()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email || '')
  const [sentTo, setSentTo] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [left, setLeft] = useState(0)

  useEffect(() => {
    if (left <= 0) return undefined
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  async function send(e) {
    e?.preventDefault()
    const value = email.trim()
    if (!value) { setError('Informe o e-mail da sua conta.'); return }
    setBusy(true)
    setError('')
    try {
      const res = await forgotPassword(value)
      setSentTo(res?.email || value)
      setLeft(COOLDOWN)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <div className="auth-page">
        <div className="card auth-card check-email">
          <div className="check-email-icon" aria-hidden="true">✉</div>
          <h1>Verifique o seu e-mail</h1>
          <p>
            Se houver uma conta com <strong>{sentTo}</strong>, enviamos um link para criar uma nova senha.
          </p>
          <p className="small muted">
            O link vale por 1 hora e só pode ser usado uma vez. Se não encontrar o e-mail, olhe a caixa de spam.
          </p>
          <Alert>{error}</Alert>
          <button type="button" className="btn btn-secondary btn-block" onClick={send} disabled={busy || left > 0}>
            {busy ? 'Enviando...' : left > 0 ? `Enviar de novo (${left}s)` : 'Enviar de novo'}
          </button>
          <p className="small muted auth-switch">
            <button type="button" className="btn-link" onClick={() => setSentTo('')}>Usar outro e-mail</button>
            {' · '}
            <Link to="/entrar">Voltar para Entrar</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={send} noValidate>
        <h1>Esqueci minha senha</h1>
        <p className="muted">Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.</p>
        <Alert>{error}</Alert>
        <Field label="E-mail">
          <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={150} required />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Enviando...' : 'Enviar link'}</button>
        <p className="small muted auth-switch">
          Lembrou a senha? <Link to="/entrar">Entrar</Link>
        </p>
      </form>
    </div>
  )
}
