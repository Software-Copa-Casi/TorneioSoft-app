import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth.jsx'
import { Alert, TeamBadge } from './ui.jsx'

/** Painel do organizador: código de acesso e lista de observadores. */
export default function AccessPanel({ tournament, onChange }) {
  const [observers, setObservers] = useState(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const base = `/tournaments/${tournament.id}`

  useEffect(() => {
    api.get(`${base}/observers`).then(setObservers).catch((e) => setError(e.message))
  }, [base])

  async function copy() {
    try {
      await navigator.clipboard.writeText(tournament.accessCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Não foi possível copiar. Selecione o código e copie manualmente.')
    }
  }

  async function regenerate() {
    if (!confirm('Gerar um novo código? O código atual deixa de funcionar, mas quem já acompanha continua acompanhando.')) return
    setBusy(true)
    try {
      onChange(await api.post(`${base}/access-code`))
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(o) {
    if (!confirm(`Remover ${o.name} dos observadores?`)) return
    try {
      await api.del(`${base}/observers/${o.userId}`)
      setObservers((list) => list.filter((x) => x.userId !== o.userId))
    } catch (e) {
      setError(e.message)
    }
  }

  const isPrivate = tournament.privacy === 'PRIVADO'
  return (
    <section className="card access-panel">
      <h3>Acesso ao torneio</h3>
      <Alert>{error}</Alert>
      <div className="access-grid">
        <div>
          <p className="small muted">
            {isPrivate
              ? 'O torneio é privado: só quem tem o código consegue acompanhar.'
              : 'O torneio é público: qualquer pessoa vê. Com o código, a pessoa entra direto como observadora.'}
          </p>
          <div className="access-code">
            <code aria-label="Código de acesso">{tournament.accessCode}</code>
            <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>{copied ? 'Copiado!' : 'Copiar'}</button>
            <button type="button" className="btn btn-link btn-sm" disabled={busy} onClick={regenerate}>Gerar novo código</button>
          </div>
        </div>
        <div>
          <p className="access-subtitle">
            Observadores {observers && <span className="muted">({observers.length})</span>}
          </p>
          {observers?.length === 0 && <p className="small muted">Ninguém acompanha este torneio ainda.</p>}
          {observers?.length > 0 && (
            <ul className="observer-list">
              {observers.map((o) => (
                <li key={o.userId}>
                  <TeamBadge name={o.name} size={28} />
                  <span>
                    <strong>{o.name}</strong>
                    <span className="small muted">desde {new Date(o.since).toLocaleDateString('pt-BR')}</span>
                  </span>
                  <button type="button" className="btn btn-link btn-sm danger" onClick={() => remove(o)}>Remover</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}

/** Botão "Acompanhar" / "Deixar de acompanhar" para quem não organiza o torneio. */
export function FollowButton({ tournament, onChange, onError }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [busy, setBusy] = useState(false)
  const base = `/tournaments/${tournament.id}/observers`

  if (!user) {
    return <Link to="/entrar" state={{ from: location.pathname }} className="btn btn-ghost-light">Entrar para acompanhar</Link>
  }

  async function toggle() {
    if (tournament.observing && !confirm(`Deixar de acompanhar "${tournament.name}"?`)) return
    setBusy(true)
    try {
      if (tournament.observing) {
        await api.del(base)
        // num torneio privado, quem deixa de acompanhar perde o acesso
        if (tournament.privacy === 'PRIVADO') { navigate('/'); return }
        onChange({ ...tournament, observing: false })
      } else {
        onChange(await api.post(base))
      }
    } catch (e) {
      onError(e.message)
    } finally {
      setBusy(false)
    }
  }

  return tournament.observing
    ? <button className="btn btn-ghost-light" disabled={busy} onClick={toggle}>✓ Acompanhando</button>
    : <button className="btn btn-accent" disabled={busy} onClick={toggle}>☆ Acompanhar</button>
}

/** Tela de um torneio privado para quem ainda não tem acesso. */
export function PrivateGate({ tournamentId, onJoined, onUnblock }) {
  const { user } = useAuth()
  const location = useLocation()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      onJoined(await api.post(`/tournaments/${tournamentId}/observers`, { codigo: code }))
      onUnblock()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card private-gate">
        <div className="private-icon" aria-hidden="true">🔒</div>
        <h1>Torneio privado</h1>
        {user ? (
          <form onSubmit={submit} className="private-form">
            <p className="muted">Peça o código de acesso ao organizador e digite abaixo para acompanhar o torneio.</p>
            <Alert>{error}</Alert>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Código de acesso"
              aria-label="Código de acesso" maxLength={12} autoFocus autoCapitalize="characters" spellCheck={false} required />
            <button className="btn btn-primary btn-block" disabled={busy || !code.trim()}>{busy ? 'Verificando...' : 'Acompanhar torneio'}</button>
          </form>
        ) : (
          <>
            <p className="muted">Entre na sua conta e informe o código de acesso que o organizador compartilhou.</p>
            <Link to="/entrar" state={{ from: location.pathname }} className="btn btn-primary btn-block">Entrar</Link>
            <Link to="/cadastro" state={{ from: location.pathname }} className="btn btn-secondary btn-block">Criar conta</Link>
          </>
        )}
        <Link to="/" className="small">Voltar para os torneios</Link>
      </div>
    </div>
  )
}