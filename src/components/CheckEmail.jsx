import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { Alert } from './ui.jsx'

/** Mesmo intervalo do back end (app.mail.resend-cooldown-seconds). */
const COOLDOWN = 60

/** Botão "Reenviar link", com contagem para não pedir de novo antes do intervalo. */
export function ResendButton({ email, className = 'btn btn-secondary btn-block', startCooling = true }) {
  const { resendConfirmation } = useAuth()
  const [left, setLeft] = useState(startCooling ? COOLDOWN : 0)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState({ kind: '', text: '' })

  useEffect(() => {
    if (left <= 0) return undefined
    const t = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  async function resend() {
    setBusy(true)
    setMsg({ kind: '', text: '' })
    try {
      const res = await resendConfirmation(email)
      setMsg({ kind: 'success', text: res?.message || 'Se houver um cadastro pendente, enviamos um novo link.' })
      setLeft(COOLDOWN)
    } catch (err) {
      setMsg({ kind: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {msg.text && <Alert kind={msg.kind}>{msg.text}</Alert>}
      <button type="button" className={className} onClick={resend} disabled={busy || left > 0 || !email}>
        {busy ? 'Enviando...' : left > 0 ? `Reenviar link (${left}s)` : 'Reenviar link'}
      </button>
    </>
  )
}

/** Tela mostrada depois do cadastro: a conta só é ativada pelo link enviado por e-mail. */
export default function CheckEmail({ email, onBack }) {
  return (
    <div className="auth-page">
      <div className="card auth-card check-email">
        <div className="check-email-icon" aria-hidden="true">✉</div>
        <h1>Confirme o seu e-mail</h1>
        <p>
          Enviamos um link de confirmação para <strong>{email}</strong>. Abra o link para ativar a conta.
        </p>
        <p className="small muted">
          O link vale por 24 horas. Se não encontrar o e-mail, olhe a caixa de spam ou peça outro link.
        </p>
        <ResendButton email={email} />
        <p className="small muted auth-switch">
          E-mail errado? <button type="button" className="btn-link" onClick={onBack}>Corrigir o cadastro</button>
          {' · '}
          <Link to="/entrar">Ir para Entrar</Link>
        </p>
      </div>
    </div>
  )
}
