import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { Alert, Spinner, TeamBadge } from '../../components/ui.jsx'

const REFRESH_MS = 30000
const ICONS = {
  GOLS: <span className="stat-icon">⚽</span>,
  ASSISTENCIAS: <span className="stat-icon assist">A</span>,
  AMARELOS: <span className="card-icon yellow" />,
  VERMELHOS: <span className="card-icon red" />,
}
const UNIT = { GOLS: ['gol', 'gols'], ASSISTENCIAS: ['assistência', 'assistências'], AMARELOS: ['amarelo', 'amarelos'], VERMELHOS: ['vermelho', 'vermelhos'] }

/** Aba Estatísticas: artilharia, assistências e cartões, com filtros. */
export default function StatisticsTab({ tournament }) {
  const [filters, setFilters] = useState({ tipo: '', limite: '10', grupo: '', equipe: '', fase: '' })
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    setLoading(true)
    return api.get(`/tournaments/${tournament.id}/statistics?${params}`)
      .then((d) => { setData(d); setError('') })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [tournament.id, filters])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) load() }, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  const set = (k) => (e) => {
    const v = e.target.value
    setFilters((f) => {
      const next = { ...f, [k]: v }
      // ao trocar o grupo, a equipe escolhida pode não pertencer mais a ele
      if (k === 'grupo' && v && f.equipe) {
        const team = data?.available.teams.find((t) => String(t.id) === f.equipe)
        if (team && team.groupName !== v) next.equipe = ''
      }
      return next
    })
  }

  if (error && !data) return <Alert>{error}</Alert>
  if (!data) return <Spinner />

  const { available, rankings } = data
  const teams = available.teams.filter((t) => !filters.grupo || t.groupName === filters.grupo)
  const single = rankings.length === 1
  const hasFilter = filters.tipo || filters.grupo || filters.equipe || filters.fase || filters.limite !== '10'

  return (
    <div>
      <div className="section-head">
        <h2>Estatísticas <span className="muted">({data.matchesCounted} jogo{data.matchesCounted === 1 ? '' : 's'} com lances)</span></h2>
        {loading && <span className="small muted">Atualizando...</span>}
      </div>

      <div className="card stats-filters">
        <div className="segmented" role="group" aria-label="Quantidade">
          <button type="button" className={filters.limite === '10' ? 'on' : ''} onClick={() => setFilters((f) => ({ ...f, limite: '10' }))}>Top 10</button>
          <button type="button" className={filters.limite === 'todos' ? 'on' : ''} onClick={() => setFilters((f) => ({ ...f, limite: 'todos' }))}>Todos os jogadores</button>
        </div>
        <label className="inline-field">
          Estatística
          <select value={filters.tipo} onChange={set('tipo')}>
            <option value="">Todas</option>
            {available.types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        {available.groups.length > 0 && (
          <label className="inline-field">
            Grupo
            <select value={filters.grupo} onChange={set('grupo')}>
              <option value="">Todos</option>
              {available.groups.map((g) => <option key={g} value={g}>Grupo {g}</option>)}
            </select>
          </label>
        )}
        <label className="inline-field">
          Equipe
          <select value={filters.equipe} onChange={set('equipe')}>
            <option value="">Todas</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        {available.phases.length > 1 && (
          <label className="inline-field">
            Fase
            <select value={filters.fase} onChange={set('fase')}>
              <option value="">Todas</option>
              {available.phases.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
        )}
        {hasFilter && (
          <button type="button" className="btn btn-link btn-sm" onClick={() => setFilters({ tipo: '', limite: '10', grupo: '', equipe: '', fase: '' })}>
            Limpar filtros
          </button>
        )}
      </div>
      <Alert>{error}</Alert>

      <div className={single ? '' : 'stats-grid'}>
        {rankings.map((r) => (
          <section key={r.type} className="card stats-card">
            <header className="stats-head">
              <h3>{ICONS[r.type]} {r.label}</h3>
              <span className="small muted">{r.total} no total</span>
            </header>
            {r.entries.length === 0 ? (
              <p className="muted small stats-empty">
                {filters.limite === 'todos' ? 'Nenhum jogador neste filtro.' : 'Nenhum registro ainda.'}
              </p>
            ) : (
              <ol className="stats-list">
                {r.entries.map((e, i) => {
                  const sameRank = i > 0 && r.entries[i - 1].rank === e.rank
                  return (
                    <li key={e.playerId} className={`${e.rank <= 3 && e.value > 0 ? `top top-${e.rank}` : ''} ${e.value === 0 ? 'zero' : ''}`}>
                      <span className="stats-rank">{sameRank ? '' : `${e.rank}º`}</span>
                      {e.photo
                        ? <img src={e.photo} alt="" className="stats-photo" />
                        : <TeamBadge name={e.playerName} size={34} />}
                      <span className="stats-player">
                        <strong>{e.playerName}</strong>
                        <Link to={`/torneios/${tournament.id}/equipes/${e.teamId}`} className="stats-team">
                          <TeamBadge name={e.teamName} logo={e.teamLogo} size={16} />
                          {e.teamName}{e.groupName ? ` · Grupo ${e.groupName}` : ''}
                        </Link>
                      </span>
                      <span className="stats-value" title={`${e.value} ${UNIT[r.type][e.value === 1 ? 0 : 1]}`}>{e.value}</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}