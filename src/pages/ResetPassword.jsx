import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { Alert, Field, PasswordInput, Spinner } from '../components/ui.jsx'

const INVALID = 'Este link para criar nova senha é inválido ou expirou. Peça um novo link.'

/** Página aberta pelo link do e-mail: /redefinir-senha?token=... */
export default function ResetPassword() {
  const { checkResetToken, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [token] = useState(() => params.get('token') || '')
  // 'checking' | 'ok' | 'invalid'
  const [state, setState] = useState(token ? 'checking' : 'invalid')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const checked = useRef(false)

  useEffect(() => {
    if (checked.current || !token) return
    checked.current = true
    // tira o token da barra de endereço, para ele não ficar no histórico nem em prints
    window.history.replaceState(window.history.state, '', '/redefinir-senha')
    checkResetToken(token)
      .then((r) => setState(r?.valid ? 'ok' : 'invalid'))
      .catch((err) => { setState('ok'); setError(err.message) }) // falha de rede: deixa tentar mesmo assim
  }, [token, checkResetToken])

  const passwordOk = password.length >= 8 && /\p{L}/u.test(password) && /\d/.test(password)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!passwordOk) { setFieldErrors({ password: 'Use pelo menos 8 caracteres, com letras e números.' }); return }
    if (password !== confirm) { setFieldErrors({ confirm: 'As senhas não conferem.' }); return }
    setBusy(true)
    try {
      await resetPassword(token, password)
      navigate('/', { replace: true, state: { flash: 'Senha alterada! Você já está conectado.' } })
    } catch (err) {
      if (err.status === 400 && !err.fields?.password) setState('invalid')
      setError(err.message)
      setFieldErrors(err.fields || {})
    } finally {
      setBusy(false)
    }
  }

  if (state === 'checking') {
    return (
      <div className="auth-page">
        <div className="card auth-card check-email">
          <Spinner />
          <p>Conferindo o link...</p>
        </div>
      </div>
    )
  }

  if (state === 'invalid') {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <h1>Link inválido</h1>
          <Alert>{error || INVALID}</Alert>
          <Link to="/recuperar-senha" className="btn btn-primary btn-block">Pedir novo link</Link>
          <p className="small muted auth-switch"><Link to="/entrar">Voltar para Entrar</Link></p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>Criar nova senha</h1>
        <p className="muted">Escolha a nova senha da sua conta.</p>
        <Alert>{error}</Alert>
        <Field label="Nova senha" required error={fieldErrors.password} hint="Mínimo de 8 caracteres, com letras e números.">
          <PasswordInput autoFocus value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" maxLength={72} required />
        </Field>
        <Field label="Confirmar nova senha" required error={fieldErrors.confirm}>
          <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" maxLength={72} required />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Salvando...' : 'Salvar nova senha'}</button>
      </form>
    </div>
  )
}
