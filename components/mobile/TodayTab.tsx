'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Clock3, CloudSun, GraduationCap, Sun, Wifi } from 'lucide-react'
import { api } from '@/lib/client'
import type { BotConfig, Overview, Period, Schedule, Status } from '@/lib/types'
import { DAYS, type ToastKind } from '@/components/ui'

type Props = {
  overview: Overview | undefined
  settings: Overview['settings']
  status: Status | null
  notify: (k: ToastKind, t: string) => void
  onGoMode: () => void
}

const WEEKDAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function todayKey(): string {
  return WEEKDAY_KEYS[new Date().getDay()]
}

function nowHM(): string {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function TodayTab({ settings, status, onGoMode }: Props) {
  const config = useQuery<BotConfig>({
    queryKey: ['config'],
    queryFn: () => api<BotConfig>('/api/config'),
    refetchInterval: 60_000,
  })

  type SessionOut = {
    key: string
    keyLabel: string
    periods: Period[]
    now: string
    current: Period | null
    next: Period | null
  }

  const session = useMemo<SessionOut>(() => {
    const schedule: Schedule = settings?.schedule ?? {}
    const key = todayKey()
    const keyLabel = DAYS.find(([d]) => d === key)?.[1] ?? ''
    const periods = (schedule[key] ?? []).sort((a, b) => (a.start < b.start ? -1 : 1))
    const now = nowHM()
    let current: Period | null = null
    let next: Period | null = null
    for (const p of periods) {
      if (p.start <= now && now < p.end) current = p
      if (!current && !next && p.start >= now) next = p
    }
    if (!current && !next && periods.length) next = periods[0]
    return { key, keyLabel, periods, now, current, next }
  }, [settings])

  const mode = config.data?.mode ?? '—'
  const modeLabel = useMemo(() => {
    const opt = (config.data?.mode_options ?? []).find((m) => m.id === mode)
    return opt?.label ?? mode
  }, [config.data, mode])

  const morningOn = settings?.morning_greeting.enabled ?? false
  const morningTime = settings?.morning_greeting.time ?? '06:00'

  const isNowDark = useMemo(() => {
    const h = new Date().getHours()
    return h < 6 || h >= 18
  }, [])

  return (
    <div className="m-card-list">
      <section className="m-hero">
        <div className="m-hero-grid">
          <div className="m-hero-main">
            <span className={`m-hero-dot ${status?.bot_running ? 'on' : 'off'}`} />
            <span className="m-hero-iam">{status?.bot_running ? 'Bot đang chạy' : 'Bot ngoài mạng'}</span>
            <div className="m-hero-title">
              <span className="m-hero-hl">{session.keyLabel}</span>
            </div>
          </div>
          <div className="m-hero-clock">
            <Clock3 size={15} />
            <span className="m-hero-now">{session.now}</span>
          </div>
        </div>

        {session.current ? (
          <div className="m-now-card live">
            <div className="m-now-ring" />
            <div className="m-now-body">
              <span className="m-now-kick">Đang học</span>
              <b>{session.current?.subject || 'Môn học'}</b>
              <span className="m-now-time">
                {session.current?.start} – {session.current?.end}
              </span>
            </div>
          </div>
        ) : session.next ? (
          <div className="m-now-card">
            <div className="m-now-ring idle" />
            <div className="m-now-body">
              <span className="m-now-kick">Tiết kế tiếp</span>
              <b>{session.next?.subject || 'Môn học'}</b>
              <span className="m-now-time">
                {session.next?.start} – {session.next?.end}
              </span>
            </div>
            <ChevronRight size={18} className="m-now-chev" />
          </div>
        ) : (
          <div className="m-now-card">
            <div className="m-now-ring done" />
            <div className="m-now-body">
              <span className="m-now-kick">Hôm nay</span>
              <b>{isNowDark ? 'Xong tiết rồi, nghỉ ngơi nhé 🌙' : 'Hôm nay rảnh, không có tiết'}</b>
              <span className="m-now-time">Không còn tiết nào trong thời khóa biểu</span>
            </div>
          </div>
        )}
      </section>

      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">THỜI KHÓA BIỂU</span>
          <h3>Tiết học {session.keyLabel.toLowerCase()}</h3>
        </div>
        {session.periods.length === 0 ? (
          <div className="m-empty">Hôm nay không có tiết nào trong thời khóa biểu.</div>
        ) : (
          <div className="m-period-list">
            {session.periods.map((p, i) => {
              const past = p.end <= session.now
              const isCurrent = session.current === p
              return (
                <div key={i} className={`m-period ${past ? 'past' : ''} ${isCurrent ? 'current' : ''}`}>
                  <div className="m-period-time">
                    <span>{p.start}</span>
                    <span className="m-period-dash">{p.end}</span>
                  </div>
                  <div className="m-period-body">
                    <b>{p.subject || 'Môn học'}</b>
                    <span>Tiết {i + 1}</span>
                  </div>
                  {isCurrent && <span className="m-period-tag">đang</span>}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">TRẠNG THÁI</span>
          <h3>Bot & tự động</h3>
        </div>
        <div className="m-rows">
          <button className="m-row" onClick={onGoMode}>
            <span className="m-row-ico grad"><Sun size={16} /></span>
            <span className="m-row-txt">
              <b>Chế độ AI</b>
              <small>{modeLabel} · model {config.data?.model ?? ''}</small>
            </span>
            <ChevronRight size={16} className="m-row-chev" />
          </button>
          <div className="m-row">
            <span className="m-row-ico amber"><CloudSun size={16} /></span>
            <span className="m-row-txt">
              <b>Chào buổi sáng</b>
              <small>{morningOn ? `Bật lúc ${morningTime}` : 'Đang tắt'}</small>
            </span>
            <i className={`m-badge ${morningOn ? 'on' : ''}`}>{morningOn ? 'BẬT' : 'TẮT'}</i>
          </div>
          <div className="m-row">
            <span className="m-row-ico"><Wifi size={16} /></span>
            <span className="m-row-txt">
              <b>Kết nối Zalo</b>
              <small>{status?.bot_running ? 'Long-polling đang chạy' : status?.bot_error ?? 'Đã ngắt kết nối'}</small>
            </span>
            <i className={`m-badge ${status?.bot_running ? 'on' : ''}`}>{status?.bot_running ? 'ON' : 'OFF'}</i>
          </div>
        </div>
      </section>

      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">QUICK</span>
          <h3>Hướng dẫn nhanh</h3>
        </div>
        <div className="m-empty compact">
          <span><GraduationCap size={15} /> Lịch xem theo ngày thực — chỉnh ở mục <b>Gửi tin</b> & <b>Scheduler</b> trên máy tính.</span>
        </div>
      </section>
    </div>
  )
}