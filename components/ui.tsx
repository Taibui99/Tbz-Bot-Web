import { CheckCircle2, XCircle, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function fmtDate(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return 'Chưa có'
  const n = Number(v)
  const d = Number.isFinite(n) && n > 1_000_000_000 ? new Date(n * 1000) : new Date(String(v))
  if (Number.isNaN(d.getTime())) return String(v)
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function fmtDuration(s: number | null | undefined): string {
  if (s === null || s === undefined || !Number.isFinite(s)) return '—'
  if (s < 1) return `${Math.round(s * 1000)}ms`
  if (s < 60) return `${s.toFixed(1)}s`
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}

export function fmtUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d) return `${d}d ${h}h`
  if (h) return `${h}h ${m}m`
  return `${m}m`
}

export function Panel({ kicker, title, right, children, className = '' }: { kicker?: string; title?: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`panel ${className}`}>
      {(kicker || title || right) && (
        <div className="panel-head">
          <div>
            {kicker && <div className="panel-kicker">{kicker}</div>}
            {title && <h2>{title}</h2>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ icon: Icon, color, value, label, meta }: { icon: LucideIcon; color?: 'cyan' | 'green' | 'amber'; value: string; label: string; meta?: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color ?? ''}`}>
        <Icon size={17} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {meta && <div className="stat-meta">{meta}</div>}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <Info size={20} />
      <span>{text}</span>
    </div>
  )
}

export type ToastKind = 'ok' | 'err' | 'info'
export type Toast = { id: number; kind: ToastKind; text: string }

export function ToastHost({ toasts }: { toasts: Toast[] }) {
  return (
    <>
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.kind}`}>
          {t.kind === 'ok' ? <CheckCircle2 size={16} /> : t.kind === 'err' ? <XCircle size={16} /> : <Info size={16} />}
          <span>{t.text}</span>
        </div>
      ))}
    </>
  )
}

export const DAYS: [string, string][] = [
  ['Mon', 'Thứ Hai'],
  ['Tue', 'Thứ Ba'],
  ['Wed', 'Thứ Tư'],
  ['Thu', 'Thứ Năm'],
  ['Fri', 'Thứ Sáu'],
  ['Sat', 'Thứ Bảy'],
  ['Sun', 'Chủ Nhật'],
]

export const EMPTY_SCHEDULE = (): Record<string, { start: string; end: string; subject: string }[]> =>
  Object.fromEntries(DAYS.map(([d]) => [d, []]))