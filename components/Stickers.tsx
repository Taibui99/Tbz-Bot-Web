'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ClipboardCopy, Plus, Save, Send, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { Settings, Sticker } from '@/lib/types'
import { Empty, Panel, type ToastKind } from '@/components/ui'

type Props = {
  settings: Settings | null
  notify: (k: ToastKind, t: string) => void
}

const SUGGESTED_MOODS = ['vui', 'haha', 'buon', 'yeu', 'ghet', 'tuc', 'chao', 'bye', 'woa', 'camon', 'sinh_nhat', 'meme', 'chan', 'buon_ngu', 'nghi_ngo', 'dong_y']

const EMOJI: Record<string, string> = {
  vui: '😄', haha: '🤣', buon: '😢', yeu: '🥰', ghet: '😤', tuc: '😠', chao: '👋', bye: '🙋',
  woa: '😮', camon: '🙏', sinh_nhat: '🎂', meme: '🤡', chan: '😑', buon_ngu: '🥱', nghi_ngo: '🤨', dong_y: '👍',
}

export default function StickersTab({ settings, notify }: Props) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState<Sticker[] | null>(null)
  const [importText, setImportText] = useState('')

  useEffect(() => {
    if (draft === null && settings) {
      setDraft(
        Object.entries(settings.sticker_library ?? {}).map(([mood, s]) => ({
          mood,
          sticker_id: s?.sticker_id ?? '',
          verified_code: s?.verified_code ?? '',
        })),
      )
    }
  }, [settings, draft])

  const save = useMutation({
    mutationFn: async () => {
      const lib: Record<string, { sticker_id: string; verified_code: string }> = {}
      for (const s of draft ?? []) {
        if (!s.mood.trim()) continue
        lib[s.mood.trim()] = { sticker_id: s.sticker_id.trim(), verified_code: s.verified_code.trim() }
      }
      await api('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sticker_library: lib }) })
    },
    onSuccess: () => {
      notify('ok', 'Đã lưu thư viện sticker vào bot ✓')
      setDraft(null)
      qc.invalidateQueries({ queryKey: ['overview'] })
    },
    onError: (e) => notify('err', `Lỗi lưu: ${String(e)}`),
  })

  const test = useMutation({
    mutationFn: (mood: string) => {
      testMoodRef.current = mood
      return api<{ ok?: boolean; error?: string }>('/api/test-send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'sticker', mood }) })
    },
    onSuccess: (d) => notify(d.ok ? 'ok' : 'err', d.ok ? `Sticker "${testMoodRef.current}" đã gửi về chủ bot ✓` : `Gửi thất bại: ${d.error ?? ''}`),
    onError: (e) => notify('err', `Lỗi gửi sticker: ${String(e)}`),
  })
  const testMoodRef = useRef('')

  const update = (i: number, field: keyof Sticker, value: string) => {
    setDraft((prev) => (prev ? prev.map((s, n) => (n === i ? { ...s, [field]: value } : s)) : prev))
  }

  const addMood = () => {
    const used = new Set((draft ?? []).map((s) => s.mood))
    const next = SUGGESTED_MOODS.find((m) => !used.has(m))
    setDraft((prev) => [...(prev ?? []), { mood: next ?? `mood_${(prev?.length ?? 0) + 1}`, sticker_id: '', verified_code: '' }])
  }

  const remove = (i: number) => setDraft((prev) => (prev ? prev.filter((_, n) => n !== i) : prev))

  const exportJson = () => {
    const lib = Object.fromEntries((draft ?? []).map((s) => [s.mood, { sticker_id: s.sticker_id, verified_code: s.verified_code }]))
    navigator.clipboard.writeText(JSON.stringify(lib, null, 2)).then(
      () => notify('ok', 'Đã copy JSON thư viện sticker vào clipboard'),
      () => notify('err', 'Không copy được (cần quyền clipboard)'),
    )
  }

  const importJson = () => {
    try {
      const parsed = JSON.parse(importText)
      const entries = Object.entries(parsed)
      if (!entries.length) throw new Error('JSON rỗng')
      const list = entries.map(([mood, s]) => ({
        mood,
        sticker_id: String((s as Record<string, unknown>)?.sticker_id ?? ''),
        verified_code: String((s as Record<string, unknown>)?.verified_code ?? ''),
      }))
      setDraft(list)
      notify('ok', `Đã nạp ${list.length} sticker từ JSON`)
      setImportText('')
    } catch (e) {
      notify('err', `JSON không hợp lệ: ${String(e)}`)
    }
  }

  if (!settings) {
    return <Panel kicker="STICKERS" title="Thư viện sticker"><Empty text="Bot đang offline — chưa lấy được thư viện sticker." /></Panel>
  }

  const count = draft?.length ?? 0

  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <button className="btn" onClick={addMood}>
          <Plus size={15} /> Thêm mood
        </button>
        <button className="btn" onClick={exportJson}>
          <ClipboardCopy size={14} /> Export JSON
        </button>
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder='Import JSON: {"mood": {"sticker_id": "...", "verified_code": "..."}}' value={importText} onChange={(e) => setImportText(e.target.value)} />
        <button className="btn" onClick={importJson} disabled={!importText.trim()}>
          <Check size={14} /> Import
        </button>
        <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending || count === 0}>
          {save.isPending ? <span className="spinner" /> : <Save size={14} />}
          Lưu & áp dụng ({count})
        </button>
      </div>

      <Panel kicker="STICKER LIBRARY" title="Sticker bot có thể gửi" right={<span className="pill">{count} mood</span>}>
        {count === 0 ? (
          <Empty text="Chưa có sticker nào. Bấm 'Thêm mood', điền sticker_id (mã Zalo) rồi Lưu." />
        ) : (
          <div className="sticker-grid">
            {draft!.map((s, i) => (
              <div className="sticker-card" key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="sticker-emote">{EMOJI[s.mood] ?? '🏷️'}</div>
                  <input className="input" style={{ fontWeight: 650 }} value={s.mood} onChange={(e) => update(i, 'mood', e.target.value)} placeholder="mood" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <span>sticker_id (mã Zalo)</span>
                  <input className="input" value={s.sticker_id} onChange={(e) => update(i, 'sticker_id', e.target.value)} placeholder="vd 3eb5aad796927fcc2683" />
                </div>
                <div className="field" style={{ margin: 0 }}>
                  <span>verified_code</span>
                  <input className="input" value={s.verified_code} onChange={(e) => update(i, 'verified_code', e.target.value)} placeholder="vd 695d4808b5b6cf2cee1e" />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-green" style={{ flex: 1 }} onClick={() => test.mutate(s.mood)} disabled={test.isPending || !s.sticker_id && !s.verified_code}>
                    <Send size={13} /> Test gửi
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(i)}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  )
}