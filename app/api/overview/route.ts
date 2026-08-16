import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { botFetch, guardAdmin } from '@/lib/server'
import type { Overview, Settings, Status, Conversation } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = guardAdmin(req)
  if (guard) return guard

  // Gộp 3 nguồn (status + settings + conversations) thành 1 call duy nhất để
  // frontend chỉ poll 1 endpoint - giảm tải qua proxy Vercel -> Render.
  const [statusRes, settingsRes, convRes] = await Promise.all([
    botFetch('/api/status', { timeoutMs: 6000 }),
    botFetch('/api/settings', { timeoutMs: 6000 }),
    botFetch('/api/conversations', { timeoutMs: 6000 }),
  ])

  let error: string | null = null
  let status: Status | null = null
  let settings: Settings | null = null
  let conversations: Conversation[] = []
  let connected = false

  if (statusRes.ok) {
    try {
      status = (await statusRes.json()) as Status
      connected = true
    } catch {
      error = 'Bot trả status không đọc được'
    }
  } else {
    error = `Bot offline (${statusRes.status})`
  }

  if (settingsRes.ok) {
    try {
      settings = (await settingsRes.json()) as Settings
    } catch {
      /* giữ null */
    }
  }

  if (convRes.ok) {
    try {
      const data = (await convRes.json()) as { conversations?: Conversation[] }
      conversations = data.conversations ?? []
    } catch {
      /* giữ rỗng */
    }
  }

  const overview: Overview = { connected, error, status, settings, conversations }
  return NextResponse.json(overview)
}