'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { Activity, Bell, Bot, CloudSun, MessageSquare, RefreshCw, Send, Settings2, Timer, Trash2, Users, Wifi, Zap } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { Overview, TestSendResponse } from '@/lib/types'
import { StatCard, Panel, fmtDate, fmtDuration, fmtUptime, type ToastKind } from '@/components/ui'

const TrafficChart = dynamic(() => import('@/components/TrafficChart'), { ssr: false, loading: () => <div className="center-box" style={{ height: 180 }}><div className="spinner" /></div> })

type Props = {
  overview: Overview | undefined
  isLoading: boolean
  onNavigate: (tab: 'scheduler' | 'settings' | 'conversations') => void
  notify: (k: ToastKind, t: string) => void
}

export default function OverviewTab({ overview, isLoading, onNavigate, notify }: Props) {
  const qc = useQueryClient()
  const status = overview?.status ?? null
  const settings = overview?.settings ?? null
  const conversations = useMemo(() => overview?.conversations ?? [], [overview])
  const [testText, setTestText] = useState('Chào, tin nhắn thử từ dashboard nè!')

  const traffic = useMemo(() => {
    const now = new Date()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now)
      d.setHours(0, 0, 0, 0)
      d.setDate(now.getDate() - (6 - i))
      return { date: d, label: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()], count: 0 }
    })
    for (const c of conversations) {
      const ts = c.received_ts
      if (!ts) continue
      const cd = new Date(ts * 1000)
      cd.setHours(0, 0, 0, 0)
      const hit = days.find((d) => d.date.getTime() === cd.getTime())
      if (hit) hit.count += 1
    }
    return days.map((d) => ({ label: d.label, count: d.count }))
  }, [conversations])

  const recentDurations = useMemo(() => conversations.slice(0, 10).reverse().map((c) => c.duration), [conversations])
  const successRate = status && status.message_count > 0 ? Math.max(0, Math.min(100, 100 - (status.error_count / status.message_count) * 100)) : 100
  const health = status ? Math.max(0, Math.min(100, successRate)) : 0

  const testSend = useMutation({
    mutationFn: () => api<TestSendResponse>('/api/test-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'text', text: testText }) }),
    onSuccess: (d) => notify(d.ok ? 'ok' : 'err', d.ok ? 'Đã gửi tin thử về chủ bot ✓' : `Gửi thất bại: ${d.error ?? 'lỗi không rõ'}`),
    onError: (e) => notify('err', `Lỗi gửi thử: ${String(e)}`),
  })

  const resetOwner = useMutation({
    mutationFn: () => api<{ had_session?: boolean }>('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: settings?.owner_chat_id ?? '' }) }),
    onSuccess: (d) => { notify('ok', d.had_session ? 'Đã xoá ngữ cảnh của chủ bot' : 'Chủ bot chưa có phiên nào để xoá'); qc.invalidateQueries({ queryKey: ['overview'] }) },
    onError: (e) => notify('err', `Lỗi reset: ${String(e)}`),
  })

  const scheduleTime = settings?.morning_greeting.time ?? '06:00'
  const morningOn = settings?.morning_greeting.enabled ?? false

  return (
    <>
      <div className="grid grid-4">
        <StatCard icon={Wifi} value={status?.bot_running ? 'ONLINE' : 'OFFLINE'} label="System status" meta={status?.bot_running ? 'Bot đang chạy & nhận tin' : status?.bot_error ?? 'Bot không hoạt động'} />
        <StatCard icon={Timer} color="cyan" value={fmtUptime(status?.uptime_seconds ?? 0)} label="Uptime" meta={`${status?.message_count ?? 0} tin nhắn từ lúc khởi động`} />
        <StatCard icon={Users} color="green" value={String(status?.unique_users ?? '—')} label="Người dùng" meta={`${conversations.length} hội thoại trong bộ nhớ`} />
        <StatCard icon={MessageSquare} color="amber" value={fmtDuration(status?.avg_response_seconds)} label="Phản hồi TB" meta={`${status?.error_count ?? 0} lỗi · ${successRate.toFixed(1)}% thành công`} />
      </div>

      <div style={{ display: 'grid', gap: 16, marginTop: 16 }}>
        <Panel kicker="ACTIVITY / 07 NGÀY" title="Lưu lượng tin nhắn" right={<span className="pill"><Activity size={13} /> Live</span>}>
          <TrafficChart data={traffic} total={status?.message_count ?? 0} />
        </Panel>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Panel kicker="INFRASTRUCTURE" title="Trạng thái dịch vụ" right={isLoading ? <div className="spinner" /> : <span className="pill" style={{ color: 'var(--green)' }}>OK</span>}>
          <ServiceRow icon={<Bot size={14} />} name="Zalo Gateway" meta={status?.bot_running ? 'Đang kết nối, long-polling' : 'Đã ngắt'} ok={!!status?.bot_running} />
          <ServiceRow icon={<Bell size={14} />} name="Morning Scheduler" meta={morningOn ? `Hoạt động · ${scheduleTime}` : 'Đang tắt'} ok={morningOn} />
          <ServiceRow icon={<CloudSun size={14} />} name="Weather" meta={settings?.location.name ? `Đã cấu hình · ${settings.location.name}` : 'Chưa cấu hình vị trí'} ok={!!settings?.location.name} />
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
              <span style={{ color: 'var(--text-2)' }}>Sức khỏe hệ thống</span>
              <b>{health.toFixed(0)}%</b>
            </div>
            <div className="bar">
              <i style={{ width: `${health}%` }} />
            </div>
          </div>
        </Panel>

        <Panel kicker="QUICK ACTIONS" title="Điều khiển nhanh">
          <div className="field">
            <span>Gửi tin thử về chủ bot</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input" value={testText} onChange={(e) => setTestText(e.target.value)} />
              <button className="btn btn-primary" onClick={() => testSend.mutate()} disabled={testSend.isPending || !testText.trim()}>
                {testSend.isPending ? <span className="spinner" /> : <Send size={14} />}
                Gửi
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => onNavigate('scheduler')}>
              <Bell size={13} /> Scheduler
            </button>
            <button className="btn btn-sm" onClick={() => onNavigate('settings')}>
              <Settings2 size={13} /> Cài đặt
            </button>
            <button className="btn btn-sm" onClick={() => onNavigate('conversations')}>
              <MessageSquare size={13} /> Hội thoại
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => resetOwner.mutate()} disabled={resetOwner.isPending}>
              <Trash2 size={13} /> Reset ngữ cảnh
            </button>
          </div>
        </Panel>
      </div>

      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <Panel kicker="PERFORMANCE" title="Thời gian phản hồi gần đây">
          {recentDurations.length ? (
            <ResponseBars durations={recentDurations} avg={status?.avg_response_seconds ?? 0} />
          ) : (
            <div className="empty">Chưa có dữ liệu phản hồi.</div>
          )}
        </Panel>
        <Panel kicker="SYSTEM" title="Hoạt động bot">
          <div className="term" style={{ background: 'rgba(2,4,9,0.5)' }}>
            <div className="term-body" style={{ height: 'auto', padding: '12px 14px' }}>
              <div className="term-line">Messages: {status?.message_count ?? 0} · Text: {status?.text_count ?? 0} · Ảnh: {status?.photo_count ?? 0}</div>
              <div className="term-line">Hoạt động cuối: {fmtDate(status?.last_message_at)}</div>
              <div className="term-line">Thời gian phản hồi TB: {fmtDuration(status?.avg_response_seconds)}</div>
              <div className="term-line">Lỗi: {status?.error_count ?? 0}</div>
              <div className="term-line">Trạng thái: {status?.bot_running ? 'ONLINE' : 'OFFLINE'}</div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel kicker="AUTOMATION" title="Lịch tự động tiếp theo" className="page-enter" >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{scheduleTime}</div>
          <div>
            <b style={{ display: 'block' }}>{morningOn ? 'Chào buổi sáng' : 'Tắt'}</b>
            <small style={{ color: 'var(--text-3)' }}>{settings?.location.name || 'Chưa cấu hình vị trí'} · gửi qua Zalo</small>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" onClick={() => onNavigate('scheduler')}>
              <Zap size={13} /> Chỉnh scheduler
            </button>
            <button className="icon-btn" onClick={() => qc.refetchQueries({ queryKey: ['overview'] })} aria-label="Làm mới">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </Panel>
    </>
  )
}

function ServiceRow({ icon, name, meta, ok }: { icon: React.ReactNode; name: string; meta: string; ok: boolean }) {
  return (
    <div className="service-row">
      <div className="service-icon">{icon}</div>
      <div>
        <b>{name}</b>
        <small>{meta}</small>
      </div>
      <span className={`service-state ${ok ? 'ok' : 'off'}`}>{ok ? 'ready' : 'off'}</span>
    </div>
  )
}

function ResponseBars({ durations, avg }: { durations: number[]; avg: number }) {
  const max = Math.max(...durations, 1)
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
        {durations.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{fmtDuration(d)}</span>
            <div style={{ width: '100%', height: `${Math.max(6, (d / max) * 80)}px`, borderRadius: 6, background: 'linear-gradient(180deg, var(--accent-2), var(--accent))', opacity: 0.85 }} />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-2)' }}>
        Trung bình <b>{fmtDuration(avg)}</b> cho {durations.length} tin gần nhất.
      </div>
    </div>
  )
}