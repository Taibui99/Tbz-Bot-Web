'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { CalendarClock, CalendarDays, Send, SlidersHorizontal, HeartPulse } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Overview } from '@/lib/types'
import type { ToastKind } from '@/components/ui'
import TodayTab from './TodayTab'
import ModeTab from './ModeTab'
import SendTab from './SendTab'
import StatusTab from './StatusTab'
import SchedulerTab from './SchedulerTab'

type Props = {
  overview: Overview | undefined
  notify: (k: ToastKind, t: string) => void
}

type TabId = 'today' | 'mode' | 'send' | 'scheduler' | 'status'

const TABS: { id: TabId; label: string; Icon: typeof Send }[] = [
  { id: 'today', label: 'Hôm nay', Icon: CalendarDays },
  { id: 'mode', label: 'Chế độ', Icon: SlidersHorizontal },
  { id: 'send', label: 'Gửi tin', Icon: Send },
  { id: 'scheduler', label: 'Lịch', Icon: CalendarClock },
  { id: 'status', label: 'Trạng thái', Icon: HeartPulse },
]

/** Chạy lại keyframe m-rise trên các card của panel vừa active.
 *  Browsers KHÔNG tự restart animation của descendant khi bấm class lên
 *  ancestor → phải ép bằng inline animation:none + reflow + trả lại (chuẩn
 *  pattern "restart CSS animation"). Không remount nên không reset state. */
function restartCardRise(panel: HTMLElement) {
  const cards = Array.from(panel.querySelectorAll<HTMLElement>('.m-card-list > *'))
  if (!cards.length) return
  for (const c of cards) c.style.animation = 'none'
  void panel.offsetWidth
  for (const c of cards) c.style.animation = ''
}

export default function MobileApp({ overview, notify }: Props) {
  const [tab, setTab] = useState<TabId>('today')
  const bodyRef = useRef<HTMLElement>(null)
  const online = overview?.connected ?? false
  const settings = overview?.settings ?? null
  const status = overview?.status ?? null

  const go = useCallback((id: TabId) => {
    setTab(id)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const panel = bodyRef.current?.querySelector<HTMLElement>('.m-tabpage.active')
        if (panel) restartCardRise(panel)
      })
    })
  }, [])

  // Mọi panel MOUNT SẴN một lần: chuyển tab chỉ đổi opacity (CSS), không
  // re-mount, không chờ exit rồi enter → cử động mượt ngay cả trên GPU yếu.
  const panels = useMemo<Record<TabId, ReactNode>>(
    () => ({
      today: <TodayTab overview={overview} settings={settings} status={status} notify={notify} onGoMode={() => go('mode')} />,
      mode: <ModeTab notify={notify} />,
      send: <SendTab notify={notify} />,
      scheduler: <SchedulerTab settings={settings} notify={notify} />,
      status: <StatusTab overview={overview} status={status} settings={settings} />,
    }),
    [overview, settings, status, notify, go],
  )

  const title = tab === 'today' ? 'Hôm nay' : TABS.find((t) => t.id === tab)?.label ?? ''
  const dateLabel = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="m-app">
      <header className="m-header">
        <div className="m-title-wrap">
          <span className="m-kicker">{online ? '● Trực tuyến' : '○ Ngoài mạng'}</span>
          <h1 className="m-title">{title}</h1>
          {tab === 'today' && <span className="m-date">{dateLabel}</span>}
        </div>
      </header>

      <main className="m-body" ref={bodyRef}>
        {TABS.map(({ id }) => (
          <div key={id} className={`m-tabpage ${tab === id ? 'active' : ''}`} aria-hidden={tab !== id} inert={tab !== id}>
            {panels[id]}
          </div>
        ))}
      </main>

      <nav className="m-tabbar" aria-label="Điều hướng nhanh">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`m-tab ${tab === id ? 'active' : ''}`}
            onClick={() => go(id)}
            aria-label={label}
          >
            <Icon size={21} strokeWidth={tab === id ? 2.2 : 1.8} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}