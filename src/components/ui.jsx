import { useRef } from 'react'

export function Field({ label, hint, error, required, children, className = '' }) {
  return (
    <label className={`field ${error ? 'has-error' : ''} ${className}`}>
      <span className="field-label">{label}{required && <span className="req"> *</span>}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  )
}

export function Select({ options, value, onChange, placeholder = 'Selecione...', ...rest }) {
  return (
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} {...rest}>
      <option value="">{placeholder}</option>
      {options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function Alert({ kind = 'error', children }) {
  if (!children) return null
  return <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>{children}</div>
}

export function Spinner() {
  return <div className="spinner" aria-label="Carregando" />
}

export function TeamBadge({ name, logo, size = 40 }) {
  const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
  return logo
    ? <img className="badge-img" src={logo} alt="" style={{ width: size, height: size }} />
    : <span className="badge-initials" style={{ width: size, height: size, fontSize: size * 0.38 }}>{initials}</span>
}

/** Lê uma imagem e reduz para no máximo `max` px, devolvendo um data URL JPEG/PNG. */
function resizeImage(file, max) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        const png = file.type === 'image/png' || file.type === 'image/svg+xml'
        resolve(canvas.toDataURL(png ? 'image/png' : 'image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function ImageInput({ value, onChange, max = 400, round = false }) {
  const ref = useRef()
  return (
    <div className="image-input">
      {value
        ? <img src={value} alt="" className={round ? 'round' : ''} />
        : <div className={`image-placeholder ${round ? 'round' : ''}`}>Sem imagem</div>}
      <div className="image-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => ref.current.click()}>
          {value ? 'Trocar' : 'Escolher imagem'}
        </button>
        {value && <button type="button" className="btn btn-link btn-sm" onClick={() => onChange(null)}>Remover</button>}
      </div>
      <input ref={ref} type="file" accept="image/*" hidden onChange={async (e) => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (f) onChange(await resizeImage(f, max))
      }} />
    </div>
  )
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
