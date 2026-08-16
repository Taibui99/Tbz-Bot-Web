'use client'

import { useEffect, useState } from 'react'
import { Check, ClipboardCopy, Plus, Save, Trash2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/client'
import type { Period, Schedule, Settings } from '@/lib/types'
import { DAYS, EMPTY_SCHEDULE, Empty, Panel, type ToastKind } from '@/components/ui'

type Props = {
  settings: Settings | null
  notify: (k: ToastKind, t: string) => void
}

type Draft = { morning_enabled: boolean; morning_time: string; schedule: Schedule }

export default function SchedulerTab({ settings, notify }: Props) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [importText, setImportText] = useState('')

  useEffect(() => {
    if (draft === null && settings) {
      setDraft({
        morning_enabled: settings.morning_greeting.enabled,
        morning_time: settings.morning_greeting.time,
        schedule: { ...EMPTY_SCHEDULE(), ...settings.schedule },
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
          morning_greeting: { enabled: draft.morning_enabled, time: draft.morning_time },
          schedule: draft.schedule,
        }),
      })
    },
    onSuccess: () => {
      notify('ok', 'Đã lưu scheduler vào bot ✓')
      setDraft(null)
      qc.invalidateQueries({ queryKey: ['overview'] })
    },
    onError: (e) => notify('err', `Lỗi lưu: ${String(e)}`),
  })

  if (!settings || !draft) {
    return <Panel kicker="SCHEDULER" title="Chào buổi sáng & thời khóa biểu"><Empty text="Bot đang offline — chưa lấy được cấu hình scheduler." /></Panel>
  }

  const setPeriod = (day: string, i: number, field: keyof Period, value: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      const list = [...(prev.schedule[day] ?? [])]
      list[i] = { ...list[i], [field]: value }
      return { ...prev, schedule: { ...prev.schedule, [day]: list } }
    })
  }

  const addPeriod = (day: string) => {
    setDraft((prev) => {
      if (!prev) return prev
      return { ...prev, schedule: { ...prev.schedule, [day]: [...(prev.schedule[day] ?? []), { start: '08:00', end: '09:00', subject: '' }] } }
    })
  }

  const removePeriod = (day: string, i: number) => {
    setDraft((prev) => {
      if (!prev) return prev
      return { ...prev, schedule: { ...prev.schedule, [day]: (prev.schedule[day] ?? []).filter((_, n) => n !== i) } }
    })
  }

  const copyDay = (from: string, to: string) => {
    if (from === to) return
    setDraft((prev) => {
      if (!prev) return prev
      return { ...prev, schedule: { ...prev.schedule, [to]: (prev.schedule[from] ?? []).map((p) => ({ ...p })) } }
    })
    notify('ok', `Đã copy lịch "${DAYS.find(([d]) => d === from)?.[1]}" sang "${DAYS.find(([d]) => d === to)?.[1]}"`)
  }

  const exportJson = () => {
    navigator.clipboard.writeText(JSON.stringify(draft.schedule, null, 2)).then(
      () => notify('ok', 'Đã copy JSON thời khóa biểu vào clipboard'),
      () => notify('err', 'Không copy được'),
    )
  }

  const importJson = () => {
    try {
      const parsed = JSON.parse(importText) as Record<string, Period[]>
      if (!Object.keys(parsed).length) throw new Error('JSON rỗng')
      setDraft((prev) => (prev ? { ...prev, schedule: { ...EMPTY_SCHEDULE(), ...parsed } } : prev))
      notify('ok', `Đã nạp lịch cho ${Object.keys(parsed).length} ngày`)
      setImportText('')
    } catch (e) {
      notify('err', `JSON không hợp lệ: ${String(e)}`)
    }
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <span className="spinner" /> : <Save size={14} />}
          Lưu scheduler
        </button>
        <button className="btn" onClick={exportJson}>
          <ClipboardCopy size={14} /> Export
        </button>
        <input className="input" style={{ flex: 1, minWidth: 200 }} placeholder='Import JSON: {"Mon": [{"start":"08:00","end":"09:00","subject":"..."}]}' value={importText} onChange={(e) => setImportText(e.target.value)} />
        <button className="btn" onClick={importJson} disabled={!importText.trim()}>
          <Check size={14} /> Import
        </button>
      </div>

      <Panel kicker="AUTOMATION" title="Chào buổi sáng" right={<span className={`pill ${draft.morning_enabled ? 'online' : 'offline'}`}>{draft.morning_enabled ? 'BẬT' : 'TẮT'}</span>}>
        <div className="toggle-row">
          <label className="switch">
            <input type="checkbox" checked={draft.morning_enabled} onChange={(e) => setDraft({ ...draft, morning_enabled: e.target.checked })} />
            <span className="track" />
          </label>
          <b>{draft.morning_enabled ? 'Bot sẽ chào buổi sáng & báo thời tiết' : 'Tắt chào buổi sáng'}</b>
          <input className="input" style={{ width: 110 }} type="time" value={draft.morning_time} onChange={(e) => setDraft({ ...draft, morning_time: e.target.value })} />
        </div>
      </Panel>

      <div style={{ marginTop: 16 }}>
        <Panel kicker="WEEKLY SCHEDULE" title="Thời khóa biểu" right={<span className="pill">{DAYS.reduce((n, [d]) => n + (draft.schedule[d]?.length ?? 0), 0)} tiết</span>}>
          {DAYS.map(([day, label]) => {
            const periods = draft.schedule[day] ?? []
            const todayIdx = new Date().getDay()
            const isToday = day === ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][todayIdx]
            return (
              <div className="sched-day" key={day}>
                <div className="sched-day-label">
                  <span style={isToday ? { color: 'var(--accent)' } : undefined}>
                    {label}
                    {isToday && <small> · hôm nay</small>}
                  </span>
                </div>
                <div className="sched-rows">
                  {periods.length === 0 && <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Không có tiết nào.</span>}
                  {periods.map((p, i) => (
                    <div className="sched-row" key={i}>
                      <input className="input" style={{ width: 92 }} type="time" value={p.start} onChange={(e) => setPeriod(day, i, 'start', e.target.value)} />
                      <input className="input" style={{ width: 92 }} type="time" value={p.end} onChange={(e) => setPeriod(day, i, 'end', e.target.value)} />
                      <input className="input" style={{ flex: 1, minWidth: 120 }} value={p.subject} onChange={(e) => setPeriod(day, i, 'subject', e.target.value)} placeholder="Môn học" />
                      <select className="select" style={{ width: 150 }} value="" onChange={(e) => e.target.value && copyDay(day, e.target.value)}>
                        <option value="">Copy → ngày…</option>
                        {DAYS.filter(([d]) => d !== day).map(([d, l]) => (
                          <option key={d} value={d}>
                            {l}
                          </option>
                        ))}
                      </select>
                      <button className="icon-btn" onClick={() => removePeriod(day, i)} aria-label="Xoá tiết">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => addPeriod(day)}>
                    <Plus size={13} /> Thêm tiết
                  </button>
                </div>
              </div>
            )
          })}
        </Panel>
      </div>
    </>
  )
}