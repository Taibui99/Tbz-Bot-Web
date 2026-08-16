import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { botFetch, guardAdmin } from '@/lib/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const guard = guardAdmin(req)
  if (guard) return guard
  const body = await req.json().catch(() => ({}))
  const res = await botFetch('/api/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    timeoutMs: 8000,
  })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}