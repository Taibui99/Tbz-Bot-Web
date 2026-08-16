'use client'

import { useMemo, useState } from 'react'
import { RotateCcw, Search, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { Conversation } from '@/lib/types'
import { Empty, Panel, fmtDate, fmtDuration, type ToastKind } from '@/components/ui'

type Props = {
  conversations: Conversation[]
  notify: (k: ToastKind, t: string) => void
}

export default function ConversationsTab({ conversations, notify }: Props) {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [type, setType] = useState<'all' | 'text' | 'photo'>('all')

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return conversations.filter((c) => {
      if (type !== 'all' && c.type !== type) return false
      if (!needle) return true
      return (c.display_name || '').toLowerCase().includes(needle) || (c.user_text || '').toLowerCase().includes(needle) || (c.bot_reply || '').toLowerCase().includes(needle)
    })
  }, [conversations, q, type])

  const resetChat = useMutation({
    mutationFn: (chatId: string) => api<{ had_session?: boolean }>('/api/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId }) }),
    onSuccess: (d) => notify('ok', d.had_session ? 'Đã xoá ngữ cảnh cuộc trò chuyện này' : 'Chat này không có phiên đang lưu'),
    onError: (e) => notify('err', `Lỗi reset: ${String(e)}`),
  })

  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Tìm theo tên hoặc nội dung…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'text', 'photo'] as const).map((t) => (
            <button key={t} className={`btn btn-sm ${type === t ? 'btn-primary' : ''}`} onClick={() => setType(t)}>
              {t === 'all' ? 'Tất cả' : t === 'text' ? 'Text' : 'Ảnh'}
            </button>
          ))}
        </div>
      </div>

      <Panel kicker="MESSAGING / LIVE" title={`Hội thoại (${filtered.length})`} right={<button className="btn btn-sm btn-ghost" onClick={() => qc.refetchQueries({ queryKey: ['overview'] })}><RotateCcw size={13} /> Làm mới</button>}>
        {filtered.length === 0 ? (
          <Empty text={conversations.length === 0 ? 'Chưa có hội thoại nào — gửi tin cho bot là xuất hiện ở đây.' : 'Không tìm thấy kết quả phù hợp.'} />
        ) : (
          <div className="conv-list">
            {filtered.map((c, i) => (
              <ConversationCard key={`${c.chat_id}-${c.received_ts ?? c.received_at}-${i}`} c={c} onReset={() => resetChat.mutate(c.chat_id)} resetting={resetChat.isPending} />
            ))}
          </div>
        )}
      </Panel>
    </>
  )
}

function ConversationCard({ c, onReset, resetting }: { c: Conversation; onReset: () => void; resetting: boolean }) {
  return (
    <article className="conv-card">
      <div className="conv-head">
        <b className="conv-name">{c.display_name || c.chat_id}</b>
        <span className={`badge ${c.type === 'photo' ? 'bot' : ''}`}>{c.type === 'photo' ? 'ảnh' : 'text'}</span>
        <div className="conv-meta">
          <span>{fmtDate(c.received_ts ?? c.received_at)}</span>
          <span>·</span>
          <span>{fmtDuration(c.duration)}</span>
        </div>
      </div>
      <div className="bubble user">
        <span className="tag">Người nhắn</span>
        <br />
        {c.user_text || '[gửi 1 ảnh]'}
      </div>
      <div className="bubble bot">
        <span className="tag">Bot</span>
        <br />
        {c.bot_reply || '[không có phản hồi text]'}
      </div>
      <div className="conv-actions">
        <button className="btn btn-sm btn-danger" onClick={onReset} disabled={resetting}>
          <Trash2 size={13} /> Xoá ngữ cảnh chat này
        </button>
      </div>
    </article>
  )
}