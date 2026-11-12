import { useState } from 'react'
import Dialog from './Dialog.jsx'
import { Alert, Field, TeamBadge } from '../ui.jsx'

/**
 * Registro de gol. A equipe escolhida é a que recebe o gol no placar.
 * Com "gol contra" marcado, a lista de autores passa a mostrar os jogadores da equipe adversária
 * e a assistência deixa de existir.
 */
export default function GoalDialog({ live, onSubmit, onClose }) {
  const [teamId, setTeamId] = useState(null)
  const [ownGoal, setOwnGoal] = useState(false)
  const [scorerId, setScorerId] = useState('')
  const [assistId, setAssistId] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const scoring = teamId === live.home.teamId ? live.home : teamId === live.away.teamId ? live.away : null
  const opponent = scoring && (scoring === live.home ? live.away : live.home)
  const available = (squad) => squad?.players.filter((p) => !p.sentOff) ?? []
  const scorerOptions = scoring ? available(ownGoal ? opponent : scoring) : []
  const assistOptions = scoring && !ownGoal ? available(scoring).filter((p) => String(p.id) !== scorerId) : []

  function pickTeam(id) {
    setTeamId(id)
    setScorerId('')
    setAssistId('')
  }

  async function submit(e) {
    e.preventDefault()
    if (!scoring) { setError('Escolha a equipe que marcou.'); return }
    if (!scorerId) { setError('Escolha o jogador que fez o gol.'); return }
    setBusy(true)
    setError('')
    try {
      await onSubmit({
        teamId,
        scorerId: Number(scorerId),
        assistId: !ownGoal && assistId ? Number(assistId) : null,
        ownGoal,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title="Registrar gol" onClose={onClose}>
      <form onSubmit={submit} className="dialog-form">
        <Alert>{error}</Alert>
        <div className="field">
          <span className="field-label">Equipe que marcou <span className="req">*</span></span>
          <div className="team-picker">
            {[live.home, live.away].map((s) => (
              <button type="button" key={s.teamId} className={`team-pick ${teamId === s.teamId ? 'on' : ''}`} onClick={() => pickTeam(s.teamId)}>
                <TeamBadge name={s.name} logo={s.logo} size={36} />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="check">
          <input type="checkbox" checked={ownGoal} onChange={(e) => { setOwnGoal(e.target.checked); setScorerId(''); setAssistId('') }} />
          Foi gol contra
        </label>

        <Field label={ownGoal && opponent ? `Autor do gol contra (jogador do ${opponent.name})` : 'Jogador que fez o gol'} required>
          <select value={scorerId} onChange={(e) => { setScorerId(e.target.value); if (e.target.value === assistId) setAssistId('') }} disabled={!scoring} required>
            <option value="">{scoring ? 'Selecione...' : 'Escolha a equipe primeiro'}</option>
            {scorerOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>

        {!ownGoal && (
          <Field label="Assistência (opcional)">
            <select value={assistId} onChange={(e) => setAssistId(e.target.value)} disabled={!scoring}>
              <option value="">Sem assistência</option>
              {assistOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Salvando...' : 'Confirmar gol'}</button>
        </div>
      </form>
    </Dialog>
  )
}
