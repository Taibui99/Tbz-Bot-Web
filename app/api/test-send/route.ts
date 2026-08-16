import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { botFetch, guardAdmin } from '@/lib/server'
import type { TestSendRequest } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = guardAdmin(req)
  if (guard) return guard
  const body = (await req.json().catch(() => null)) as TestSendRequest | null
  if (!body || !body.type) return NextResponse.json({ error: 'Thiếu type' }, { status: 400 })
  const res = await botFetch('/api/test/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeoutMs: 90000, // tạo ảnh/voice có thể mất 10-30s
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}