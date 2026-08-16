import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { botFetch, guardAdmin } from '@/lib/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = guardAdmin(req)
  if (guard) return guard
  const res = await botFetch('/api/settings', { timeoutMs: 6000 })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}

export async function PUT(req: NextRequest) {
  const guard = guardAdmin(req)
  if (guard) return guard
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Body phải là JSON' }, { status: 400 })
  const res = await botFetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), timeoutMs: 8000 })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}