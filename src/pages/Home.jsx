import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, getOptions, labelOf } from '../api/client.js'
import { useAuth } from '../auth.jsx'
import { Alert, Spinner } from '../components/ui.jsx'

export default function Home() {
  const { user } = useAuth()
  const [tournaments, setTournaments] = useState(null)
  const [options, setOptions] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get('/tournaments'), getOptions()])
      .then(([t, o]) => { setTournaments(t); setOptions(o) })
      .catch((e) => setError(e.message))
  }, [])

  const visible = tournaments?.filter((t) => user || t.privacy === 'PUBLICO')

  return (
    <>
      <section className="hero">
        <div>
          <h1>Torneios de futsal organizados do sorteio à final</h1>
          <p>Crie o torneio, cadastre equipes e jogadores, faça o sorteio ao vivo e gere as rodadas automaticamente.</p>
          {user
            ? <Link to="/torneios/novo" className="btn btn-accent btn-lg">Criar torneio</Link>
            : <Link to="/entrar" className="btn btn-accent btn-lg">Entrar para organizar</Link>}
        </div>
      </section>

      <section>
        <div className="section-head">
          <h2>Torneios</h2>
          {user && <Link to="/torneios/novo" className="btn btn-primary">Novo torneio</Link>}
        </div>
        <Alert>{error}</Alert>
        {!tournaments && !error && <Spinner />}
        {visible && visible.length === 0 && (
          <div className="empty">
            <p>Nenhum torneio cadastrado ainda.</p>
            {user && <Link to="/torneios/novo" className="btn btn-primary">Criar o primeiro torneio</Link>}
          </div>
        )}
        <div className="card-grid">
          {visible?.map((t) => (
            <Link key={t.id} to={`/torneios/${t.id}`} className="card tournament-card">
              <div className="tournament-cover" style={t.image ? { backgroundImage: `url(${t.image})` } : undefined}>
                <span className={`status status-${t.status}`}>{t.status === 'SORTEADO' ? 'Sorteado' : 'Em configuração'}</span>
              </div>
              <div className="card-body">
                <h3>{t.name}</h3>
                <p className="muted">
                  {labelOf(options?.categories, t.category)} · {labelOf(options?.genders, t.gender)} · {labelOf(options?.formats, t.format)}
                </p>
                <div className="progress" aria-label="Equipes cadastradas">
                  <div style={{ width: `${Math.min(100, (t.teamCount / t.numberOfTeams) * 100)}%` }} />
                </div>
                <p className="small muted">{t.teamCount} de {t.numberOfTeams} equipes</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
