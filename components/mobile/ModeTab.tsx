'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Battery, Check, Sparkles, Turtle, Zap } from 'lucide-react'
import { api } from '@/lib/client'
import type { BotConfig } from '@/lib/types'
import type { ToastKind } from '@/components/ui'

type Props = {
  notify: (k: ToastKind, t: string) => void
}

const ICONS: Record<string, typeof Zap> = {
  auto: Battery,
  pro: Sparkles,
  fast: Zap,
  think: Turtle,
}

export default function ModeTab({ notify }: Props) {
  const qc = useQueryClient()
  const config = useQuery<BotConfig>({
    queryKey: ['config'],
    queryFn: () => api<BotConfig>('/api/config'),
    refetchInterval: 60_000,
  })

  const [mode, setMode] = useState<string | null>(null)
  useEffect(() => {
    if (mode === null && config.data?.mode) setMode(config.data.mode)
  }, [config.data, mode])

  const options = useMemo(
    () => (config.data?.mode_options ?? []).filter((o) => o.id),
    [config.data],
  )

  const change = useMutation({
    mutationFn: (m: string) =>
      api<{ success: boolean; mode: string; message?: string }>('/api/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: m }),
      }),
    onSuccess: (d) => {
      setMode(d.mode)
      notify('ok', `Đã chuyển sang chế độ ${d.mode} ✓`)
      qc.invalidateQueries({ queryKey: ['config'] })
    },
    onError: (e) => notify('err', `Lỗi đổi mode: ${String(e)}`),
  })

  const current = options.find((o) => o.id === (mode ?? config.data?.mode)) ?? null
  const HeroIcon = current ? (ICONS[current.id] ?? Zap) : Zap

  return (
    <div className="m-card-list">
      <section className="m-mode-hero">
        <div className="m-mode-hero-top">
          <span className="m-mode-icon">
            <HeroIcon size={24} />
          </span>
          <div>
            <span className="m-kicker">CHẾ ĐỘ HIỆN TẠI</span>
            <h2 className="m-mode-title">{current?.label ?? mode ?? '…'}</h2>
          </div>
        </div>
        <p className="m-mode-desc">{current?.desc ?? 'Đang tải chế độ…'}</p>
        <div className="m-model-line">model {config.data?.model ?? ''}</div>
      </section>

      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">CHỌN CHẾ ĐỘ</span>
          <h3>Đổi áp dụng ngay cho mọi cuộc trò chuyện</h3>
        </div>
        <div className="m-mode-list">
          {options.map((o) => {
            const Icon = ICONS[o.id] ?? Zap
            const selected = o.id === (mode ?? config.data?.mode)
            return (
              <button
                key={o.id}
                className={`m-mode-item ${selected ? 'selected' : ''}`}
                onClick={() => change.mutate(o.id)}
                disabled={change.isPending}
              >
                <span className={`m-mode-ico ${selected ? 'on' : ''}`}>
                  <Icon size={17} />
                </span>
                <span className="m-mode-item-body">
                  <b>{o.label}</b>
                  <small>{o.desc}</small>
                </span>
                <span className="m-mode-check">
                  {selected && <Check size={16} />}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      <section className="m-note">
        <span>💡</span>
        <p>
          Chế độ được áp dụng <b>toàn cục</b> — không cần bật lại trong từng chat. Đổi chế độ
          đồng thời xoá ngữ cảnh cuộc trò chuyện cũ để bắt đầu mới.
        </p>
      </section>
    </div>
  )
}