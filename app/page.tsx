'use client'

import { useCallback, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bot,
  CalendarClock,
  FileClock,
  KeyRound,
  LayoutDashboard,
  Lock,
  MessageSquare,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sticker,
} from 'lucide-react'
import { api, ApiAuthError, setToken } from '@/lib/client'
import type { Overview } from '@/lib/types'
import { ToastHost, type Toast, type ToastKind } from '@/components/ui'
import OverviewTab from '@/components/Overview'
import ConversationsTab from '@/components/Conversations'
import LogsTab from '@/components/Logs'
import StickersTab from '@/components/Stickers'
import SchedulerTab from '@/components/Scheduler'
import SettingsTab from '@/components/Settings'

type Tab = 'overview' | 'conversations' | 'logs' | 'stickers' | 'scheduler' | 'settings'

const NAV: { id: Tab; label: string; Icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Tổng quan', Icon: LayoutDashboard },
  { id: 'conversations', label: 'Hội thoại', Icon: MessageSquare },
  { id: 'logs', label: 'Live Logs', Icon: FileClock },
  { id: 'stickers', label: 'Stickers', Icon: Sticker },
  { id: 'scheduler', label: 'Scheduler', Icon: CalendarClock },
  { id: 'settings', label: 'Cài đặt', Icon: Settings2 },
]

const TAB_TITLES: Record<Tab, { title: string; sub: string }> = {
  overview: { title: 'Tổng quan', sub: 'Bảng điều khiển bot' },
  conversations: { title: 'Hội thoại', sub: 'Lịch sử trò chuyện thật từ bot' },
  logs: { title: 'Live Logs', sub: 'Luồng log realtime từ process' },
  stickers: { title: 'Stickers', sub: 'Thư viện sticker mà bot có thể gửi' },
  scheduler: { title: 'Scheduler', sub: 'Chào buổi sáng & thời khóa biểu' },
  settings: { title: 'Cài đặt', sub: 'Chủ bot, vị trí & công cụ' },
}

export default function Home() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('overview')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [authFailed, setAuthFailed] = useState(false)
  const toastId = useRef(0)

  const notify = useCallback((kind: ToastKind, text: string) => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, kind, text }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const overview = useQuery<Overview>({
    queryKey: ['overview'],
    queryFn: async () => {
      try {
        return await api<Overview>('/api/overview')
      } catch (e) {
        if (e instanceof ApiAuthError) {
          setAuthFailed(true)
          throw e
        }
        throw e
      }
    },
    refetchInterval: 30_000,
  })

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try {
      await qc.refetchQueries({ queryKey: ['overview'], type: 'active' })
    } finally {
      setRefreshing(false)
    }
  }, [qc])

  const online = overview.data?.connected ?? false
  const offlineError = overview.data?.error ?? null

  if (authFailed) {
    return <LoginScreen notify={notify} onSuccess={() => { setAuthFailed(false); qc.invalidateQueries({ queryKey: ['overview'] }) }} />
  }

  const current = TAB_TITLES[tab]

  return (
    <div className="app">
      <aside className="rail">
        <div className="rail-logo">
          <Bot size={22} />
        </div>
        {NAV.map(({ id, label, Icon }) => (
          <button key={id} className={`rail-item ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)} aria-label={label}>
            <Icon size={18} />
            <span className="rail-tip">{label}</span>
          </button>
        ))}
        <div className="rail-bottom">
          <div className={`rail-dot ${online ? '' : 'offline'}`} />
        </div>
      </aside>

      <main className="content">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{current.title}</h1>
            <p>{current.sub}</p>
          </div>
          <div className="topbar-actions">
            <span className={`pill ${online ? 'online' : 'offline'}`}>
              <span className={`pdot ${online ? '' : 'off'}`} />
              {online ? 'LIVE' : 'OFFLINE'}
            </span>
            <button className={`icon-btn ${refreshing ? 'spin' : ''}`} onClick={refresh} aria-label="Làm mới">
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        {offlineError && !online && (
          <div className="alert">
            <span>Bot API đang ngoài mạng</span>
            <span style={{ opacity: 0.7, fontWeight: 400 }}>{offlineError}</span>
          </div>
        )}

        {overview.isLoading && !overview.data ? (
          <div className="center-box">
            <div className="spinner" />
            <span>Đang đồng bộ dữ liệu thật từ bot…</span>
          </div>
        ) : (
          <div className="page-enter">
            {tab === 'overview' && <OverviewTab overview={overview.data} isLoading={overview.isFetching} onNavigate={setTab} notify={notify} />}
            {tab === 'conversations' && <ConversationsTab conversations={overview.data?.conversations ?? []} notify={notify} />}
            {tab === 'logs' && <LogsTab notify={notify} />}
            {tab === 'stickers' && <StickersTab settings={overview.data?.settings ?? null} notify={notify} />}
            {tab === 'scheduler' && <SchedulerTab settings={overview.data?.settings ?? null} notify={notify} />}
            {tab === 'settings' && <SettingsTab settings={overview.data?.settings ?? null} notify={notify} />}
          </div>
        )}
      </main>

      <ToastHost toasts={toasts} />
    </div>
  )
}

function LoginScreen({ notify, onSuccess }: { notify: (k: ToastKind, t: string) => void; onSuccess: () => void }) {
  const [token, setTokenValue] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    if (!token.trim()) return
    setBusy(true)
    try {
      setToken(token.trim())
      const data = await api<Overview>('/api/overview')
      if (data) {
        onSuccess()
      }
    } catch {
      notify('err', 'Sai hoặc thiếu ADMIN_TOKEN — thử lại')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="login-wrap">
      <form
        className="login-card"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <div className="rail-logo" style={{ margin: 0 }}>
          <ShieldCheck size={24} />
        </div>
        <h1>Đăng nhập quản trị</h1>
        <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 13 }}>
          Web này đã bật ADMIN_TOKEN. Nhập token giống với biến môi trường <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 6 }}>ADMIN_TOKEN</code> để tiếp tục.
        </p>
        <div className="field">
          <span>ADMIN_TOKEN</span>
          <input className="input" type="password" value={token} onChange={(e) => setTokenValue(e.target.value)} placeholder="••••••••" autoFocus />
        </div>
        <button className="btn btn-primary" disabled={busy || !token.trim()}>
          {busy ? <span className="spinner" /> : <KeyRound size={15} />}
          {busy ? 'Đang kiểm tra…' : 'Vào control center'}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 12 }}>
          <Lock size={13} />
          Token được giữ trong session này, không lưu xuống đĩa.
        </div>
      </form>
    </div>
  )
}