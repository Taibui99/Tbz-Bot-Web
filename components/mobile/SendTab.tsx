'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ImagePlus, Mic, Send, Smile } from 'lucide-react'
import { api } from '@/lib/client'
import type { ChatInfo, TestSendResponse } from '@/lib/types'
import type { ToastKind } from '@/components/ui'

type Props = {
  notify: (k: ToastKind, t: string) => void
}

type Kind = 'text' | 'voice' | 'sticker' | 'image'

export default function SendTab({ notify }: Props) {
  const chatsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: () => api<{ chats: ChatInfo[] }>('/api/chats'),
    refetchInterval: 60_000,
  })
  const chats = useMemo(() => chatsQuery.data?.chats ?? [], [chatsQuery.data])

  const [target, setTarget] = useState('')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState<Kind | null>(null)

  useEffect(() => {
    if (!target && chats.length) {
      setTarget((chats.find((c) => c.is_owner) ?? chats[0]).chat_id)
    }
  }, [chats, target])

  const targetName = (id: string) => {
    const c = chats.find((c) => c.chat_id === id)
    if (!c) return id
    return c.type === 'GROUP' ? `nhóm ${c.name}` : c.name
  }

  const send = async (kind: Kind) => {
    const chat_id = target
    if (!chat_id) {
      notify('err', 'Chưa chọn nơi nhận — chưa có ai nhắn bot')
      return
    }
    if (kind !== 'sticker' && !text.trim()) {
      notify('err', 'Nhập nội dung trước khi gửi')
      return
    }
    setBusy(kind)
    try {
      const body =
        kind === 'sticker'
          ? { type: 'sticker', chat_id }
          : { type: kind, text: text.trim(), chat_id }
      const d = await api<TestSendResponse>('/api/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (d.ok || d.success) {
        notify('ok', kind === 'text' ? `Đã gửi cho ${targetName(chat_id)} ✓` : `Đã gửi ${kind} ✓`)
        if (kind !== 'sticker') setText('')
      } else {
        notify('err', `Gửi thất bại: ${d.error ?? 'lỗi không rõ'}`)
      }
    } catch (e) {
      notify('err', `Lỗi gửi: ${String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="m-card-list">
      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">GỬI TIN THỬ</span>
          <h3>Gửi trên Zalo như robot</h3>
        </div>

        <div className="m-field">
          <span className="m-field-label">Gửi tới</span>
          <select className="m-select" value={target} onChange={(e) => setTarget(e.target.value)} disabled={chats.length === 0}>
            {chats.length === 0 && <option value="">(Chưa có ai nhắn bot)</option>}
            {chats.map((c) => (
              <option key={c.chat_id} value={c.chat_id}>
                {c.type === 'GROUP' ? `Nhóm · ${c.name}` : `${c.name}${c.is_owner ? ' ★ bạn' : ''}`}
              </option>
            ))}
          </select>
        </div>

        <div className="m-field">
          <span className="m-field-label">{busy === 'image' ? 'Mô tả ảnh cần vẽ' : 'Nội dung tin nhắn'}</span>
          <textarea
            className="m-textarea"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhập nội dung…"
          />
        </div>

        <div className="m-send-grid">
          <button className="m-sendbtn primary" onClick={() => send('text')} disabled={busy !== null || !text.trim() || !target}>
            {busy === 'text' ? <Spinner /> : <Send size={16} />}
            <span>Tin</span>
          </button>
          <button className="m-sendbtn" onClick={() => send('voice')} disabled={busy !== null || !text.trim() || !target}>
            {busy === 'voice' ? <Spinner /> : <Mic size={16} />}
            <span>Voice</span>
          </button>
          <button className="m-sendbtn green" onClick={() => send('sticker')} disabled={busy !== null || !target}>
            {busy === 'sticker' ? <Spinner /> : <Smile size={16} />}
            <span>Sticker</span>
          </button>
          <button className="m-sendbtn cyan" onClick={() => send('image')} disabled={busy !== null || !text.trim() || !target}>
            {busy === 'image' ? <Spinner /> : <ImagePlus size={16} />}
            <span>Ảnh AI</span>
          </button>
        </div>
      </section>

      <section className="m-note">
        <span>💡</span>
        <p>
          Dùng <b>Gửi tin</b> để test voice, sticker hay gửi lệnh nhanh tới từng chat ngay từ
          điện thoại — giống nút thử trên dashboard máy tính.
        </p>
      </section>
    </div>
  )
}

function Spinner() {
  return <span className="m-spinner" />
}