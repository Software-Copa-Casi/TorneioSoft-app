import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { ResendButton } from '../components/CheckEmail.jsx'
import { Alert, Field, Spinner } from '../components/ui.jsx'

/** Página aberta pelo link do e-mail: /confirmar-email?token=... */
export default function ConfirmEmail() {
  const { confirmEmail } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [token] = useState(() => params.get('token') || '')
  const [error, setError] = useState(token ? '' : 'Link de confirmação incompleto. Abra o link do e-mail de novo.')
  const [email, setEmail] = useState('')
  const sent = useRef(false)

  useEffect(() => {
    // roda uma vez só (o StrictMode chama o efeito duas vezes e o link só vale uma vez)
    if (sent.current || !token) return
    sent.current = true
    // tira o token da barra de endereço, para ele não ficar no histórico nem em prints
    window.history.replaceState(window.history.state, '', '/confirmar-email')
    confirmEmail(token)
      .then(() => navigate('/', { replace: true, state: { flash: 'E-mail confirmado! Sua conta está ativa.' } }))
      .catch((err) => setError(err.message))
  }, [token, confirmEmail, navigate])

  if (!error) {
    return (
      <div className="auth-page">
        <div className="card auth-card check-email">
          <Spinner />
          <p>Confirmando o seu e-mail...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Não foi possível confirmar</h1>
        <Alert>{error}</Alert>
        <p className="small muted">Peça um novo link informando o e-mail do cadastro:</p>
        <Field label="E-mail">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <ResendButton email={email.trim()} startCooling={false} className="btn btn-primary btn-block" />
        <p className="small muted auth-switch">
          Já confirmou? <Link to="/entrar">Entrar</Link>
        </p>
      </div>
    </div>
  )
}
