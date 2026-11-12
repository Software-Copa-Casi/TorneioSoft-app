import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client.js'
import { useAuth } from '../../auth.jsx'
import { Alert, Field, ImageInput, Spinner, TeamBadge } from '../../components/ui.jsx'

const EMPTY = { name: '', email: '', logo: null, description: '' }

export default function TeamsTab({ tournament, onChange }) {
  const { user } = useAuth()
  const [teams, setTeams] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const load = () => api.get(`/tournaments/${tournament.id}/teams`).then(setTeams).catch((e) => setError(e.message))
  useEffect(() => { load() }, [tournament.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const full = teams && teams.length >= tournament.numberOfTeams
  const drawn = tournament.status === 'SORTEADO'
  const showForm = user && (editing || (!full && !drawn))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setFieldErrors({})
    try {
      if (editing) await api.put(`/tournaments/${tournament.id}/teams/${editing}`, form)
      else await api.post(`/tournaments/${tournament.id}/teams`, form)
      setForm(EMPTY)
      setEditing(null)
      await load()
      onChange()
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fields || {})
    } finally {
      setBusy(false)
    }
  }

  async function remove(team) {
    if (!confirm(`Remover a equipe "${team.name}" e seus jogadores?`)) return
    try {
      await api.del(`/tournaments/${tournament.id}/teams/${team.id}`)
      await load()
      onChange()
    } catch (e) {
      setError(e.message)
    }
  }

  if (!teams) return <Spinner />

  return (
    <div className="teams-layout">
      <div>
        <div className="section-head">
          <h2>Equipes <span className="muted">({teams.length}/{tournament.numberOfTeams})</span></h2>
        </div>
        {full && !drawn && user && (
          <Alert kind="success">
            Todas as equipes foram cadastradas. <Link to={`/torneios/${tournament.id}/sorteio`}>Ir para o sorteio →</Link>
          </Alert>
        )}
        {teams.length === 0 && <div className="empty"><p>Nenhuma equipe cadastrada.</p></div>}
        <ul className="team-list">
          {teams.map((team) => (
            <li key={team.id} className="card team-item">
              <TeamBadge name={team.name} logo={team.logo} size={48} />
              <div className="team-info">
                <Link to={`/torneios/${tournament.id}/equipes/${team.id}`} className="team-name">{team.name}</Link>
                <span className="small muted">
                  {team.playerCount} jogador{team.playerCount === 1 ? '' : 'es'}
                  {team.groupName ? ` · Grupo ${team.groupName}` : ''}
                </span>
              </div>
              <div className="team-actions">
                <Link to={`/torneios/${tournament.id}/equipes/${team.id}`} className="btn btn-secondary btn-sm">Jogadores</Link>
                {user && <button className="btn btn-link btn-sm" onClick={() => {
                  setEditing(team.id)
                  setForm({ name: team.name, email: team.email || '', logo: team.logo, description: team.description || '' })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}>Editar</button>}
                {user && !drawn && <button className="btn btn-link btn-sm danger" onClick={() => remove(team)}>Remover</button>}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {showForm && (
        <form className="card side-form" onSubmit={submit}>
          <h3>{editing ? 'Editar equipe' : 'Cadastrar equipe'}</h3>
          <Alert>{error}</Alert>
          <Field label="Nome" required error={fieldErrors.name}>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={120} required />
          </Field>
          <Field label="E-mail" error={fieldErrors.email}>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Logo">
            <ImageInput value={form.logo} onChange={(logo) => setForm({ ...form, logo })} round />
          </Field>
          <Field label="Descrição">
            <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="form-actions">
            {editing && <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setForm(EMPTY) }}>Cancelar</button>}
            <button className="btn btn-primary" disabled={busy}>{busy ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar equipe'}</button>
          </div>
        </form>
      )}
    </div>
  )
}
