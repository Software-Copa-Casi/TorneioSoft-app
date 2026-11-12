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
  constructor(message, status, fields) {
    super(message)
    this.status = status
    this.fields = fields || {}
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
  if (!res.ok) throw new ApiError(data?.message || `Erro ${res.status}`, res.status, data?.fields)
  return data
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
