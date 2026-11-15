import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import CheckEmail from '../components/CheckEmail.jsx'
import { Alert, Field, PasswordInput } from '../components/ui.jsx'
import { PRIVACY_VERSION, TERMS_VERSION } from '../legal/legalVersions.js'

const EMPTY = { name: '', cpf: '', birthDate: '', email: '', password: '', confirm: '', guardianConsent: false }

const digits = (v) => v.replace(/\D/g, '')

function maskCpf(v) {
  const d = digits(v).slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

const today = () => new Date().toISOString().slice(0, 10)

/** Mesma regra do back end: menor de 18 anos na data de hoje. */
function isMinor(birthDate) {
  if (!birthDate) return false
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return birthDate > d.toISOString().slice(0, 10)
}

/** Cadastro de usuário (RF02). */
export default function Register() {
  const { register } = useAuth()
  const location = useLocation()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  // depois do cadastro: e-mail para onde foi o link de confirmação
  const [pendingEmail, setPendingEmail] = useState('')

  const set = (k, mask) => (e) => {
    const v = mask ? mask(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [k]: v }))
    setFieldErrors((fe) => (fe[k] ? { ...fe, [k]: undefined } : fe))
  }
  const minor = isMinor(form.birthDate)
  const passwordOk = form.password.length >= 8 && /\p{L}/u.test(form.password) && /\d/.test(form.password)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (minor && !form.guardianConsent) { setFieldErrors({ guardianConsent: 'Para menores de 18 anos, confirme a autorização do responsável.' }); return }
    if (!passwordOk) { setFieldErrors({ password: 'Use pelo menos 8 caracteres, com letras e números.' }); return }
    if (form.password !== form.confirm) { setFieldErrors({ confirm: 'As senhas não conferem.' }); return }
    setBusy(true)
    try {
      const { confirm: _, guardianConsent, ...data } = form // eslint-disable-line no-unused-vars
      // versões que esta tela mostrou: a API grava junto com data, hora e IP como prova do aceite
      const res = await register({
        ...data,
        termsVersion: TERMS_VERSION,
        privacyVersion: PRIVACY_VERSION,
        guardianConsent: minor ? guardianConsent : null,
      })
      setPendingEmail(res?.email || form.email.trim())
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fields || {})
    } finally {
      setBusy(false)
    }
  }

  if (pendingEmail) return <CheckEmail email={pendingEmail} onBack={() => setPendingEmail('')} />

  const fe = fieldErrors
  return (
    <div className="auth-page">
      <form className="card auth-card register-card" onSubmit={submit} noValidate>
        <h1>Criar conta</h1>
        <p className="muted">Com a conta você cria seus torneios e acompanha os de outros organizadores.</p>
        <Alert>{error}</Alert>

        <Field label="Nome completo" required error={fe.name}>
          <input autoFocus value={form.name} onChange={set('name')} autoComplete="name" maxLength={150} required />
        </Field>
        <div className="form-row">
          <Field label="CPF" required error={fe.cpf}>
            <input value={form.cpf} onChange={set('cpf', maskCpf)} inputMode="numeric" placeholder="000.000.000-00" required />
          </Field>
          <Field label="Data de nascimento" required error={fe.birthDate}>
            <input type="date" value={form.birthDate} onChange={set('birthDate')} max={today()} autoComplete="bday" required />
          </Field>
        </div>
        <Field label="E-mail" required error={fe.email}>
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={150} required />
        </Field>

        <div className="form-row">
          <Field label="Senha" required error={fe.password} hint="Mínimo de 8 caracteres, com letras e números.">
            <PasswordInput value={form.password} onChange={set('password')} autoComplete="new-password" maxLength={72} required />
          </Field>
          <Field label="Confirmar senha" required error={fe.confirm}>
            <PasswordInput value={form.confirm} onChange={set('confirm')} autoComplete="new-password" maxLength={72} required />
          </Field>
        </div>

        {minor && (
          <label className={`check-field ${fe.guardianConsent ? 'has-error' : ''}`}>
            <input
              type="checkbox"
              checked={form.guardianConsent}
              onChange={(e) => {
                setForm((f) => ({ ...f, guardianConsent: e.target.checked }))
                setFieldErrors((x) => ({ ...x, guardianConsent: undefined }))
              }}
            />
            <span>
              Tenho menos de 18 anos e meu pai, mãe ou responsável legal leu a{' '}
              <Link to="/privacidade" target="_blank" rel="noopener">Política de Privacidade</Link> e autoriza o meu cadastro.
              {fe.guardianConsent && <span className="field-error" style={{ display: 'block' }}>{fe.guardianConsent}</span>}
            </span>
          </label>
        )}

        <p className="consent-note">
          Ao clicar em Criar conta, você concorda com nossos{' '}
          <Link to="/termos" target="_blank" rel="noopener">Termos de Uso</Link> e declara estar ciente da nossa{' '}
          <Link to="/privacidade" target="_blank" rel="noopener">Política de Privacidade</Link>.
        </p>
        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Criando conta...' : 'Criar conta'}</button>
        <p className="small muted auth-switch">
          Já tem conta? <Link to="/entrar" state={location.state}>Entrar</Link>
        </p>
      </form>
    </div>
  )
}