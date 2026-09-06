'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Plus, Save, Trash2, Users } from 'lucide-react'
import { api } from '@/lib/client'
import type { ChatInfo, Period, Schedule, Settings } from '@/lib/types'
import { DAYS, EMPTY_SCHEDULE, type ToastKind } from '@/components/ui'

type Props = {
  settings: Settings | null
  notify: (k: ToastKind, t: string) => void
}

type Draft = {
  morning_enabled: boolean
  morning_time: string
  morning_text: string
  schedule: Schedule
  targets_enabled: boolean
  target_ids: string[]
}

const DEFAULT_MORNING_TEXT =
  '☀️ Chào buổi sáng! Hôm nay là {weekday}, {date}.\nThời tiết ở {location} hiện tại: {weather}.\nChúc bro 1 ngày học tập hiệu quả! 📚'

function todayKey(): string {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()]
}

export default function SchedulerTab({ settings, notify }: Props) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [day, setDay] = useState<string>(todayKey())

  const chatsQuery = useQuery({
    queryKey: ['chats'],
    queryFn: () => api<{ chats: ChatInfo[] }>('/api/chats'),
    refetchInterval: 60_000,
  })
  const chats = chatsQuery.data?.chats ?? []

  useEffect(() => {
    if (draft === null && settings) {
      const targets = settings.schedule_targets ?? { enabled: false, chat_ids: [] }
      setDraft({
        morning_enabled: settings.morning_greeting.enabled,
        morning_time: settings.morning_greeting.time,
        morning_text: settings.morning_greeting.text ?? DEFAULT_MORNING_TEXT,
        schedule: { ...EMPTY_SCHEDULE(), ...settings.schedule },
        targets_enabled: !!targets.enabled,
        target_ids: Array.isArray(targets.chat_ids) ? [...targets.chat_ids] : [],
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
          morning_greeting: {
            enabled: draft.morning_enabled,
            time: draft.morning_time,
            text: draft.morning_text,
          },
          schedule: draft.schedule,
          schedule_targets: {
            enabled: draft.targets_enabled,
            chat_ids: draft.target_ids,
          },
        }),
      })
    },
    onSuccess: () => {
      notify('ok', 'Đã lưu scheduler vào bot ✓')
      qc.invalidateQueries({ queryKey: ['overview'] })
    },
    onError: (e) => notify('err', `Lỗi lưu: ${String(e)}`),
  })

  if (!draft) {
    return (
      <div className="m-card-list">
        <section className="m-card">
          <div className="m-empty">Bot đang offline — chưa lấy được cấu hình scheduler.</div>
        </section>
      </div>
    )
  }

  const periods = draft.schedule[day] ?? []
  const dayLabel = DAYS.find(([d]) => d === day)?.[1] ?? day

  const setPeriod = (i: number, field: keyof Period, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const list = [...(prev.schedule[day] ?? [])]
      list[i] = { ...list[i], [field]: value }
      return { ...prev, schedule: { ...prev.schedule, [day]: list } }
    })
  }

  const addPeriod = () =>
    setDraft((prev) =>
      prev
        ? { ...prev, schedule: { ...prev.schedule, [day]: [...(prev.schedule[day] ?? []), { start: '08:00', end: '09:00', subject: '' }] } }
        : prev,
    )

  const removePeriod = (i: number) =>
    setDraft((prev) =>
      prev
        ? { ...prev, schedule: { ...prev.schedule, [day]: (prev.schedule[day] ?? []).filter((_, n) => n !== i) } }
        : prev,
    )

  const copyDay = (to: string) => {
    if (to === day) return
    setDraft((prev) =>
      prev ? { ...prev, schedule: { ...prev.schedule, [to]: (prev.schedule[day] ?? []).map((p) => ({ ...p })) } } : prev,
    )
    notify('ok', `Đã copy lịch "${dayLabel}" sang "${DAYS.find(([d]) => d === to)?.[1]}"`)
  }

  const toggleTarget = (chatId: string) =>
    setDraft((prev) => {
      if (!prev) return prev
      const set = new Set(prev.target_ids)
      if (set.has(chatId)) set.delete(chatId)
      else set.add(chatId)
      return { ...prev, target_ids: [...set] }
    })

  return (
    <div className="m-card-list">
      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">LƯU TẤT CẢ</span>
          <h3>Scheduler áp dụng ngay</h3>
        </div>
        <button className="m-sendbtn primary" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <span className="m-spinner" /> : <Save size={16} />}
          {save.isPending ? 'Đang lưu…' : 'Lưu scheduler'}
        </button>
      </section>

      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">AUTOMATION</span>
          <h3>Chào buổi sáng</h3>
        </div>
        <div className="m-toggle-row">
          <button
            className={`m-toggle ${draft.morning_enabled ? 'on' : ''}`}
            onClick={() => setDraft({ ...draft, morning_enabled: !draft.morning_enabled })}
            aria-pressed={draft.morning_enabled}
            aria-label="Bật / tắt chào buổi sáng"
          />
          <span className="m-toggle-txt">
            <b>{draft.morning_enabled ? 'Bot chào sáng & báo thời tiết' : 'Chào buổi sáng đang tắt'}</b>
            <small>
              {draft.morning_enabled ? `Gửi lúc ${draft.morning_time}` : `Chạm để bật (mặc định ${draft.morning_time})`}
            </small>
          </span>
        </div>
        <div className="m-field" style={{ marginTop: 12 }}>
          <span className="m-field-label">Giờ gửi</span>
          <input
            type="time"
            className="m-select"
            value={draft.morning_time}
            onChange={(e) => setDraft({ ...draft, morning_time: e.target.value })}
          />
        </div>
        <div className="m-field">
          <span className="m-field-label">
            Nội dung tin nhắn — giữ các mã {'{weekday}'} {'{date}'} {'{weather}'} {'{location}'} {'{time}'} để bot tự điền
          </span>
          <textarea
            className="m-textarea"
            rows={4}
            value={draft.morning_text}
            onChange={(e) => setDraft({ ...draft, morning_text: e.target.value })}
          />
        </div>
      </section>

      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">RECIPIENTS</span>
          <h3>Người nhận thông báo</h3>
        </div>
        <div className="m-toggle-row">
          <button
            className={`m-toggle ${draft.targets_enabled ? 'on' : ''}`}
            onClick={() => setDraft({ ...draft, targets_enabled: !draft.targets_enabled })}
            aria-pressed={draft.targets_enabled}
            aria-label="Chọn nhiều nơi nhận"
          />
          <span className="m-toggle-txt">
            <b>{draft.targets_enabled ? 'Gửi cho nhiều nơi' : 'Chỉ gửi cho chủ bot'}</b>
            <small>Chủ bot luôn nhận; có thể thêm nhóm & chat riêng bên dưới</small>
          </span>
        </div>
        {draft.targets_enabled && (
          <div className="m-chat-list">
            {chats.length === 0 && <div className="m-empty compact">Chưa có ai nhắn bot — sổ địa chỉ tự đầy khi có người chat.</div>}
            {chats.map((c) => {
              const checked = draft.target_ids.includes(c.chat_id)
              const owner = c.is_owner
              return (
                <button key={c.chat_id} className={`m-chatrow ${owner ? 'owner' : ''} ${checked || owner ? 'on' : ''}`} onClick={() => !owner && toggleTarget(c.chat_id)} disabled={owner}>
                  <span className={`m-chek ${checked || owner ? 'on' : ''}`}>{checked || owner ? <Check size={13} /> : null}</span>
                  <span className="m-chatrow-name">
                    <b>{c.type === 'GROUP' ? <Users size={12} /> : null} {c.name}</b>
                    <small>{owner ? 'chủ bot · luôn nhận' : `${c.message_count} tin`}</small>
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="m-card">
        <div className="m-card-head">
          <span className="m-card-kick">WEEKLY SCHEDULE</span>
          <h3>Thời khóa biểu · {dayLabel}</h3>
        </div>
        <div className="m-chip-row" role="tablist" aria-label="Chọn ngày trong tuần">
          {DAYS.map(([d, l]) => (
            <button key={d} className={`m-chip ${day === d ? 'on' : ''}`} onClick={() => setDay(d)} aria-pressed={day === d}>
              {l.replace('Thứ ', 'T')}
            </button>
          ))}
        </div>

        {periods.length === 0 ? (
          <div className="m-empty">{dayLabel} chưa có tiết nào.</div>
        ) : (
          <div className="m-sched-list">
            {periods.map((p, i) => (
              <div className="m-sched-row" key={i}>
                <div className="m-sched-time">
                  <input type="time" className="m-select" value={p.start} onChange={(e) => setPeriod(i, 'start', e.target.value)} aria-label="Bắt đầu" />
                  <span>→</span>
                  <input type="time" className="m-select" value={p.end} onChange={(e) => setPeriod(i, 'end', e.target.value)} aria-label="Kết thúc" />
                </div>
                <div className="m-sched-subj">
                  <input
                    className="m-input"
                    value={p.subject}
                    onChange={(e) => setPeriod(i, 'subject', e.target.value)}
                    placeholder="Môn học"
                  />
                  <button className="m-iconbtn" onClick={() => removePeriod(i)} aria-label="Xoá tiết">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="m-sendbtn" onClick={addPeriod} style={{ width: '100%', marginTop: 10 }}>
          <Plus size={15} /> Thêm tiết
        </button>

        <div className="m-field" style={{ marginTop: 14 }}>
          <span className="m-field-label">Copy lịch của {dayLabel} sang…</span>
          <div className="m-chip-row">
            {DAYS.filter(([d]) => d !== day).map(([d, l]) => (
              <button key={d} className="m-chip" onClick={() => copyDay(d)}>
                <Copy size={11} /> {l.replace('Thứ ', 'T')}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="m-note">
        <span>💡</span>
        <p>
          Sau khi <b>Lưu scheduler</b> bot áp dụng ngay. Lịch cá nhân các ngày độc lập — chạm
          chip ngày để sửa từng ngày.
        </p>
      </section>
    </div>
  )
}