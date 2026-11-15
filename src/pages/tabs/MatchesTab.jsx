import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { Alert, Spinner, TeamBadge } from '../../components/ui.jsx'

const STATUS_LABEL = { AGENDADA: 'Agendada', EM_ANDAMENTO: 'Em andamento', ENCERRADA: 'Encerrada' }

export default function MatchesTab({ tournament }) {
  const canEdit = tournament.canEdit
  const [matches, setMatches] = useState(null)
  const [error, setError] = useState('')
  const [group, setGroup] = useState('')

  useEffect(() => {
    api.get(`/tournaments/${tournament.id}/matches`).then(setMatches).catch((e) => setError(e.message))
  }, [tournament.id, tournament.status])

  const groups = useMemo(() => [...new Set((matches || []).map((m) => m.groupName).filter(Boolean))], [matches])
  const rounds = useMemo(() => {
    const map = new Map()
    for (const m of matches || []) {
      if (group && m.groupName && m.groupName !== group) continue
      if (!map.has(m.round)) map.set(m.round, [])
      map.get(m.round).push(m)
    }
    return [...map.entries()]
  }, [matches, group])

  if (error) return <Alert>{error}</Alert>
  if (!matches) return <Spinner />
  if (matches.length === 0) {
    return (
      <div className="empty">
        <p>As rodadas são geradas automaticamente depois do sorteio.</p>
        <Link to={`/torneios/${tournament.id}/sorteio`} className="btn btn-primary">Ir para o sorteio</Link>
      </div>
    )
  }

  return (
    <div>
      <div className="section-head">
        <h2>Rodadas <span className="muted">({matches.length} jogos)</span></h2>
        {groups.length > 1 && (
          <label className="inline-field">
            Grupo
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="">Todos</option>
              {groups.map((g) => <option key={g} value={g}>Grupo {g}</option>)}
            </select>
          </label>
        )}
      </div>
      {rounds.map(([round, list]) => (
        <section key={round} className="round">
          <h3>Rodada {round} <span className="muted small">· {[...new Set(list.map((m) => m.stageLabel.replace(/^\d+ª rodada - /, '')))].join(' / ')}</span></h3>
          <div className="match-grid">
            {list.map((m) => (
              <div key={m.id} className={`card match match-${m.status}`}>
                <div className="match-meta">
                  <span>Jogo {m.number}</span>
                  <span>{m.groupName ? `Grupo ${m.groupName}` : m.stageLabel}</span>
                </div>
                <div className="match-teams">
                  <Side side={m.home} />
                  {m.status === 'AGENDADA'
                    ? <span className="vs">×</span>
                    : <span className="score">{m.homeScore} – {m.awayScore}</span>}
                  <Side side={m.away} right />
                </div>
                {m.home.defined && m.away.defined && (
                  <div className="match-footer">
                    <span className={`match-status st-${m.status}`}>{STATUS_LABEL[m.status]}</span>
                    <Link to={`/torneios/${tournament.id}/partidas/${m.id}`} className="btn btn-sm btn-secondary">
                      {m.status === 'AGENDADA' ? (canEdit ? 'Iniciar partida' : 'Detalhes') : m.status === 'EM_ANDAMENTO' ? 'Acompanhar' : 'Ver súmula'}
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function Side({ side, right }) {
  return (
    <div className={`match-side ${right ? 'right' : ''} ${side.defined ? '' : 'placeholder'}`}>
      {side.defined && <TeamBadge name={side.name} logo={side.logo} size={32} />}
      <span>{side.name}</span>
    </div>
  )
}