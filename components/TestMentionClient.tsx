'use client'

import { useCallback, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bot, FlaskConical, KeyRound, RefreshCw, Send, ShieldCheck } from 'lucide-react'
import { api, ApiAuthError, setToken } from '@/lib/client'
import type { ChatInfo, TestSendResponse } from '@/lib/types'

type Mode = 'plain' | 'group' | 'at_all'

const MODE_LABEL: Record<Mode, string> = {
  plain: 'Không tag (đối chứng)',
  group: '[@group_id] + nội dung',
  at_all: '@all + nội dung',
}

export default function TestMentionClient() {
  const [token, setTokenValue] = useState('')
  const [authFailed, setAuthFailed] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)
  const [target, setTarget] = useState('')
  const [text, setText] = useState('')
  const [mode, setMode] = useState<Mode>('group')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<TestSendResponse | null>(null)
  const [err, setErr] = useState('')

  const chatsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: () => api<{ chats: ChatInfo[] }>('/api/chats'),
    retry: false,
  })
  const chats = useMemo(() => chatsQuery.data?.chats ?? [], [chatsQuery.data])
  const groups = useMemo(() => chats.filter((c) => c.type === 'GROUP'), [chats])

  const retryAuth = useCallback(() => {
    setAuthFailed(false)
    chatsQuery.refetch()
  }, [chatsQuery])

  if (authFailed) {
    return (
      <div className="login-wrap">
        <form
          className="login-card"
          onSubmit={(e) => {
            e.preventDefault()
            ;(async () => {
              if (!token.trim()) return
              setAuthBusy(true)
              try {
                setToken(token.trim())
                setAuthFailed(false)
                chatsQuery.refetch()
              } catch {
                setAuthFailed(true)
              } finally {
                setAuthBusy(false)
              }
            })()
          }}
        >
          <div className="rail-logo" style={{ margin: 0 }}>
            <ShieldCheck size={24} />
          </div>
          <h1>Đăng nhập quản trị</h1>
          <p style={{ color: 'var(--text-2)', margin: 0, fontSize: 13 }}>
            Web đã bật ADMIN_TOKEN. Nhập token (giống biến môi trường{' '}
            <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 6 }}>ADMIN_TOKEN</code>) để dùng trang test.
          </p>
          <div className="field">
            <span>ADMIN_TOKEN</span>
            <input className="input" type="password" value={token} onChange={(e) => setTokenValue(e.target.value)} placeholder="••••••••" autoFocus />
          </div>
          <button className="btn btn-primary" disabled={authBusy || !token.trim()}>
            {authBusy ? <span className="spinner" /> : <KeyRound size={15} />}
            {authBusy ? 'Đang kiểm tra…' : 'Tiếp tục'}
          </button>
        </form>
      </div>
    )
  }

  const sendOne = async (m: Mode) => {
    if (!target || !text.trim()) return
    if (!groups.some((g) => g.chat_id === target)) {
      setErr('Đích chọn không phải nhóm Zalo — chọn 1 nhóm trong dropdown')
      return
    }
    setBusy(true)
    setErr('')
    setResult(null)
    try {
      const mention = m === 'plain' ? undefined : m
      const d = await api<TestSendResponse>('/api/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'text', text: text.trim(), chat_id: target, mention }),
      })
      setResult(d)
    } catch (e) {
      setErr(e instanceof ApiAuthError ? 'Cần đăng nhập lại' : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', width: '100%', maxWidth: 720, margin: '0 auto', padding: '24px 16px 64px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div className="rail-logo" style={{ margin: 0, width: 44, height: 44 }}>
          <FlaskConical size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 20, letterSpacing: '-0.02em' }}>Test tag @all trên nhóm Zalo</h1>
          <p style={{ margin: '3px 0 0', color: 'var(--text-2)', fontSize: 13 }}>
            Muốn biết Bot API có render mention thật không — gửi thử và mở Zalo kiểm tra.
          </p>
        </div>
        <button
          className="icon-btn"
          onClick={() => chatsQuery.refetch()}
          disabled={chatsQuery.isFetching}
          aria-label="Làm mới danh sách nhóm"
        >
          <RefreshCw size={15} className={chatsQuery.isFetching ? 'spin' : ''} />
        </button>
      </header>

      <div className="login-card" style={{ maxWidth: 'none', gap: 18 }}>
        <div className="field">
          <span>Nhóm Zalo đích</span>
          <select className="select" value={target} onChange={(e) => setTarget(e.target.value)} disabled={groups.length === 0}>
            {groups.length === 0 && <option value="">(Chưa thấy nhóm nào — nhắn bot trong nhóm trước)</option>}
            {groups.map((g) => (
              <option key={g.chat_id} value={g.chat_id}>
                {g.name} ({g.member_names.length ? `đã gặp ${g.member_names.length} thành viên` : 'no info'})
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <span>Nội dung thông báo</span>
          <textarea className="textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder="Nhập thông báo cần thử…" />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <span>Cách gửi (chọn cách để so sánh)</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['plain', 'group', 'at_all'] as Mode[]).map((m) => (
              <label key={m} className="toggle-row" style={{ cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="mention-mode"
                  checked={mode === m}
                  onChange={() => setMode(m)}
                  style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{MODE_LABEL[m]}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={busy || !target || !text.trim()} onClick={() => sendOne(mode)}>
            {busy ? <span className="spinner" /> : <Send size={14} />}
            Gửi thử {MODE_LABEL[mode].toLowerCase()}
          </button>
          <button className="btn btn-green" disabled={busy || !target || !text.trim()} onClick={() => sendOne('group')}>
            <Bot size={14} />
            Chỉ thử [@group_id]
          </button>
        </div>

        {chatsQuery.isError && chatsQuery.error instanceof ApiAuthError ? (
          <div style={{ color: 'var(--red)', fontSize: 13 }}>
            Không tải được danh sách nhóm (cần đăng nhập).{' '}
            <button className="btn btn-sm" onClick={retryAuth}>
              Nhập token
            </button>
          </div>
        ) : null}
        {err && <div className="alert" style={{ marginBottom: 0 }}>Gửi thất bại: {err}</div>}
        {result && (
          <div
            style={{
              border: '1px solid var(--border-strong)',
              borderRadius: 14,
              padding: '12px 14px',
              fontSize: 13,
              background: 'rgba(52, 211, 153, 0.06)',
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 4, color: 'var(--green)' }}>Đã gửi ✓</div>
            <div style={{ color: 'var(--text-2)', marginBottom: 8 }}>
              Text thật đã gửi lên Zalo:
            </div>
            <code
              style={{
                display: 'block',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '10px 12px',
              }}
            >
              {result.sent_text ?? '(không rõ)'}
            </code>
          </div>
        )}
      </div>

      <div style={{ marginTop: 18, border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px', fontSize: 13, color: 'var(--text-2)' }}>
        <b style={{ color: 'var(--text)' }}>Cách kiểm tra kết quả:</b>
        <ol style={{ margin: '8px 0 0', paddingLeft: 20, display: 'grid', gap: 4 }}>
          <li>Mở nhóm trên app Zalo, xem tin vừa gửi.</li>
          <li>Nếu <b>tên nhóm hiện xanh/đậm</b> (mention) + thành viên nhận được thông báo → cú pháp <code>[@group_id]</code> hoạt động.</li>
          <li>Nếu hiện text thô <code>[@...]</code> hay <code>@all</code> thường → Bot API không hỗ trợ mention, phải chuyển hướng (OA API).</li>
        </ol>
      </div>
    </div>
  )
}