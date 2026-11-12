import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, getOptions } from '../api/client.js'
import { Alert, Field, ImageInput, Select, Spinner, readFileAsDataUrl } from '../components/ui.jsx'

const DEFAULT_RULES = ['PONTOS', 'SALDO_GOLS', 'GOLS_PRO', 'CONFRONTO_DIRETO', 'CARTOES', 'SORTEIO']

const EMPTY = {
  name: '', category: null, gender: null, type: 'AMADOR', privacy: 'PUBLICO',
  matchDurationMinutes: 20, description: '', image: null,
  numberOfTeams: 8, minTeams: '', maxTeams: '', minPlayersPerSquad: '', maxPlayersPerSquad: '',
  regulationText: '', regulationFile: null, regulationFileName: null,
  format: null,
  knockoutTwoLegged: false, finalTwoLegged: false, awayGoals: false, knockoutTiebreaker: 'PENALTIS',
  returnLeg: false, formatDescription: '', tiebreakRules: DEFAULT_RULES,
  groupCount: 2, maxTeamsPerGroup: '',
}

const FORMAT_HELP = {
  MATA_MATA: 'Confrontos eliminatórios até a final.',
  PONTOS_CORRIDOS: 'Todos contra todos; campeão é quem somar mais pontos.',
  GRUPOS_MATA_MATA: 'Grupos em todos contra todos; os 2 melhores de cada grupo vão para o mata-mata.',
}

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

export default function TournamentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [options, setOptions] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    getOptions().then(setOptions).catch((e) => setError(e.message))
    if (id) {
      api.get(`/tournaments/${id}`).then((t) => {
        setLocked(t.status === 'SORTEADO')
        setForm({
          ...EMPTY, ...Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v ?? EMPTY[k] ?? ''])),
          tiebreakRules: t.tiebreakRules?.length ? t.tiebreakRules : DEFAULT_RULES,
          knockoutTiebreaker: t.knockoutTiebreaker || 'PENALTIS',
          groupCount: t.groupCount ?? 2,
        })
      }).catch((e) => setError(e.message))
    }
  }, [id])

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }))
  const setE = (k) => (e) => set(k)(e.target.type === 'checkbox' ? e.target.checked : e.target.value)

  const n = Number(form.numberOfTeams) || 0
  const g = Number(form.groupCount) || 0
  const perGroup = g > 0 ? Math.ceil(n / g) : 0
  const maxDuration = form.type === 'AMADOR' ? 60 : 20
  const anyTwoLegs = form.knockoutTwoLegged || form.finalTwoLegged

  function moveRule(i, dir) {
    const rules = [...form.tiebreakRules]
    const j = i + dir
    if (j < 0 || j >= rules.length) return
    ;[rules[i], rules[j]] = [rules[j], rules[i]]
    set('tiebreakRules')(rules)
  }

  async function onPdf(e) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.type !== 'application/pdf') { setError('O regulamento deve ser um arquivo PDF.'); return }
    if (f.size > 5 * 1024 * 1024) { setError('O PDF do regulamento deve ter no máximo 5 MB.'); return }
    const data = await readFileAsDataUrl(f)
    setForm((x) => ({ ...x, regulationFile: data, regulationFileName: f.name }))
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    if (!form.format) { setError('Escolha o formato do torneio.'); return }
    setBusy(true)
    const body = {
      ...form,
      matchDurationMinutes: numOrNull(form.matchDurationMinutes),
      numberOfTeams: numOrNull(form.numberOfTeams),
      minTeams: numOrNull(form.minTeams),
      maxTeams: numOrNull(form.maxTeams),
      minPlayersPerSquad: numOrNull(form.minPlayersPerSquad),
      maxPlayersPerSquad: numOrNull(form.maxPlayersPerSquad),
      groupCount: form.format === 'GRUPOS_MATA_MATA' ? numOrNull(form.groupCount) : null,
      maxTeamsPerGroup: form.format === 'GRUPOS_MATA_MATA' ? numOrNull(form.maxTeamsPerGroup) : null,
    }
    try {
      const saved = id ? await api.put(`/tournaments/${id}`, body) : await api.post('/tournaments', body)
      navigate(`/torneios/${saved.id}${id ? '' : '/equipes'}`)
    } catch (err) {
      setError(err.message)
      setFieldErrors(err.fields || {})
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setBusy(false)
    }
  }

  if (!options) return <Spinner />

  return (
    <form className="form-page" onSubmit={submit}>
      <div className="section-head">
        <h1>{id ? 'Editar torneio' : 'Novo torneio'}</h1>
        <Link to={id ? `/torneios/${id}` : '/'} className="btn btn-secondary">Cancelar</Link>
      </div>
      <Alert>{error}</Alert>
      {locked && <Alert kind="info">O sorteio já foi feito: formato, grupos e quantidade de equipes ficam bloqueados até desfazer o sorteio.</Alert>}

      <fieldset className="card">
        <legend>Informações gerais</legend>
        <div className="grid-2">
          <Field label="Nome do torneio" required error={fieldErrors.name} className="span-2">
            <input value={form.name} onChange={setE('name')} maxLength={150} required />
          </Field>
          <Field label="Categoria" required error={fieldErrors.category}>
            <Select options={options.categories} value={form.category} onChange={set('category')} required />
          </Field>
          <Field label="Gênero" required error={fieldErrors.gender}>
            <Select options={options.genders} value={form.gender} onChange={set('gender')} required />
          </Field>
          <Field label="Tipo" required>
            <Select options={options.types} value={form.type} onChange={set('type')} required />
          </Field>
          <Field label="Privacidade" required>
            <Select options={options.privacies} value={form.privacy} onChange={set('privacy')} required />
          </Field>
          <Field label="Tempo de jogo padrão (minutos)" required error={fieldErrors.matchDurationMinutes}
                 hint={form.type === 'AMADOR' ? 'Torneios amadores podem ter tempo diferente (até 60 min).' : 'Máximo de 20 minutos.'}>
            <input type="number" min={1} max={maxDuration} value={form.matchDurationMinutes} onChange={setE('matchDurationMinutes')} required />
          </Field>
          <Field label="Imagem do torneio">
            <ImageInput value={form.image} onChange={set('image')} max={1200} />
          </Field>
          <Field label="Descrição" className="span-2">
            <textarea rows={3} value={form.description || ''} onChange={setE('description')} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="card">
        <legend>Equipes e relacionados</legend>
        <div className="grid-2">
          <Field label="Quantidade de equipes do torneio" required error={fieldErrors.numberOfTeams}
                 hint="Quantas equipes vão participar e serão sorteadas.">
            <input type="number" min={2} max={64} value={form.numberOfTeams} onChange={setE('numberOfTeams')} required disabled={locked} />
          </Field>
          <div />
          <Field label="Nº mínimo de equipes"><input type="number" min={2} value={form.minTeams ?? ''} onChange={setE('minTeams')} /></Field>
          <Field label="Nº máximo de equipes"><input type="number" min={2} value={form.maxTeams ?? ''} onChange={setE('maxTeams')} /></Field>
          <Field label="Mín. de jogadores por relacionado"><input type="number" min={1} value={form.minPlayersPerSquad ?? ''} onChange={setE('minPlayersPerSquad')} /></Field>
          <Field label="Máx. de jogadores por relacionado"><input type="number" min={1} value={form.maxPlayersPerSquad ?? ''} onChange={setE('maxPlayersPerSquad')} /></Field>
        </div>
      </fieldset>

      <fieldset className="card">
        <legend>Regulamento</legend>
        <div className="grid-2">
          <Field label="Arquivo PDF" hint="Envie o regulamento em PDF (até 5 MB).">
            <div className="file-row">
              <label className="btn btn-secondary btn-sm">
                {form.regulationFile ? 'Trocar PDF' : 'Escolher PDF'}
                <input type="file" accept="application/pdf" hidden onChange={onPdf} />
              </label>
              {form.regulationFileName && <span className="small">{form.regulationFileName}</span>}
              {form.regulationFile && (
                <button type="button" className="btn btn-link btn-sm"
                        onClick={() => setForm((x) => ({ ...x, regulationFile: null, regulationFileName: null }))}>Remover</button>
              )}
            </div>
          </Field>
          <Field label="Observações do regulamento" className="span-2">
            <textarea rows={3} value={form.regulationText || ''} onChange={setE('regulationText')} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="card">
        <legend>Formato</legend>
        <div className="format-options">
          {options.formats.map((f) => (
            <label key={f.value} className={`format-option ${form.format === f.value ? 'selected' : ''} ${locked ? 'disabled' : ''}`}>
              <input type="radio" name="format" value={f.value} checked={form.format === f.value}
                     onChange={() => set('format')(f.value)} disabled={locked} />
              <strong>{f.label}</strong>
              <span className="small muted">{FORMAT_HELP[f.value]}</span>
            </label>
          ))}
        </div>

        {form.format === 'GRUPOS_MATA_MATA' && (
          <>
            <h4>1ª fase – grupos</h4>
            <div className="grid-2">
              <Field label="Quantidade de grupos" required error={fieldErrors.groupCount}
                     hint={g > 0 && n > 0 ? `${n} equipes em ${g} grupos ≈ ${perGroup} por grupo. Classificam ${g * 2} equipes.` : 'Mínimo fixo de 2 times por grupo.'}>
                <input type="number" min={1} max={Math.max(1, Math.floor(n / 2))} value={form.groupCount} onChange={setE('groupCount')} disabled={locked} required />
              </Field>
              <Field label="Máximo de times por grupo" hint={`Deixe vazio para usar ${perGroup || '—'}.`}>
                <input type="number" min={2} value={form.maxTeamsPerGroup ?? ''} onChange={setE('maxTeamsPerGroup')} />
              </Field>
              <Field label="Jogos na fase de grupos">
                <select value={form.returnLeg ? '1' : '0'} onChange={(e) => set('returnLeg')(e.target.value === '1')}>
                  <option value="0">Turno único</option>
                  <option value="1">Turno e returno</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {form.format === 'PONTOS_CORRIDOS' && (
          <div className="grid-2">
            <Field label="Returno?">
              <select value={form.returnLeg ? '1' : '0'} onChange={(e) => set('returnLeg')(e.target.value === '1')}>
                <option value="0">Não – turno único</option>
                <option value="1">Sim – turno e returno</option>
              </select>
            </Field>
          </div>
        )}

        {(form.format === 'PONTOS_CORRIDOS' || form.format === 'GRUPOS_MATA_MATA') && (
          <>
            <h4>Critérios de desempate</h4>
            <p className="small muted">Ordene pela prioridade. Vitória = 3 pontos, empate = 1, derrota = 0.</p>
            <ol className="rule-list">
              {form.tiebreakRules.map((r, i) => (
                <li key={r}>
                  <span>{options.tiebreakRules.find((o) => o.value === r)?.label}</span>
                  <span className="rule-actions">
                    <button type="button" className="btn btn-icon" onClick={() => moveRule(i, -1)} disabled={i === 0} aria-label="Subir">↑</button>
                    <button type="button" className="btn btn-icon" onClick={() => moveRule(i, 1)} disabled={i === form.tiebreakRules.length - 1} aria-label="Descer">↓</button>
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}

        {(form.format === 'MATA_MATA' || form.format === 'GRUPOS_MATA_MATA') && (
          <>
            <h4>{form.format === 'GRUPOS_MATA_MATA' ? '2ª fase – mata-mata' : 'Mata-mata'}</h4>
            <div className="grid-2">
              <Field label="Confrontos">
                <select value={form.knockoutTwoLegged ? '1' : '0'} onChange={(e) => set('knockoutTwoLegged')(e.target.value === '1')}>
                  <option value="0">Jogo único</option>
                  <option value="1">Ida e volta</option>
                </select>
              </Field>
              <Field label="Final">
                <select value={form.finalTwoLegged ? '1' : '0'} onChange={(e) => set('finalTwoLegged')(e.target.value === '1')}>
                  <option value="0">Jogo único</option>
                  <option value="1">Ida e volta</option>
                </select>
              </Field>
              <Field label="Critério de desempate">
                <Select options={options.knockoutTiebreakers} value={form.knockoutTiebreaker} onChange={set('knockoutTiebreaker')} />
              </Field>
              {anyTwoLegs && (
                <label className="check">
                  <input type="checkbox" checked={form.awayGoals} onChange={setE('awayGoals')} /> Gol fora como critério de desempate
                </label>
              )}
            </div>
          </>
        )}

        {form.format && (
          <Field label="Descrição do formato">
            <textarea rows={2} value={form.formatDescription || ''} onChange={setE('formatDescription')} />
          </Field>
        )}
      </fieldset>

      <div className="form-actions">
        <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Salvando...' : id ? 'Salvar alterações' : 'Criar torneio'}</button>
      </div>
    </form>
  )
}
