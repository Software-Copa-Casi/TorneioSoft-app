import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { Alert, Field } from '../components/ui.jsx'

const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

const EMPTY = { name: '', cpf: '', email: '', phone: '', password: '', confirm: '', birthDate: '', country: 'Brasil', state: '', city: '' }

const digits = (v) => v.replace(/\D/g, '')

function maskCpf(v) {
  const d = digits(v).slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskPhone(v) {
  const d = digits(v).slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/** Cadastro de usuário (RF02). */
export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const brasil = form.country.trim().toLowerCase() === 'brasil'
  const set = (k, mask) => (e) => {
    const v = mask ? mask(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [k]: v }))
    setFieldErrors((fe) => (fe[k] ? { ...fe, [k]: undefined } : fe))
  }
  const passwordOk = form.password.length >= 8 && /\p{L}/u.test(form.password) && /\d/.test(form.password)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!passwordOk) { setFieldErrors({ password: 'Use pelo menos 8 caracteres, com letras e números.' }); return }
    if (form.password !== form.confirm) { setFieldErrors({ confirm: 'As senhas não conferem.' }); return }
    setBusy(true)
    try {
      const { confirm: _, ...data } = form // eslint-disable-line no-unused-vars
      await register(data)
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fields || {})
    } finally {
      setBusy(false)
    }
  }

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
            <input type="date" value={form.birthDate} onChange={set('birthDate')} max={new Date().toISOString().slice(0, 10)} required />
          </Field>
        </div>
        <div className="form-row">
          <Field label="E-mail" required error={fe.email}>
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" maxLength={150} required />
          </Field>
          <Field label="Telefone" required error={fe.phone}>
            <input type="tel" value={form.phone} onChange={set('phone', maskPhone)} autoComplete="tel" placeholder="(00) 00000-0000" required />
          </Field>
        </div>

        <fieldset className="register-address">
          <legend>Endereço</legend>
          <div className="form-row form-row-3">
            <Field label="País" required error={fe.country}>
              <input value={form.country} onChange={set('country')} autoComplete="country-name" maxLength={80} required />
            </Field>
            <Field label="Estado" required error={fe.state}>
              {brasil ? (
                <select value={form.state} onChange={set('state')} required>
                  <option value="">UF</option>
                  {UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              ) : (
                <input value={form.state} onChange={set('state')} maxLength={80} required />
              )}
            </Field>
            <Field label="Cidade" required error={fe.city}>
              <input value={form.city} onChange={set('city')} autoComplete="address-level2" maxLength={120} required />
            </Field>
          </div>
        </fieldset>

        <div className="form-row">
          <Field label="Senha" required error={fe.password} hint="Mínimo de 8 caracteres, com letras e números.">
            <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" maxLength={72} required />
          </Field>
          <Field label="Confirmar senha" required error={fe.confirm}>
            <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" maxLength={72} required />
          </Field>
        </div>

        <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Criando conta...' : 'Criar conta'}</button>
        <p className="small muted auth-switch">
          Já tem conta? <Link to="/entrar" state={location.state}>Entrar</Link>
        </p>
      </form>
    </div>
  )
}