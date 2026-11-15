import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api, getOptions, labelOf } from '../api/client.js'
import { useAuth } from '../auth.jsx'
import { Alert, Spinner } from '../components/ui.jsx'
import { PlanLimitNotice, useCanCreateTournament } from '../components/PlanLimit.jsx'

const SCOPES = [
  { key: 'todos', label: 'Todos' },
  { key: 'meus', label: 'Meus torneios' },
  { key: 'observando', label: 'Acompanhando' },
]

const EMPTY_TEXT = {
  todos: 'Nenhum torneio cadastrado ainda.',
  meus: 'Você ainda não criou nenhum torneio.',
  observando: 'Você ainda não acompanha nenhum torneio. Abra um torneio e clique em "Acompanhar", ou use um código de acesso.',
}

export default function Home() {
  const { user, ready, refreshPlan } = useAuth()
  const canCreate = useCanCreateTournament()
  const [params, setParams] = useSearchParams()
  const scope = user && SCOPES.some((s) => s.key === params.get('escopo')) ? params.get('escopo') : 'todos'
  const [tournaments, setTournaments] = useState(null)
  const [options, setOptions] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ready) return
    setTournaments(null)
    Promise.all([api.get(`/tournaments?escopo=${scope}`), getOptions()])
      .then(([t, o]) => { setTournaments(t); setOptions(o); setError('') })
      .catch((e) => setError(e.message))
    // o limite do plano muda quando um torneio termina ou é apagado
    if (user && user.role !== 'ROOT') refreshPlan()
  }, [scope, ready, user?.id, user?.role])

  return (
    <>
      <section className="hero">
        <div>
          <h1>Torneios de futsal organizados do sorteio à final</h1>
          <p>Crie o torneio, cadastre equipes e jogadores, faça o sorteio ao vivo e gere as rodadas automaticamente.</p>
          {user
            ? <CreateButton canCreate={canCreate} className="btn btn-accent btn-lg">Criar torneio</CreateButton>
            : <Link to="/cadastro" className="btn btn-accent btn-lg">Criar conta grátis</Link>}
        </div>
      </section>

      {user && !canCreate && <PlanLimitNotice />}

      {user && <JoinByCode />}

      <section>
        <div className="section-head">
          <h2>Torneios</h2>
          {user && <CreateButton canCreate={canCreate} className="btn btn-primary">Novo torneio</CreateButton>}
        </div>
        {user && (
          <div className="segmented home-scopes" role="tablist" aria-label="Quais torneios mostrar">
            {SCOPES.map((s) => (
              <button key={s.key} type="button" role="tab" aria-selected={scope === s.key} className={scope === s.key ? 'on' : ''}
                onClick={() => setParams(s.key === 'todos' ? {} : { escopo: s.key }, { replace: true })}>
                {s.label}
              </button>
            ))}
          </div>
        )}
        <Alert>{error}</Alert>
        {!tournaments && !error && <Spinner />}
        {tournaments && tournaments.length === 0 && (
          <div className="empty">
            <p>{EMPTY_TEXT[scope]}</p>
            {user && scope !== 'observando' && <CreateButton canCreate={canCreate} className="btn btn-primary">Criar torneio</CreateButton>}
          </div>
        )}
        <div className="card-grid">
          {tournaments?.map((t) => (
            <Link key={t.id} to={`/torneios/${t.id}`} className="card tournament-card">
              <div className="tournament-cover" style={t.image ? { backgroundImage: `url(${t.image})` } : undefined}>
                <span className={`status status-${t.status}`}>{t.status === 'SORTEADO' ? 'Sorteado' : 'Em configuração'}</span>
                <span className="card-tags">
                  {t.privacy === 'PRIVADO' && <span className="tag tag-private">Privado</span>}
                  {user?.role !== 'ROOT' && t.canEdit && <span className="tag tag-owner">Você organiza</span>}
                  {t.observing && <span className="tag tag-watch">Acompanhando</span>}
                </span>
              </div>
              <div className="card-body">
                <h3>{t.name}</h3>
                <p className="muted">
                  {labelOf(options?.categories, t.category)} · {labelOf(options?.genders, t.gender)} · {labelOf(options?.formats, t.format)}
                </p>
                <div className="progress" aria-label="Equipes cadastradas">
                  <div style={{ width: `${Math.min(100, (t.teamCount / t.numberOfTeams) * 100)}%` }} />
                </div>
                <p className="small muted">
                  {t.teamCount} de {t.numberOfTeams} equipes{t.ownerName ? ` · por ${t.ownerName}` : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

/** Botão de criar torneio: desabilitado quando o plano gratuito chegou ao limite. */
function CreateButton({ canCreate, className, children }) {
  if (canCreate) return <Link to="/torneios/novo" className={className}>{children}</Link>
  return (
    <button type="button" className={className} disabled title="O plano gratuito permite 1 torneio por vez">
      {children}
    </button>
  )
}

/** Acompanhar um torneio (público ou privado) digitando o código que o organizador compartilhou. */
function JoinByCode() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const t = await api.post('/tournaments/observar', { codigo: code })
      navigate(`/torneios/${t.id}`)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <form className="card join-code" onSubmit={submit}>
      <div>
        <h3>Tem um código de acesso?</h3>
        <p className="small muted">Digite o código que o organizador compartilhou para acompanhar o torneio.</p>
      </div>
      <div className="join-code-input">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex.: AB12CD34"
          aria-label="Código de acesso" maxLength={12} autoCapitalize="characters" spellCheck={false} required />
        <button className="btn btn-primary" disabled={busy || !code.trim()}>{busy ? 'Entrando...' : 'Acompanhar'}</button>
      </div>
      {error && <p className="field-error join-code-error" role="alert">{error}</p>}
    </form>
  )
}