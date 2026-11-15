import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, labelOf } from '../../api/client.js'
import { Alert, Spinner, TeamBadge } from '../../components/ui.jsx'

const REFRESH_MS = 15000
const FORM_LABEL = { V: 'Vitória', E: 'Empate', D: 'Derrota' }

/** Aba Classificação: tabela de pontos corridos ou uma tabela por grupo. */
export default function StandingsTab({ tournament, options }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [live, setLive] = useState(true)

  const load = useCallback(() =>
    api.get(`/tournaments/${tournament.id}/standings${live ? '?aoVivo=true' : ''}`)
      .then((d) => { setData(d); setError('') })
      .catch((e) => setError(e.message)), [tournament.id, live])

  useEffect(() => { load() }, [load])

  // atualiza sozinha enquanto a aba está aberta
  useEffect(() => {
    const t = setInterval(() => { if (!document.hidden) load() }, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  if (error && !data) return <Alert>{error}</Alert>
  if (!data) return <Spinner />

  if (!data.available) {
    return (
      <div className="empty">
        <p>{data.message}</p>
        <Link to={`/torneios/${tournament.id}/jogos`} className="btn btn-primary">Ver rodadas</Link>
      </div>
    )
  }

  if (data.tables.length === 0) {
    return (
      <div className="empty">
        <p>Nenhuma equipe cadastrada ainda. A tabela aparece zerada assim que as equipes forem cadastradas.</p>
        <Link to={`/torneios/${tournament.id}/equipes`} className="btn btn-primary">Cadastrar equipes</Link>
      </div>
    )
  }

  // antes do sorteio dos grupos as equipes vêm numa tabela única, sem grupo
  const isGroups = data.tables.some((t) => t.groupName)
  const anyLive = data.tables.some((t) => t.rows.some((r) => r.playingNow))

  return (
    <div>
      <div className="section-head">
        <h2>Classificação <span className="muted">({data.matchesCounted} de {data.matchesTotal} jogos)</span></h2>
        <label className="check standings-toggle">
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
          Incluir jogos em andamento
        </label>
      </div>
      <Alert>{error}</Alert>
      {live && anyLive && <p className="small live-note"><span className="live-dot" /> A tabela considera o placar atual dos jogos em andamento.</p>}

      <div className={isGroups ? 'standings-groups' : ''}>
        {data.tables.map((table) => (
          <section key={table.groupName ?? 'liga'} className="card standings-card">
            {isGroups && <h3>Grupo {table.groupName}</h3>}
            <div className="table-scroll">
              <table className="standings">
                <thead>
                  <tr>
                    <th className="pos" title="Posição">#</th>
                    <th className="team">Equipe</th>
                    <th title="Pontos">P</th>
                    <th title="Jogos">J</th>
                    <th title="Vitórias">V</th>
                    <th title="Empates">E</th>
                    <th title="Derrotas">D</th>
                    <th title="Gols pró" className="opt">GP</th>
                    <th title="Gols contra" className="opt">GC</th>
                    <th title="Saldo de gols">SG</th>
                    <th title="Cartões amarelos" className="opt"><span className="card-icon yellow" /></th>
                    <th title="Cartões vermelhos" className="opt"><span className="card-icon red" /></th>
                    <th className="opt form-col">Últimos</th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((r) => (
                    <tr key={r.teamId} className={r.qualified ? 'qualified' : ''}>
                      <td className="pos"><span className="pos-num">{r.position}</span></td>
                      <td className="team">
                        <Link to={`/torneios/${tournament.id}/equipes/${r.teamId}`}>
                          <TeamBadge name={r.teamName} logo={r.logo} size={26} />
                          <span>{r.teamName}</span>
                        </Link>
                        {r.playingNow && <span className="live-badge" title="Jogando agora">AO VIVO</span>}
                      </td>
                      <td className="pts">{r.points}</td>
                      <td>{r.played}</td>
                      <td>{r.wins}</td>
                      <td>{r.draws}</td>
                      <td>{r.losses}</td>
                      <td className="opt">{r.goalsFor}</td>
                      <td className="opt">{r.goalsAgainst}</td>
                      <td>{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
                      <td className="opt">{r.yellowCards}</td>
                      <td className="opt">{r.redCards}</td>
                      <td className="opt form-col">
                        <span className="form">
                          {r.form.map((f, i) => <span key={i} className={`form-${f}`} title={FORM_LABEL[f]}>{f}</span>)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      <div className="standings-legend small muted">
        {isGroups && <p><span className="legend-q" /> Classificados para o mata-mata (2 melhores de cada grupo).</p>}
        <p>Vitória 3 pontos, empate 1, derrota 0. Critérios de desempate: {data.tiebreakRules.map((r) => labelOf(options?.tiebreakRules, r)).join(' › ')}.</p>
        <p>P pontos · J jogos · V vitórias · E empates · D derrotas · GP gols pró · GC gols contra · SG saldo de gols</p>
      </div>
    </div>
  )
}