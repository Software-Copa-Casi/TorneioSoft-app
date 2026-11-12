import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, getOptions, labelOf } from '../api/client.js'
import { useAuth } from '../auth.jsx'
import { Alert, Field, ImageInput, Select, Spinner, TeamBadge } from '../components/ui.jsx'

const EMPTY = { name: '', documentType: 'CPF', document: '', email: '', birthDate: '', gender: null, positions: [], photo: null }

function formatCpf(v) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function age(birth) {
  const b = new Date(birth + 'T00:00:00')
  const n = new Date()
  let a = n.getFullYear() - b.getFullYear()
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--
  return a
}

export default function TeamDetail() {
  const { id, teamId } = useParams()
  const { user } = useAuth()
  const [tournament, setTournament] = useState(null)
  const [team, setTeam] = useState(null)
  const [players, setPlayers] = useState(null)
  const [options, setOptions] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)

  const base = `/tournaments/${id}/teams/${teamId}`
  const loadPlayers = () => api.get(`${base}/players`).then(setPlayers)

  useEffect(() => {
    Promise.all([api.get(`/tournaments/${id}`), api.get(base), getOptions(), loadPlayers()])
      .then(([t, tm, o]) => { setTournament(t); setTeam(tm); setOptions(o) })
      .catch((e) => setError(e.message))
  }, [id, teamId]) // eslint-disable-line react-hooks/exhaustive-deps

  const max = tournament?.maxPlayersPerSquad
  const full = max && players && players.length >= max
  const showForm = user && (editing || !full)

  function togglePosition(p) {
    setForm((f) => ({ ...f, positions: f.positions.includes(p) ? f.positions.filter((x) => x !== p) : [...f.positions, p] }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (form.positions.length === 0) { setFieldErrors({ positions: 'Escolha ao menos uma posição' }); return }
    setBusy(true)
    try {
      if (editing) await api.put(`${base}/players/${editing}`, form)
      else await api.post(`${base}/players`, form)
      setForm(EMPTY)
      setEditing(null)
      await loadPlayers()
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fields || {})
    } finally {
      setBusy(false)
    }
  }

  async function remove(p) {
    if (!confirm(`Remover ${p.name} da equipe?`)) return
    try {
      await api.del(`${base}/players/${p.id}`)
      await loadPlayers()
    } catch (e) {
      setError(e.message)
    }
  }

  if (error && !team) return <Alert>{error}</Alert>
  if (!team || !players || !options) return <Spinner />

  return (
    <>
      <p className="breadcrumb">
        <Link to={`/torneios/${id}`}>{tournament.name}</Link> › <Link to={`/torneios/${id}/equipes`}>Equipes</Link> › {team.name}
      </p>
      <div className="team-header card">
        <TeamBadge name={team.name} logo={team.logo} size={72} />
        <div>
          <h1>{team.name}</h1>
          <p className="muted">
            {players.length} jogador{players.length === 1 ? '' : 'es'}{max ? ` de no máximo ${max}` : ''}
            {team.groupName ? ` · Grupo ${team.groupName}` : ''}{team.email ? ` · ${team.email}` : ''}
          </p>
          {team.description && <p>{team.description}</p>}
        </div>
      </div>

      <div className="teams-layout">
        <div>
          <h2>Jogadores</h2>
          {players.length === 0 && <div className="empty"><p>Nenhum jogador cadastrado.</p></div>}
          <ul className="player-list">
            {players.map((p) => (
              <li key={p.id} className="card player-item">
                {p.photo ? <img src={p.photo} alt="" className="player-photo" /> : <TeamBadge name={p.name} size={48} />}
                <div className="team-info">
                  <strong>{p.name}</strong>
                  <span className="small muted">
                    {p.positions.map((x) => labelOf(options.positions, x)).join(', ')} · {age(p.birthDate)} anos · {labelOf(options.playerGenders, p.gender)}
                  </span>
                  {user && <span className="small muted">{p.documentType}: {p.documentType === 'CPF' ? formatCpf(p.document) : p.document}</span>}
                </div>
                {user && (
                  <div className="team-actions">
                    <button className="btn btn-link btn-sm" onClick={() => {
                      setEditing(p.id)
                      setForm({ ...EMPTY, ...p, email: p.email || '', document: p.documentType === 'CPF' ? formatCpf(p.document) : p.document })
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}>Editar</button>
                    <button className="btn btn-link btn-sm danger" onClick={() => remove(p)}>Remover</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {showForm && (
          <form className="card side-form" onSubmit={submit}>
            <h3>{editing ? 'Editar jogador' : 'Cadastrar jogador'}</h3>
            <Alert>{error}</Alert>
            <Field label="Nome" required error={fieldErrors.name}>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={150} />
            </Field>
            <div className="grid-doc">
              <Field label="Documento" required>
                <select value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value, document: '' })}>
                  {options.documentTypes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </Field>
              <Field label={form.documentType === 'CPF' ? 'Número do CPF' : `Número do ${form.documentType}`} required error={fieldErrors.document}
                     hint={form.documentType !== 'CPF' ? 'Para jogadores estrangeiros.' : undefined}>
                <input value={form.document} required inputMode={form.documentType === 'CPF' ? 'numeric' : 'text'}
                       onChange={(e) => setForm({ ...form, document: form.documentType === 'CPF' ? formatCpf(e.target.value) : e.target.value })} />
              </Field>
            </div>
            <Field label="Data de nascimento" required error={fieldErrors.birthDate}>
              <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} required />
            </Field>
            <Field label="Gênero" required error={fieldErrors.gender}>
              <Select options={options.playerGenders} value={form.gender} onChange={(gender) => setForm({ ...form, gender })} required />
            </Field>
            <Field label="E-mail" error={fieldErrors.email}>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <fieldset className={`positions ${fieldErrors.positions ? 'has-error' : ''}`}>
              <legend className="field-label">Posições <span className="req">*</span></legend>
              <div className="chips">
                {options.positions.map((p) => (
                  <label key={p.value} className={`chip ${form.positions.includes(p.value) ? 'on' : ''}`}>
                    <input type="checkbox" checked={form.positions.includes(p.value)} onChange={() => togglePosition(p.value)} />
                    {p.label}
                  </label>
                ))}
              </div>
              {fieldErrors.positions && <span className="field-error">{fieldErrors.positions}</span>}
            </fieldset>
            <Field label="Foto">
              <ImageInput value={form.photo} onChange={(photo) => setForm({ ...form, photo })} round />
            </Field>
            <div className="form-actions">
              {editing && <button type="button" className="btn btn-secondary" onClick={() => { setEditing(null); setForm(EMPTY) }}>Cancelar</button>}
              <button className="btn btn-primary" disabled={busy}>{busy ? 'Salvando...' : editing ? 'Salvar' : 'Adicionar jogador'}</button>
            </div>
          </form>
        )}
        {user && full && !editing && <Alert kind="info">A equipe atingiu o máximo de {max} jogadores.</Alert>}
      </div>
    </>
  )
}
