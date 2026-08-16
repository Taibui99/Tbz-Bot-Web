const TOKEN_KEY = 'tbz_admin_token'

export class ApiAuthError extends Error {
  constructor() {
    super('Cần đăng nhập quản trị')
    this.name = 'ApiAuthError'
  }
}

export function getToken(): string {
  if (typeof window === 'undefined') return ''
  return sessionStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
}

export function isAuthConfigured() {
  return typeof window !== 'undefined' && Boolean(sessionStorage.getItem('tbz_auth_required'))
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  const token = getToken()
  if (token) headers.set('x-admin-token', token)
  const res = await fetch(path, { cache: 'no-store', ...init, headers })
  if (res.status === 401) throw new ApiAuthError()
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text.slice(0, 200) || `Lỗi ${res.status}`)
  }
  return res.json() as Promise<T>
}