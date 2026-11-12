import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TeamBadge } from './ui.jsx'
import { DrawResult } from '../pages/tabs/DrawTab.jsx'

const COUNTDOWN_FROM = 3

/** Apresentação do sorteio: contagem regressiva e revelação lenta das equipes, uma por vez. */
export default function DrawShow({ tournament, draw, intervalMs = 3000, onClose }) {
  const navigate = useNavigate()
  const [count, setCount] = useState(COUNTDOWN_FROM)
  const [shown, setShown] = useState(0)
  const total = draw.reveals.length
  const phase = count > 0 ? 'countdown' : shown < total ? 'reveal' : 'done'

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  useEffect(() => {
    if (phase === 'countdown') {
      const t = setTimeout(() => setCount((c) => c - 1), 1000)
      return () => clearTimeout(t)
    }
    if (phase === 'reveal') {
      const t = setTimeout(() => setShown((s) => s + 1), shown === 0 ? 400 : intervalMs)
      return () => clearTimeout(t)
    }
  }, [phase, count, shown, intervalMs])

  const current = shown > 0 ? draw.reveals[shown - 1] : null
  const revealed = draw.reveals.slice(0, shown)

  return (
    <div className="draw-show" role="dialog" aria-modal="true" aria-label="Apresentação do sorteio">
      <div className="draw-show-top">
        <span>{tournament.name}</span>
        <div className="btn-row">
          {phase !== 'done' && <button className="btn btn-ghost-light btn-sm" onClick={() => { setCount(0); setShown(total) }}>Pular animação</button>}
          <button className="btn btn-ghost-light btn-sm" onClick={onClose}>Fechar</button>
        </div>
      </div>

      {phase === 'countdown' && (
        <div className="countdown">
          <p>O sorteio começa em</p>
          <div key={count} className="countdown-number">{count}</div>
        </div>
      )}

      {phase !== 'countdown' && (
        <div className="draw-stage">
          <div className="spotlight">
            {phase === 'reveal' && current && (
              <div key={current.teamId} className="spotlight-card">
                <p className="eyebrow">{shown}ª equipe sorteada</p>
                <TeamBadge name={current.teamName} logo={current.logo} size={120} />
                <h2>{current.teamName}</h2>
                {current.groupName && <p className="group-tag">Grupo {current.groupName}</p>}
              </div>
            )}
            {phase === 'done' && (
              <div className="done-box">
                <h2>Sorteio concluído!</h2>
                <p>As rodadas já foram geradas.</p>
                <div className="btn-row center">
                  <button className="btn btn-accent" onClick={() => { onClose(); navigate(`/torneios/${tournament.id}/jogos`) }}>Ver rodadas</button>
                  <button className="btn btn-ghost-light" onClick={onClose}>Fechar</button>
                </div>
              </div>
            )}
          </div>
          <div className="board">
            <DrawResult draw={draw} revealed={revealed} />
          </div>
        </div>
      )}
      <div className="draw-progress"><div style={{ width: `${(shown / total) * 100}%` }} /></div>
    </div>
  )
}
