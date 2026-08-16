import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { botFetch, guardAdmin } from '@/lib/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = guardAdmin(req)
  if (guard) return guard
  const res = await botFetch('/api/config', { timeoutMs: 6000 })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}