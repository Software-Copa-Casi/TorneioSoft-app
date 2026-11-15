const BASE = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'copacasi.token'

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* armazenamento indisponível */ }
}

export class ApiError extends Error {
  constructor(message, status, fields, code) {
    super(message)
    this.status = status
    this.fields = fields || {}
    this.code = code // ex.: 'EMAIL_NOT_VERIFIED' no login
  }
}

async function request(method, path, body) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let res
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError('Não foi possível conectar ao servidor.', 0)
  }
  if (res.status === 401 && token && path !== '/auth/login') {
    setToken(null)
    window.dispatchEvent(new Event('copacasi:logout'))
    throw new ApiError('Sua sessão expirou. Entre novamente.', 401)
  }
  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(data?.message || fallbackMessage(res), res.status, data?.fields, data?.code)
  return data
}

/** Mensagem para quando a API não manda uma (ex.: erro do servidor ou do proxy). */
function fallbackMessage(res) {
  switch (res.status) {
    case 403: return 'Você não tem permissão para fazer isso.'
    case 404: return 'Não encontrado.'
    case 413: return 'O arquivo enviado é grande demais.'
    case 429: {
      const s = Number(res.headers.get('Retry-After'))
      const quando = s > 0 ? `em ${Math.ceil(s / 60)} min` : 'em alguns minutos'
      return `Muitas tentativas. Tente de novo ${quando}.`
    }
    default: return res.status >= 500 ? 'Erro no servidor. Tente de novo em instantes.' : `Erro ${res.status}`
  }
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b),
  del: (p) => request('DELETE', p),
}

let optionsCache
export async function getOptions() {
  if (!optionsCache) optionsCache = api.get('/tournaments/options').catch((e) => { optionsCache = null; throw e })
  return optionsCache
}

export function labelOf(list, value) {
  return list?.find((o) => o.value === value)?.label ?? value
}
