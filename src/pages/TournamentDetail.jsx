import { useCallback, useEffect, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import { api, getOptions, labelOf } from '../api/client.js'
import { useAuth } from '../auth.jsx'
import { Alert, Spinner } from '../components/ui.jsx'
import AccessPanel, { FollowButton, PrivateGate } from '../components/AccessPanel.jsx'
import TeamsTab from './tabs/TeamsTab.jsx'
import DrawTab from './tabs/DrawTab.jsx'
import MatchesTab from './tabs/MatchesTab.jsx'
import StandingsTab from './tabs/StandingsTab.jsx'
import StatisticsTab from './tabs/StatisticsTab.jsx'

const TABS = [
  { key: '', label: 'Visão geral' },
  { key: 'equipes', label: 'Equipes' },
  { key: 'sorteio', label: 'Sorteio' },
  { key: 'jogos', label: 'Rodadas' },
  { key: 'classificacao', label: 'Classificação' },
  { key: 'estatisticas', label: 'Estatísticas' },
]

export default function TournamentDetail() {
  const { id, tab = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [t, setT] = useState(null)
  const [options, setOptions] = useState(null)
  const [error, setError] = useState('')
  const [blocked, setBlocked] = useState(false)

  const reload = useCallback(() => api.get(`/tournaments/${id}`)
    .then((d) => { setT(d); setBlocked(false); setError('') })
    .catch((e) => { if (e.status === 403) setBlocked(true); else setError(e.message) }), [id])

  // recarrega ao entrar ou sair da conta, porque as permissões mudam
  useEffect(() => {
    reload()
    getOptions().then(setOptions).catch(() => {})
  }, [reload, user?.id, user?.role])

  async function remove() {
    if (!confirm(`Excluir o torneio "${t.name}"? Equipes, jogadores e jogos também serão excluídos.`)) return
    try {
      await api.del(`/tournaments/${id}`)
      navigate('/')
    } catch (e) {
      setError(e.message)
    }
  }

  if (blocked) return <PrivateGate tournamentId={id} onJoined={setT} onUnblock={() => setBlocked(false)} />
  if (error && !t) return <Alert>{error}</Alert>
  if (!t || !options) return <Spinner />

  return (
    <>
      <div className="tournament-header" style={t.image ? { backgroundImage: `linear-gradient(90deg, rgba(8,40,29,.92), rgba(8,40,29,.55)), url(${t.image})` } : undefined}>
        <div>
          <p className="eyebrow">{labelOf(options.categories, t.category)} · {labelOf(options.genders, t.gender)} · {labelOf(options.types, t.type)}</p>
          <h1>{t.name}</h1>
          <p>{labelOf(options.formats, t.format)} · {t.teamCount}/{t.numberOfTeams} equipes · {t.status === 'SORTEADO' ? 'Sorteio realizado' : 'Em configuração'}</p>
          <p className="header-owner">
            {t.ownerName ? `Organizado por ${t.ownerName}` : 'Organizado pela administração'}
            {t.canEdit && user?.role !== 'ROOT' && <span className="tag tag-owner">Você organiza</span>}
            {t.observing && <span className="tag tag-watch">Você acompanha</span>}
          </p>
        </div>
        {t.canEdit ? (
          <div className="header-actions">
            <Link to={`/torneios/${id}/editar`} className="btn btn-ghost-light">Editar</Link>
            <button className="btn btn-ghost-light" onClick={remove}>Excluir</button>
          </div>
        ) : (
          <div className="header-actions">
            <FollowButton tournament={t} onChange={setT} onError={setError} />
          </div>
        )}
      </div>

      <nav className="tabs">
        {TABS.filter((x) => x.key !== 'classificacao' || t.format !== 'MATA_MATA').map((x) => (
          <NavLink key={x.key} to={`/torneios/${id}${x.key ? '/' + x.key : ''}`} end className="tab">{x.label}</NavLink>
        ))}
      </nav>
      <Alert>{error}</Alert>

      {tab === '' && <Overview t={t} options={options} />}
      {tab === '' && t.canEdit && <AccessPanel tournament={t} onChange={setT} />}
      {tab === 'equipes' && <TeamsTab tournament={t} onChange={reload} />}
      {tab === 'sorteio' && <DrawTab tournament={t} options={options} onChange={reload} />}
      {tab === 'jogos' && <MatchesTab tournament={t} />}
      {tab === 'classificacao' && <StandingsTab tournament={t} options={options} />}
      {tab === 'estatisticas' && <StatisticsTab tournament={t} />}
    </>
  )
}

function Row({ label, children }) {
  if (children === null || children === undefined || children === '') return null
  return <div className="info-row"><dt>{label}</dt><dd>{children}</dd></div>
}

function Overview({ t, options }) {
  const yesNo = (b) => (b ? 'Ida e volta' : 'Jogo único')
  const range = (a, b) => (a || b ? `${a ?? '—'} a ${b ?? '—'}` : null)
  return (
    <div className="grid-2 overview">
      <div className="card">
        <h3>Informações</h3>
        <dl>
          <Row label="Categoria">{labelOf(options.categories, t.category)}</Row>
          <Row label="Gênero">{labelOf(options.genders, t.gender)}</Row>
          <Row label="Tipo">{labelOf(options.types, t.type)}</Row>
          <Row label="Privacidade">{labelOf(options.privacies, t.privacy)}</Row>
          <Row label="Tempo de jogo">{t.matchDurationMinutes} minutos</Row>
          <Row label="Equipes">{t.numberOfTeams}</Row>
          <Row label="Mín./máx. de equipes">{range(t.minTeams, t.maxTeams)}</Row>
          <Row label="Jogadores por relacionado">{range(t.minPlayersPerSquad, t.maxPlayersPerSquad)}</Row>
        </dl>
        {t.description && <p className="pre">{t.description}</p>}
      </div>
      <div className="card">
        <h3>Formato: {labelOf(options.formats, t.format)}</h3>
        <dl>
          {t.format === 'GRUPOS_MATA_MATA' && <>
            <Row label="Grupos">{t.groupCount} (máx. {t.maxTeamsPerGroup} por grupo)</Row>
            <Row label="Classificam">2 melhores de cada grupo</Row>
          </>}
          {t.format !== 'MATA_MATA' && <Row label="Turnos">{t.returnLeg ? 'Turno e returno' : 'Turno único'}</Row>}
          {t.format !== 'PONTOS_CORRIDOS' && <>
            <Row label="Mata-mata">{yesNo(t.knockoutTwoLegged)}</Row>
            <Row label="Final">{yesNo(t.finalTwoLegged)}</Row>
            <Row label="Desempate">{labelOf(options.knockoutTiebreakers, t.knockoutTiebreaker)}{t.awayGoals ? ' · gol fora' : ''}</Row>
          </>}
          {t.tiebreakRules?.length > 0 && (
            <Row label="Critérios">{t.tiebreakRules.map((r) => labelOf(options.tiebreakRules, r)).join(' › ')}</Row>
          )}
        </dl>
        {t.formatDescription && <p className="pre">{t.formatDescription}</p>}
        {(t.regulationFile || t.regulationText) && <h3>Regulamento</h3>}
        {t.regulationFile && <a className="btn btn-secondary btn-sm" href={t.regulationFile} download={t.regulationFileName || 'regulamento.pdf'}>Baixar regulamento (PDF)</a>}
        {t.regulationText && <p className="pre">{t.regulationText}</p>}
      </div>
    </div>
  )
}