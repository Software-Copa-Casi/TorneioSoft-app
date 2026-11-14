import { useRef, useState } from 'react'

const MAX_IMAGE_CHARS = 1_900_000


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

/**
 * Lê uma imagem e reduz para no máximo `max` px, devolvendo um data URL PNG ou JPEG
 * (os únicos formatos, junto com WebP, que a API aceita). PNG que passe do limite vira JPEG.
 */
function resizeImage(file, max) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('Escolha um arquivo de imagem (PNG, JPEG ou WebP).')); return }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Não foi possível abrir a imagem. Use PNG, JPEG ou WebP.'))
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale) || 1
        canvas.height = Math.round(img.height * scale) || 1
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        const png = file.type === 'image/png' || file.type === 'image/svg+xml'
        let url = png ? canvas.toDataURL('image/png') : ''
        for (const q of [0.85, 0.7, 0.5]) {
          if (url && url.length <= MAX_IMAGE_CHARS) break
          url = canvas.toDataURL('image/jpeg', q)
        }
        if (url.length > MAX_IMAGE_CHARS) reject(new Error('Imagem muito grande. Use uma imagem de até 1,5 MB.'))
        else resolve(url)
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

export function ImageInput({ value, onChange, max = 400, round = false }) {
  const ref = useRef()
  const [error, setError] = useState('')
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
      {error && <span className="field-error">{error}</span>}
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={async (e) => {
        const f = e.target.files?.[0]
        e.target.value = ''
        if (!f) return
        try {
          onChange(await resizeImage(f, max))
          setError('')
        } catch (err) {
          setError(err.message)
        }
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
export function PasswordInput(props) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        style={{ paddingRight: '4.5rem', width: '100%', ...props.style }}
      />
      <button
        type="button"
        className="btn btn-link btn-sm"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        style={{ position: 'absolute', right: '0.5rem' }}
      >
        {visible ? 'Ocultar' : 'Mostrar'}
      </button>
    </div>
  )
}
