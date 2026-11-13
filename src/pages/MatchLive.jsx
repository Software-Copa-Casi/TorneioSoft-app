import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { useAuth } from '../auth.jsx'
import { Alert, Spinner, TeamBadge } from '../components/ui.jsx'
import GoalDialog from '../components/match/GoalDialog.jsx'
import CardDialog from '../components/match/CardDialog.jsx'
import { formatClock, useMatchClock } from '../components/match/useMatchClock.js'
import '../match.css'

const POLL_MS = 5000
const STATUS_LABEL = { AGENDADA: 'Não iniciada', EM_ANDAMENTO: 'Em andamento', ENCERRADA: 'Encerrada' }
const POSITION_SHORT = { GOLEIRO: 'GOL', FIXO: 'FIX', ALA_DIREITA: 'ALD', ALA_ESQUERDA: 'ALE', PIVO: 'PIV' }

/** Tela da partida: placar, cronômetro, relacionados das equipes, lances e ações do organizador. */
export default function MatchLive() {
  const { id, matchId } = useParams()
  const { user } = useAuth()
  const [live, setLive] = useState(null)
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState(null)
  const [busy, setBusy] = useState(false)

  const base = `/tournaments/${id}/matches/${matchId}`
  const load = useCallback(() => api.get(base).then(setLive).catch((e) => setError(e.message)), [base])

  useEffect(() => { load() }, [load])
    // só o organizador do torneio (ou o root) controla a partida
  const [editor, setEditor] = useState(false)
  useEffect(() => {
    api.get(`/tournaments/${id}`).then((t) => setEditor(t.canEdit)).catch(() => setEditor(false))
  }, [id, user?.id, user?.role])

  // mantém placar e lances atualizados para quem acompanha de outro aparelho
  useEffect(() => {
    if (live?.match.status !== 'EM_ANDAMENTO') return
    const t = setInterval(() => { if (!document.hidden) load() }, POLL_MS)
    return () => clearInterval(t)
  }, [live?.match.status, load])

  const seconds = useMatchClock(live?.clock)

  async function action(path, body, confirmText) {
    if (confirmText && !confirm(confirmText)) return
    setBusy(true)
    setError('')
    try {
      setLive(await api.post(`${base}/${path}`, body))
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function submitEvent(path, body) {
    setLive(await api.post(`${base}/${path}`, body))
  }

  async function removeEvent(ev) {
    if (!confirm(`Desfazer o lance "${describe(ev)}"?`)) return
    try {
      setLive(await api.del(`${base}/events/${ev.id}`))
    } catch (e) {
      setError(e.message)
    }
  }

  if (error && !live) return <Alert>{error}</Alert>
  if (!live) return <Spinner />

  const { match, clock, home, away, events } = live
  if (!home || !away) {
    return (
      <div className="empty">
        <p>As equipes deste jogo ainda não estão definidas ({match.home.name} × {match.away.name}).</p>
        <Link to={`/torneios/${id}/jogos`} className="btn btn-primary">Voltar às rodadas</Link>
      </div>
    )
  }

  const status = match.status
  const canEdit = editor && status === 'EM_ANDAMENTO'
  const overtime = seconds > clock.matchDurationMinutes * 60

  return (
    <div className="live">
      <p className="breadcrumb">
        <Link to={`/torneios/${id}/jogos`}>← Rodadas</Link> · Jogo {match.number} · {match.groupName ? `Grupo ${match.groupName} · ` : ''}{match.stageLabel}
      </p>

      <section className="scoreboard">
        <div className="sb-team">
          <TeamBadge name={home.name} logo={home.logo} size={56} />
          <span className="sb-name">{home.name}</span>
        </div>
        <div className="sb-center">
          <div className="sb-score"><span>{home.score}</span><span className="sb-dash">–</span><span>{away.score}</span></div>
          <div className={`sb-clock ${clock.running ? 'running' : ''} ${overtime ? 'overtime' : ''}`}>
            {status === 'AGENDADA' ? '00:00' : formatClock(seconds)}
          </div>
          <div className={`sb-status st-${status}`}>
            {status === 'EM_ANDAMENTO' && !clock.running ? 'Cronômetro pausado' : STATUS_LABEL[status]}
          </div>
        </div>
        <div className="sb-team right">
          <TeamBadge name={away.name} logo={away.logo} size={56} />
          <span className="sb-name">{away.name}</span>
        </div>
      </section>

      <Alert>{error}</Alert>

      <div className="live-grid">
        <SquadPanel squad={home} label="Mandante" />

        <section className="live-center">
          {editor && (
            <div className="live-actions">
              {status === 'AGENDADA' && (
                <button className="btn btn-accent btn-lg big-action" disabled={busy} onClick={() => action('start')}>
                  ▶ Iniciar partida
                </button>
              )}
              {status === 'EM_ANDAMENTO' && (
                <>
                  <button className="btn big-action goal" onClick={() => setDialog('goal')}>⚽ Registrar gol</button>
                  <button className="btn big-action cards" onClick={() => setDialog('card')}>
                    <span className="card-icon yellow" /><span className="card-icon red" /> Registrar cartão
                  </button>
                  {clock.running
                    ? <button className="btn big-action neutral" disabled={busy} onClick={() => action('pause')}>⏸ Pausar cronômetro</button>
                    : <button className="btn big-action neutral" disabled={busy} onClick={() => action('resume')}>▶ Retomar cronômetro</button>}
                  <button className="btn big-action end" disabled={busy}
                          onClick={() => action('finish', undefined, `Encerrar a partida com o placar ${home.name} ${home.score} × ${away.score} ${away.name}? Depois de encerrada não é possível registrar novos lances.`)}>
                    ■ Encerrar partida
                  </button>
                </>
              )}
            </div>
          )}
          {status === 'ENCERRADA' && (
            <div className="final-box">
              <strong>Fim de jogo</strong>
              <span>{home.score === away.score ? 'Empate' : `Vitória do ${home.score > away.score ? home.name : away.name}`}</span>
            </div>
          )}

          <h3 className="timeline-title">Lances</h3>
          {events.length === 0 && <p className="muted center">{status === 'AGENDADA' ? 'A partida ainda não começou.' : 'Nenhum lance registrado.'}</p>}
          <ol className="timeline">
            {[...events].reverse().map((ev) => (
              <li key={ev.id} className={`tl-item ${ev.teamId === home.teamId ? 'tl-home' : 'tl-away'}`}>
                <span className="tl-minute">{ev.minute}</span>
                <EventIcon ev={ev} />
                <span className="tl-text">
                  <strong>{ev.playerName}</strong>
                  <small>{detail(ev)}</small>
                </span>
                {canEdit && <button className="btn btn-icon tl-undo" title="Desfazer lance" aria-label="Desfazer lance" onClick={() => removeEvent(ev)}>↺</button>}
              </li>
            ))}
          </ol>
        </section>

        <SquadPanel squad={away} label="Visitante" />
      </div>

      {dialog === 'goal' && <GoalDialog live={live} onSubmit={(b) => submitEvent('goals', b)} onClose={() => setDialog(null)} />}
      {dialog === 'card' && <CardDialog live={live} onSubmit={(b) => submitEvent('cards', b)} onClose={() => setDialog(null)} />}
    </div>
  )
}

function SquadPanel({ squad, label }) {
  return (
    <section className="squad">
      <header>
        <span className="squad-label">{label}</span>
        <span className="squad-name">{squad.name}</span>
      </header>
      {squad.players.length === 0 && <p className="muted small">Sem jogadores cadastrados.</p>}
      <ul>
        {squad.players.map((p) => (
          <li key={p.id} className={p.sentOff ? 'sent-off' : ''}>
            <span className="pos">{p.positions?.map((x) => POSITION_SHORT[x] || x)[0] ?? ''}</span>
            <span className="pname">{p.name}</span>
            <span className="pstats">
              {p.goals > 0 && <span title={`${p.goals} gol(s)`}>⚽{p.goals > 1 ? `×${p.goals}` : ''}</span>}
              {p.assists > 0 && <span className="assist" title={`${p.assists} assistência(s)`}>A{p.assists > 1 ? `×${p.assists}` : ''}</span>}
              {p.yellowCards > 0 && !p.sentOff && <span className="card-icon yellow" title="Cartão amarelo" />}
              {p.sentOff && <span className="card-icon red" title="Expulso" />}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function EventIcon({ ev }) {
  if (ev.type === 'GOL') return <span className="tl-icon">⚽</span>
  if (ev.type === 'CARTAO_AMARELO') return <span className="tl-icon"><span className="card-icon yellow" /></span>
  return <span className="tl-icon"><span className="card-icon red" /></span>
}

function detail(ev) {
  if (ev.type === 'GOL') {
    if (ev.ownGoal) return `Gol contra · ponto para ${ev.teamName}`
    return ev.assistName ? `Gol do ${ev.teamName} · assistência de ${ev.assistName}` : `Gol do ${ev.teamName}`
  }
  if (ev.type === 'CARTAO_AMARELO') return `Cartão amarelo · ${ev.teamName}`
  return ev.secondYellow ? `Expulso (segundo amarelo) · ${ev.teamName}` : `Cartão vermelho · ${ev.teamName}`
}

function describe(ev) {
  return `${ev.minute} ${ev.playerName} – ${detail(ev)}`
}
