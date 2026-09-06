'use client'

import { useMemo } from 'react'
import { Clock3, MessageSquare, RefreshCw, TriangleAlert, Users, Wifi } from 'lucide-react'
import type { Overview, Status } from '@/lib/types'
import { fmtDate, fmtDuration, fmtUptime } from '@/components/ui'

type Props = {
  overview: Overview | undefined
  status: Status | null
  settings: Overview['settings']
}

export default function StatusTab({ overview, status, settings }: Props) {
  const successRate = useMemo(() => {
    if (!status || status.message_count <= 0) return null
    return Math.max(0, Math.min(100, 100 - (status.error_count / status.message_count) * 100))
  }, [status])

  const health = successRate ?? 100

  const morningOn = settings?.morning_greeting.enabled ?? false
  const morningTime = settings?.morning_greeting.time ?? '06:00'
  const targetCount = settings?.schedule_targets?.enabled
    ? (settings.schedule_targets.chat_ids?.length ?? 0) + 1
    : 1
  const weather = settings?.location?.name ?? 'Chưa cấu hình'

  const rows: { icon: typeof Wifi; icoCls?: string; label: string; value: string; badge?: [boolean, string] }[] = [
    {
      icon: Wifi,
      label: 'Kết nối Zalo',
      value: status?.bot_running ? 'Long-polling đang chạy' : status?.bot_error ?? 'Đã ngắt kết nối',
      badge: [!!status?.bot_running, status?.bot_running ? 'LIVE' : 'OFFLINE'],
    },
    { icon: Clock3, label: 'Uptime', value: fmtUptime(status?.uptime_seconds ?? 0) },
    { icon: MessageSquare, label: 'Tin nhắn từ lúc khởi động', value: String(status?.message_count ?? 0) },
    { icon: Users, label: 'Người dùng duy nhất', value: String(status?.unique_users ?? '—') },
    { icon: RefreshCw, label: 'Phản hồi trung bình', value: fmtDuration(status?.avg_response_seconds) },
    { icon: TriangleAlert, label: 'Lỗi gặp phải', value: String(status?.error_count ?? 0) },
  ]

  return (
    <div className="m-card-list">
      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">HỆ THỐNG</span>
          <h3>Bot Zalo</h3>
        </div>
        <div className="m-rows">
          {rows.map((r, i) => {
            const Icon = r.icon
            return (
              <div key={i} className="m-row">
                <span className={`m-row-ico ${i === 0 && status?.bot_running ? 'green' : i === 0 ? 'red' : ''} ${r.icoCls ?? ''}`}>
                  <Icon size={16} />
                </span>
                <span className="m-row-txt">
                  <b>{r.label}</b>
                  <small>{r.value}</small>
                </span>
                {r.badge && <i className={`m-badge ${r.badge[0] ? 'on' : ''}`}>{r.badge[1]}</i>}
              </div>
            )
          })}
        </div>

        {overview?.connected && (
          <div className="m-health">
            <div className="m-health-top">
              <span>Sức khỏe chung</span>
              <b>{health.toFixed(0)}%</b>
            </div>
            <div className="m-bar">
              <div className="m-bar-fill" style={{ width: `${health}%` }} />
            </div>
            <span className="m-health-sub">Hoạt động cuối: {fmtDate(status?.last_message_at)}</span>
          </div>
        )}
      </section>

      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">TỰ ĐỘNG</span>
          <h3>Scheduler & thời tiết</h3>
        </div>
        <div className="m-rows">
          <div className="m-row">
            <span className="m-row-ico amber"><Clock3 size={16} /></span>
            <span className="m-row-txt">
              <b>Chào buổi sáng</b>
              <small>{morningOn ? `Lúc ${morningTime} · ${targetCount} nơi nhận` : 'Đang tắt'}</small>
            </span>
            <i className={`m-badge ${morningOn ? 'on' : ''}`}>{morningOn ? 'BẬT' : 'TẮT'}</i>
          </div>
          <div className="m-row">
            <span className="m-row-ico"><Users size={16} /></span>
            <span className="m-row-txt">
              <b>Nơi nhận thông báo</b>
              <small>{targetCount > 1 ? `${targetCount} chat đang nhận (kể cả chủ bot)` : 'Chỉ chủ bot'}</small>
            </span>
            <i className={`m-badge ${targetCount > 1 ? 'on' : ''}`}>{targetCount > 1 ? `${targetCount - 1}+` : '1'}</i>
          </div>
          <div className="m-row">
            <span className="m-row-ico cyan"><Wifi size={16} /></span>
            <span className="m-row-txt">
              <b>Vị trí thời tiết</b>
              <small>{weather}</small>
            </span>
          </div>
        </div>
      </section>

      <section className="m-note">
        <span>💡</span>
        <p>
          Số liệu reset mỗi khi bot khởi động lại. Chỉnh chào sáng, thời khóa biểu & nơi nhận
          ở dashboard máy tính — mục Scheduler.
        </p>
      </section>
    </div>
  )
}