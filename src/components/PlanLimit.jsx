import { Link } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

/** O usuário ainda pode criar torneio? Root e plano Pro sempre podem; enquanto o plano carrega, deixa. */
export function useCanCreateTournament() {
  const { user, plan } = useAuth()
  if (!user) return false
  if (user.role === 'ROOT' || !plan) return true
  return plan.canCreateTournament
}

/** Selo do plano ao lado do nome, na barra do topo. */
export function PlanBadge() {
  const { user, plan } = useAuth()
  if (!user || user.role === 'ROOT') return null
  const p = plan?.plan || user.plan || 'FREE'
  return <span className={`plan-badge plan-${p}`}>{p === 'PRO' ? 'Pro' : 'Gratuito'}</span>
}

/** Aviso de que o plano gratuito chegou ao limite de torneios, com o convite para o Pro. */
export function PlanLimitNotice({ message, compact = false }) {
  const { plan } = useAuth()
  const limit = plan?.tournamentLimit ?? 1
  const text = message || `No plano gratuito você pode organizar ${limit === 1 ? '1 torneio' : `${limit} torneios`} por vez. ` +
    'Quando o torneio atual terminar (todas as partidas encerradas), ou se você apagá-lo, a vaga é liberada.'
  return (
    <div className={`plan-limit card ${compact ? 'plan-limit-compact' : ''}`} role="status">
      <div>
        <p className="eyebrow">Plano gratuito</p>
        <h3>Você chegou ao limite de torneios</h3>
        <p className="muted">{text}</p>
        <p className="small muted">Com o plano Pro você organiza quantos torneios quiser ao mesmo tempo.</p>
      </div>
      <div className="plan-limit-actions">
        <span className="btn btn-accent" aria-disabled="true" title="Em breve">Plano Pro em breve</span>
        <Link to="/?escopo=meus" className="btn btn-secondary">Ver meus torneios</Link>
      </div>
    </div>
  )
}
