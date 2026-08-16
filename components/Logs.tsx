'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowDownToLine, Ban, Pause, Play, Trash2 } from 'lucide-react'
import { getToken } from '@/lib/client'
import { Panel, type ToastKind } from '@/components/ui'

type Props = {
  notify: (k: ToastKind, t: string) => void
}

type Level = 'all' | 'sys' | 'info' | 'ok' | 'warn' | 'error'

function classify(line: string): Exclude<Level, 'all'> {
  const lower = line.toLowerCase()
  if (/❌|lỗi gửi|lỗi gọi|lỗi tải|lỗi:|error|exception|thất bại|dừng do lỗi/.test(lower)) return 'error'
  if (/⚠️|thiếu|rate limit|không tải được|chưa có/.test(lower)) return 'warn'
  if (/✅|đã gửi|đã trả lời|ok|đã cập nhật|đã xoá|đã đặt|đã tự động/.test(lower)) return 'ok'
  if (/khởi động|startup|bot_error|đang long|scheduler|webhook|env|vừa/.test(lower)) return 'sys'
  return 'info'
}

const MAX_LINES = 250

export default function LogsTab({ notify }: Props) {
  const [lines, setLines] = useState<string[]>([])
  const [q, setQ] = useState('')
  const [level, setLevel] = useState<Level>('all')
  const [paused, setPaused] = useState(false)
  const [autoscroll, setAutoscroll] = useState(true)
  const [connecting, setConnecting] = useState(true)
  const bodyRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  pausedRef.current = paused

  useEffect(() => {
    const controller = new AbortController()
    let retryTimer: number | undefined
    let stopped = false

    const connect = async () => {
      if (stopped) return
      setConnecting(true)
      try {
        const headers: Record<string, string> = {}
        const token = getToken()
        if (token) headers['x-admin-token'] = token
        const res = await fetch('/api/logs/stream', { headers, cache: 'no-store', signal: controller.signal })
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        setConnecting(false)
        while (!stopped) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          let idx
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, idx)
            buffer = buffer.slice(idx + 2)
            for (const part of chunk.split('\n')) {
              const trimmed = part.startsWith('data:') ? part.slice(5).trim() : part.trim()
              if (!trimmed) continue
              if (pausedRef.current) continue
              setLines((prev) => {
                const next = prev.length >= MAX_LINES ? prev.slice(prev.length - MAX_LINES + 1) : [...prev]
                return [...next, trimmed]
              })
            }
          }
        }
      } catch (e) {
        if (stopped || (e instanceof DOMException && e.name === 'AbortError')) return
        notify('err', 'Mất kết nối log, đang thử lại…')
      }
      if (!stopped) {
        retryTimer = window.setTimeout(connect, 2500)
      }
    }

    connect()
    return () => {
      stopped = true
      controller.abort()
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [notify])

  useEffect(() => {
    const el = bodyRef.current
    if (el && autoscroll) el.scrollTop = el.scrollHeight
  }, [lines, autoscroll])

  const visible = lines.filter((l) => {
    if (level !== 'all' && classify(l) !== level) return false
    if (q.trim() && !l.toLowerCase().includes(q.trim().toLowerCase())) return false
    return true
  })

  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input className="input" placeholder="Lọc theo từ khoá…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'error', 'warn', 'ok', 'info', 'sys'] as Level[]).map((lv) => (
            <button key={lv} className={`btn btn-sm ${level === lv ? 'btn-primary' : ''}`} onClick={() => setLevel(lv)}>
              {lv === 'all' ? 'Tất cả' : lv}
            </button>
          ))}
        </div>
      </div>

      <Panel
        kicker="SYSTEM / STREAM"
        title="Live logs"
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className={`btn btn-sm ${autoscroll ? 'btn-green' : ''}`} onClick={() => setAutoscroll((v) => !v)} title="Tự cuộn xuống">
              <ArrowDownToLine size={13} /> {autoscroll ? 'Auto' : 'Thủ công'}
            </button>
            <button className="btn btn-sm" onClick={() => setPaused((v) => !v)}>
              {paused ? <Play size={13} /> : <Pause size={13} />} {paused ? 'Tiếp tục' : 'Tạm dừng'}
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => setLines([])}>
              <Trash2 size={13} /> Xoá
            </button>
          </div>
        }
      >
        <div className="term">
          <div className="term-head">
            <span className="term-dot" style={{ background: 'var(--red)' }} />
            <span className="term-dot" style={{ background: 'var(--amber)' }} />
            <span className="term-dot" style={{ background: 'var(--green)' }} />
            <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-3)', fontFamily: 'ui-monospace, monospace' }}>
              {connecting ? 'đang kết nối…' : 'tbz-bot / production'}
            </span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{visible.length} dòng</span>
          </div>
          <div className="term-body" ref={bodyRef}>
            {visible.length === 0 ? (
              <div className="term-empty">{connecting ? 'Đang chờ kết nối stream…' : 'Chưa có log nào khớp bộ lọc.'}</div>
            ) : (
              visible.map((l, i) => (
                <div key={`${i}-${l.slice(0, 24)}`} className={`term-line lvl-${classify(l)}`}>
                  {l}
                </div>
              ))
            )}
            {!connecting && (
              <div className="term-empty" style={{ padding: '10px 0 0' }}>
                <Ban size={13} style={{ verticalAlign: -2, marginRight: 4 }} /> stream đang sống — log mới xuất hiện realtime
              </div>
            )}
          </div>
        </div>
      </Panel>
    </>
  )
}