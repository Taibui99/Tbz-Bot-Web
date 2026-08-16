'use client'

import { useEffect, useState } from 'react'
import { Cpu, Database, Image as ImageIcon, MapPin, Mic, Save, Send, Trash2, User } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { BotConfig, Settings, TestSendResponse } from '@/lib/types'
import { Empty, Panel, type ToastKind } from '@/components/ui'

type Props = {
  settings: Settings | null
  notify: (k: ToastKind, t: string) => void
}

type Draft = { owner_chat_id: string; location: { name: string; lat: string; lon: string } }

export default function SettingsTab({ settings, notify }: Props) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState<Draft | null>(null)

  useEffect(() => {
    if (draft === null && settings) {
      setDraft({
        owner_chat_id: settings.owner_chat_id ?? '',
        location: {
          name: settings.location?.name ?? '',
          lat: settings.location?.lat != null ? String(settings.location.lat) : '',
          lon: settings.location?.lon != null ? String(settings.location.lon) : '',
        },
      })
    }
  }, [settings, draft])

  const save = useMutation({
    mutationFn: async () => {
      if (!draft) return
      await api('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_chat_id: draft.owner_chat_id.trim() || null,
          location: {
            name: draft.location.name.trim(),
            lat: draft.location.lat.trim() ? Number(draft.location.lat.trim()) : null,
            lon: draft.location.lon.trim() ? Number(draft.location.lon.trim()) : null,
          },
        }),
      })
    },
    onSuccess: () => {
      notify('ok', 'Đã lưu cài đặt ✓')
      setDraft(null)
      qc.invalidateQueries({ queryKey: ['overview'] })
    },
    onError: (e) => notify('err', `Lỗi lưu: ${String(e)}`),
  })

  const config = useQuery<BotConfig>({ queryKey: ['config'], queryFn: () => api<BotConfig>('/api/config') })

  const resetOwner = useMutation({
    mutationFn: () => api<{ had_session?: boolean }>('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: settings?.owner_chat_id ?? '' }) }),
    onSuccess: (d) => { notify('ok', d.had_session ? 'Đã xoá ngữ cảnh chủ bot' : 'Chủ bot không có phiên lưu'); qc.invalidateQueries({ queryKey: ['overview'] }) },
    onError: (e) => notify('err', `Lỗi reset: ${String(e)}`),
  })

  if (!settings || !draft) {
    return <Panel kicker="SETTINGS" title="Cài đặt"><Empty text="Bot đang offline — chưa lấy được cài đặt." /></Panel>
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <span className="spinner" /> : <Save size={14} />}
          Lưu cài đặt
        </button>
      </div>

      <div className="grid grid-2">
        <Panel kicker="BOT / OWNER" title="Chủ bot" right={<User size={16} style={{ color: 'var(--text-3)' }} />}>
          <div className="field">
            <span>Owner chat ID</span>
            <input className="input" value={draft.owner_chat_id} onChange={(e) => setDraft({ ...draft, owner_chat_id: e.target.value })} placeholder="Tự động ghi nhận từ tin nhắn đầu tiên" />
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: 12, margin: 0 }}>
            Đây là nơi bot gửi chào buổi sáng, thời khóa biểu và tin thử từ dashboard.
          </p>
        </Panel>

        <Panel kicker="WEATHER / LOCATION" title="Vị trí báo thời tiết" right={<MapPin size={16} style={{ color: 'var(--text-3)' }} />}>
          <div className="field">
            <span>Tên địa điểm</span>
            <input className="input" value={draft.location.name} onChange={(e) => setDraft({ ...draft, location: { ...draft.location, name: e.target.value } })} placeholder="vd Hà Nội" />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <span>Vĩ độ</span>
              <input className="input" value={draft.location.lat} onChange={(e) => setDraft({ ...draft, location: { ...draft.location, lat: e.target.value } })} placeholder="21.0278" inputMode="decimal" />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <span>Kinh độ</span>
              <input className="input" value={draft.location.lon} onChange={(e) => setDraft({ ...draft, location: { ...draft.location, lon: e.target.value } })} placeholder="105.8342" inputMode="decimal" />
            </div>
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: 12, margin: 0 }}>
            Để trống tọa độ để bot dò theo tên địa điểm.
          </p>
        </Panel>
      </div>

      <div style={{ marginTop: 16 }}>
        <TestSendTool notify={notify} ownerChatId={settings.owner_chat_id} />
      </div>

      <div style={{ marginTop: 16 }}>
        <Panel kicker="SYSTEM / INFO" title="Cấu hình bot (read-only)" right={<Cpu size={16} style={{ color: 'var(--text-3)' }} />}>
          {config.isLoading ? (
            <div className="center-box"><div className="spinner" /></div>
          ) : config.data ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <InfoRow label="Gemini model" value={config.data.model} />
              <InfoRow label="Giọng đọc (voice)" value={config.data.voice} />
              <InfoRow label="Tốc độ đọc" value={config.data.voice_rate} />
              <InfoRow label="PUBLIC_URL" value={config.data.public_url ?? '(chưa cấu hình)'} />
              <InfoRow label="Sticker đang có" value={`${config.data.sticker_count} mood`} />
              <InfoRow label="Bảo vệ ADMIN_TOKEN" value={config.data.admin_enabled ? 'Đang bật' : 'Đang tắt (mở)'} warn={!config.data.admin_enabled} />
            </div>
          ) : (
            <Empty text="Không lấy được cấu hình bot." />
          )}
        </Panel>
      </div>

      <div style={{ marginTop: 16 }}>
        <Panel kicker="DANGER ZONE" title="Nguy hiểm" right={<Database size={16} style={{ color: 'var(--red)' }} />}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <b style={{ display: 'block', fontSize: 13 }}>Xoá ngữ cảnh (bộ nhớ) của chủ bot</b>
              <small style={{ color: 'var(--text-3)' }}>Bot sẽ quên lịch sử trò chuyện trước đó với chủ bot. Không xoá dữ liệu cài đặt.</small>
            </div>
            <button className="btn btn-danger" onClick={() => resetOwner.mutate()} disabled={resetOwner.isPending}>
              <Trash2 size={14} /> {resetOwner.isPending ? 'Đang xoá…' : 'Reset ngữ cảnh chủ bot'}
            </button>
          </div>
        </Panel>
      </div>
    </>
  )
}

function InfoRow({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ padding: 10, borderRadius: 11, border: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-3)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 13, marginTop: 4, color: warn ? 'var(--amber)' : 'var(--text)', wordBreak: 'break-all' }}>{value}</div>
    </div>
  )
}

function TestSendTool({ notify, ownerChatId }: { notify: (k: ToastKind, t: string) => void; ownerChatId: string | null }) {
  const [kind, setKind] = useState<'text' | 'voice' | 'image'>('text')
  const [text, setText] = useState('')
  const send = useMutation({
    mutationFn: () => api<TestSendResponse>('/api/test-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: kind, text }) }),
    onSuccess: (d) =>
      notify(d.ok ? 'ok' : 'err', d.ok ? `Đã gửi thử (${kind}) về ${d.chat_id} ✓` : `Gửi thất bại: ${d.error ?? ''}`),
    onError: (e) => notify('err', `Lỗi: ${String(e)}`),
  })
  return (
    <Panel kicker="TEST SEND" title="Hộp thử gửi về chủ bot" right={<Send size={16} style={{ color: 'var(--text-3)' }} />}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {(['text', 'voice', 'image'] as const).map((k) => (
          <button key={k} className={`btn btn-sm ${kind === k ? 'btn-primary' : ''}`} onClick={() => setKind(k)}>
            {k === 'text' ? <Send size={13} /> : k === 'voice' ? <Mic size={13} /> : <ImageIcon size={13} />}
            {k === 'text' ? 'Text' : k === 'voice' ? 'Voice' : 'Ảnh AI'}
          </button>
        ))}
      </div>
      <div className="field" style={{ margin: 0 }}>
        <span>{kind === 'text' ? 'Nội dung tin nhắn' : kind === 'voice' ? 'Nội dung bot sẽ đọc thành giọng nói' : 'Mô tả ảnh (viết tự nhiên, bot sẽ dịch sang tiếng Anh)'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <textarea className="textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder={kind === 'image' ? 'vd một chú mèo đội nón lá đang học bài' : 'vd Chào buổi sáng!'} />
          <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => send.mutate()} disabled={send.isPending || !text.trim()}>
            {send.isPending ? <span className="spinner" /> : <Send size={14} />}
            Gửi
          </button>
        </div>
      </div>
      <p style={{ color: 'var(--text-3)', fontSize: 12, margin: '10px 0 0' }}>
        Gửi về {ownerChatId || '(chưa có owner — gửi 1 tin cho bot trước)'}. Tạo ảnh có thể mất 10–30 giây.
      </p>
    </Panel>
  )
}