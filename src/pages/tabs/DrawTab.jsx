import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { Alert, Spinner, TeamBadge } from '../../components/ui.jsx'
import DrawShow from '../../components/DrawShow.jsx'

export default function DrawTab({ tournament, onChange }) {
  const canEdit = tournament.canEdit
  const [draw, setDraw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [presentation, setPresentation] = useState(true)
  const [interval, setIntervalSec] = useState(3)
  const [showing, setShowing] = useState(false)
  const [busy, setBusy] = useState(false)

  const drawn = tournament.status === 'SORTEADO'
  const missing = tournament.numberOfTeams - tournament.teamCount
  const isGroups = tournament.format === 'GRUPOS_MATA_MATA'

  useEffect(() => {
    if (!drawn) { setDraw(null); setLoading(false); return }
    setLoading(true)
    api.get(`/tournaments/${tournament.id}/draw`).then(setDraw).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [tournament.id, drawn])

  async function doDraw() {
    setBusy(true)
    setError('')
    try {
      const res = await api.post(`/tournaments/${tournament.id}/draw`)
      setDraw(res)
      if (presentation) setShowing(true)
      onChange()
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function undo() {
    if (!confirm('Desfazer o sorteio? Os grupos e todas as rodadas geradas serão apagados.')) return
    try {
      await api.del(`/tournaments/${tournament.id}/draw`)
      setDraw(null)
      onChange()
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <Spinner />

  return (
    <div>
      <Alert>{error}</Alert>
      {showing && draw && (
        <DrawShow tournament={tournament} draw={draw} intervalMs={interval * 1000} onClose={() => setShowing(false)} />
      )}

      {!drawn && (
        <div className="card draw-setup">
          <h2>{isGroups ? 'Sorteio dos grupos' : 'Sorteio das equipes'}</h2>
          {missing > 0 ? (
            <>
              <p>Faltam <strong>{missing}</strong> equipe{missing === 1 ? '' : 's'} para completar as {tournament.numberOfTeams} previstas.
                O sorteio fica disponível quando todas estiverem cadastradas.</p>
              <Link to={`/torneios/${tournament.id}/equipes`} className="btn btn-primary">Cadastrar equipes</Link>
            </>
          ) : !canEdit ? (
            <p className="muted">O sorteio ainda não foi realizado.</p>
          ) : (
            <>
              <p>
                {isGroups
                  ? `As ${tournament.numberOfTeams} equipes serão distribuídas em ${tournament.groupCount} grupos.`
                  : tournament.format === 'MATA_MATA'
                    ? `O sorteio define os confrontos do mata-mata entre as ${tournament.numberOfTeams} equipes.`
                    : `O sorteio define a ordem da tabela de pontos corridos entre as ${tournament.numberOfTeams} equipes.`}
                {' '}As rodadas são geradas automaticamente logo depois.
              </p>
              <label className="check">
                <input type="checkbox" checked={presentation} onChange={(e) => setPresentation(e.target.checked)} />
                Modo apresentação: contagem regressiva e revelação das equipes uma por uma
              </label>
              {presentation && (
                <label className="inline-field">
                  Tempo entre equipes
                  <select value={interval} onChange={(e) => setIntervalSec(Number(e.target.value))}>
                    <option value={2}>2 segundos</option>
                    <option value={3}>3 segundos</option>
                    <option value={5}>5 segundos</option>
                    <option value={8}>8 segundos</option>
                  </select>
                </label>
              )}
              <button className="btn btn-accent btn-lg" onClick={doDraw} disabled={busy}>
                {busy ? 'Sorteando...' : isGroups ? 'Sortear grupos' : 'Sortear'}
              </button>
            </>
          )}
        </div>
      )}

      {drawn && draw && (
        <>
          <div className="section-head">
            <h2>Resultado do sorteio</h2>
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => setShowing(true)}>Reapresentar sorteio</button>
              <Link to={`/torneios/${tournament.id}/jogos`} className="btn btn-primary">Ver rodadas</Link>
              {canEdit && <button className="btn btn-link danger" onClick={undo}>Desfazer sorteio</button>}
            </div>
          </div>
          <DrawResult draw={draw} />
        </>
      )}
    </div>
  )
}

export function DrawResult({ draw, revealed }) {
  const reveals = revealed ?? draw.reveals
  if (draw.groups.length > 0) {
    return (
      <div className="group-grid">
        {draw.groups.map((g) => (
          <div key={g} className="card group-card">
            <h3>Grupo {g}</h3>
            <ul>
              {reveals.filter((r) => r.groupName === g).map((r) => (
                <li key={r.teamId} className="pop-in"><TeamBadge name={r.teamName} logo={r.logo} size={32} /> {r.teamName}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="card">
      <h3>Ordem do sorteio</h3>
      <ol className="draw-order">
        {reveals.map((r) => (
          <li key={r.teamId} className="pop-in"><TeamBadge name={r.teamName} logo={r.logo} size={32} /> {r.teamName}</li>
        ))}
      </ol>
      {!revealed && draw.format === 'MATA_MATA' && <FirstRound draw={draw} />}
    </div>
  )
}

function FirstRound({ draw }) {
  const first = draw.matches.filter((m) => m.round === Math.min(...draw.matches.map((x) => x.round)))
  const playing = new Set(first.flatMap((m) => [m.home.teamId, m.away.teamId]))
  const byes = draw.reveals.filter((r) => !playing.has(r.teamId))
  return (
    <>
      <h3>Confrontos – {first[0]?.stageLabel.replace(' - ida', '')}</h3>
      <ul className="pairs">
        {first.map((m) => <li key={m.id}><span>{m.home.name}</span><b>×</b><span>{m.away.name}</span></li>)}
      </ul>
      {byes.length > 0 && <p className="small muted">Avançam direto para a fase seguinte: {byes.map((b) => b.teamName).join(', ')}.</p>}
    </>
  )
}