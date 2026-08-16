import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const baseUrl = () => process.env.BOT_API_URL?.replace(/\/$/, '') || ''

function adminToken() {
  return process.env.ADMIN_TOKEN?.trim() || ''
}

/**
 * Chặn nếu web được cấu hình ADMIN_TOKEN (biến môi trường trên Vercel) mà
 * request không gửi kèm đúng token. Trả NextResponse lỗi hoặc null (cho qua).
 * Lớp này bảo vệ các API route của web; bot lại tự bảo vệ nội bộ nếu người
 * dùng cũng set ADMIN_TOKEN trên Render - phòng khi ai đó gọi thẳng bot.
 */
export function guardAdmin(req: NextRequest): NextResponse | null {
  const token = adminToken()
  if (!token) return null
  const sent = req.headers.get('x-admin-token') || ''
  if (sent !== token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export function isAuthRequired() {
  return Boolean(adminToken())
}

/** Gọi 1 endpoint của bot, tự gắn ADMIN_TOKEN nếu bot có yêu cầu. */
export async function botFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const base = baseUrl()
  if (!base) {
    return NextResponse.json({ error: 'BOT_API_URL is not configured' }, { status: 500 })
  }
  const { timeoutMs = 8000, ...rest } = init
  const headers = new Headers(init.headers)
  if (adminToken()) headers.set('X-Admin-Token', adminToken())
  return fetch(`${base}${path}`, {
    ...rest,
    headers,
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })
}

export async function botJson<T>(path: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<T> {
  const res = await botFetch(path, init)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Bot API ${path} → ${res.status} ${text.slice(0, 200)}`)
  }
  return (await res.json()) as T
}