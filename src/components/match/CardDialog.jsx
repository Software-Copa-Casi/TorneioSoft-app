import { useState } from 'react'
import Dialog from './Dialog.jsx'
import { Alert, Field, TeamBadge } from '../ui.jsx'

/** Registro de cartão amarelo ou vermelho. O segundo amarelo vira vermelho automaticamente na API. */
export default function CardDialog({ live, onSubmit, onClose }) {
  const [teamId, setTeamId] = useState(null)
  const [playerId, setPlayerId] = useState('')
  const [card, setCard] = useState('AMARELO')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const squad = teamId === live.home.teamId ? live.home : teamId === live.away.teamId ? live.away : null
  const players = squad?.players.filter((p) => !p.sentOff) ?? []
  const selected = players.find((p) => String(p.id) === playerId)

  async function submit(e) {
    e.preventDefault()
    if (!playerId) { setError('Escolha o jogador.'); return }
    setBusy(true)
    setError('')
    try {
      await onSubmit({ playerId: Number(playerId), card })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog title="Registrar cartão" onClose={onClose}>
      <form onSubmit={submit} className="dialog-form">
        <Alert>{error}</Alert>
        <div className="field">
          <span className="field-label">Equipe <span className="req">*</span></span>
          <div className="team-picker">
            {[live.home, live.away].map((s) => (
              <button type="button" key={s.teamId} className={`team-pick ${teamId === s.teamId ? 'on' : ''}`}
                      onClick={() => { setTeamId(s.teamId); setPlayerId('') }}>
                <TeamBadge name={s.name} logo={s.logo} size={36} />
                <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        <Field label="Jogador" required>
          <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} disabled={!squad} required>
            <option value="">{squad ? 'Selecione...' : 'Escolha a equipe primeiro'}</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.yellowCards ? ` (${p.yellowCards} amarelo)` : ''}</option>
            ))}
          </select>
        </Field>

        <div className="field">
          <span className="field-label">Cartão <span className="req">*</span></span>
          <div className="card-picker">
            <button type="button" className={`card-pick yellow ${card === 'AMARELO' ? 'on' : ''}`} onClick={() => setCard('AMARELO')}>
              <span className="card-icon yellow" /> Amarelo
            </button>
            <button type="button" className={`card-pick red ${card === 'VERMELHO' ? 'on' : ''}`} onClick={() => setCard('VERMELHO')}>
              <span className="card-icon red" /> Vermelho
            </button>
          </div>
        </div>
        {selected?.yellowCards > 0 && card === 'AMARELO' && (
          <Alert kind="info">{selected.name} já tem um amarelo: o segundo gera expulsão automática.</Alert>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" disabled={busy}>{busy ? 'Salvando...' : 'Confirmar cartão'}</button>
        </div>
      </form>
    </Dialog>
  )
}
