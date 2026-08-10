'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, Bot, CalendarClock, CheckCircle2, CloudSun, FileClock, MapPin, MessageSquare, RefreshCw, Save, Settings2, Users, Wifi, X, XCircle } from 'lucide-react'

type Status = {
  bot_running: boolean
  bot_error: string | null
  message_count: number
  text_count: number
  photo_count: number
  error_count: number
  unique_users: number
  avg_response_seconds: number
  last_message_at: string | null
  uptime_seconds: number
}

type Period = { start: string; end: string; subject: string }
type Schedule = Record<string, Period[]>
type Settings = {
  owner_chat_id: string | null
  morning_greeting: { enabled: boolean; time: string }
  location: { name: string; lat: number | null; lon: number | null }
  schedule: Schedule
}

type Conversation = {
  display_name: string
  chat_id: string
  type: string
  user_text: string
  bot_reply: string
  sent_at: string
  received_at: string
  responded_at: string
  duration: number
}

const days: [string, string][] = [['Mon','Thứ Hai'],['Tue','Thứ Ba'],['Wed','Thứ Tư'],['Thu','Thứ Năm'],['Fri','Thứ Sáu'],['Sat','Thứ Bảy'],['Sun','Chủ Nhật']]
const emptySchedule = (): Schedule => Object.fromEntries(days.map(([d]) => [d, []]))

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [tab, setTab] = useState<'overview'|'conversations'|'logs'|'settings'>('overview')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/status', { cache: 'no-store' })
      if (!r.ok) throw new Error(await r.text())
      setStatus(await r.json())
      setError('')
    } catch (e) { setError(`Không thể kết nối bot: ${String(e)}`) }
  }, [])

  const loadSettings = useCallback(async () => {
    try {
      const r = await fetch('/api/settings', { cache: 'no-store' })
      if (!r.ok) throw new Error(await r.text())
      const data = await r.json()
      setSettings({
        owner_chat_id: data.owner_chat_id ?? null,
        morning_greeting: data.morning_greeting ?? { enabled: true, time: '06:00' },
        location: data.location ?? { name: '', lat: null, lon: null },
        schedule: { ...emptySchedule(), ...(data.schedule ?? {}) },
      })
    } catch (e) { setError(`Không tải được cài đặt bot: ${String(e)}`) }
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const r = await fetch('/api/conversations', { cache: 'no-store' })
      if (!r.ok) return
      const data = await r.json()
      setConversations(data.conversations ?? [])
    } catch { /* dashboard remains usable */ }
  }, [])

  useEffect(() => {
    Promise.all([loadStatus(), loadSettings(), loadConversations()]).finally(() => setLoading(false))
    const timer = window.setInterval(() => { loadStatus(); loadConversations() }, 5000)
    return () => window.clearInterval(timer)
  }, [loadStatus, loadSettings, loadConversations])

  useEffect(() => {
    const source = new EventSource('/api/logs')
    source.onmessage = (event) => setLogs(prev => [...prev, event.data].slice(-300))
    source.onerror = () => { /* EventSource reconnects automatically */ }
    return () => source.close()
  }, [])

  const uptime = useMemo(() => {
    const seconds = status?.uptime_seconds ?? 0
    const d = Math.floor(seconds / 86400), h = Math.floor(seconds % 86400 / 3600), m = Math.floor(seconds % 3600 / 60)
    return d ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`
  }, [status])

  async function saveSettings() {
    if (!settings) return
    setSaving(true); setSaveMessage('')
    try {
      const r = await fetch('/api/settings', { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(settings) })
      if (!r.ok) throw new Error(await r.text())
      setSaveMessage('Đã lưu vào bot thật ✓')
      setTimeout(() => setSaveMessage(''), 2500)
    } catch (e) { setSaveMessage(`Lỗi: ${String(e)}`) }
    finally { setSaving(false) }
  }

  function updatePeriod(day: string, index: number, field: keyof Period, value: string) {
    if (!settings) return
    const next = structuredClone(settings.schedule)
    next[day][index][field] = value
    setSettings({...settings, schedule: next})
  }

  function addPeriod(day: string) {
    if (!settings) return
    const next = structuredClone(settings.schedule)
    next[day] = [...(next[day] ?? []), {start:'', end:'', subject:''}]
    setSettings({...settings, schedule: next})
  }

  function removePeriod(day: string, index: number) {
    if (!settings) return
    const next = structuredClone(settings.schedule)
    next[day].splice(index, 1)
    setSettings({...settings, schedule: next})
  }

  return (
    <main className="shell">
      <style jsx global>{styles}</style>
      <div className="orb orbA"/><div className="orb orbB"/>
      <aside className="sidebar glass">
        <div className="brand"><span className="brandIcon"><Bot size={21}/></span><span><b>TBZ-BOT</b><small>CONTROL CENTER</small></span></div>
        <div className="navTitle">WORKSPACE</div>
        {([['overview','Tổng quan',Activity],['conversations','Hội thoại',MessageSquare],['logs','Live Logs',FileClock],['settings','Scheduler & Cài đặt',Settings2]] as const).map(([id,label,Icon]) => <button key={id} className={`nav ${tab===id?'active':''}`} onClick={()=>setTab(id)}><Icon size={17}/>{label}</button>)}
        <div className="sideBottom"><div className="connection"><span className={status?.bot_running?'greenDot':'redDot'}/><div><b>{status?.bot_running?'Bot đang online':'Bot đang offline'}</b><small>API connection</small></div></div></div>
      </aside>

      <section className="main">
        <header className="top glass"><div><span className="muted">TBZ-BOT /</span> <b>{tab==='overview'?'Tổng quan':tab==='conversations'?'Hội thoại':tab==='logs'?'Live Logs':'Scheduler & Cài đặt'}</b></div><div className="topRight"><span className={status?.bot_running?'live':'offline'}><i/> {status?.bot_running?'LIVE':'OFFLINE'}</span><button className="icon" onClick={()=>{loadStatus();loadSettings();loadConversations()}} title="Refresh"><RefreshCw size={16}/></button></div></header>

        <div className="content">
          {error && <div className="alert"><XCircle size={16}/>{error}</div>}
          {tab==='overview' && <Overview status={status} uptime={uptime} conversations={conversations} onSettings={()=>setTab('settings')} />}
          {tab==='conversations' && <ConversationPanel conversations={conversations}/>} 
          {tab==='logs' && <LogPanel logs={logs}/>} 
          {tab==='settings' && settings && <SettingsPanel settings={settings} setSettings={setSettings} updatePeriod={updatePeriod} addPeriod={addPeriod} removePeriod={removePeriod} save={saveSettings} saving={saving} message={saveMessage}/>} 
          {loading && <div className="loading">Đang kết nối bot…</div>}
        </div>
      </section>
    </main>
  )
}

function Overview({status, uptime, conversations, onSettings}:{status:Status|null; uptime:string; conversations:Conversation[]; onSettings:()=>void}) {
  return <>
    <div className="hero"><div><span className="eyebrow">TBZ-BOT / PRODUCTION</span><h1>Bot đang {status?.bot_running?'hoạt động':'ngoại tuyến'}.</h1><p>Dashboard này đọc và ghi trực tiếp vào bot đang chạy. Không dùng số liệu giả.</p></div><button className="primary" onClick={onSettings}><Settings2 size={16}/> Cấu hình bot</button></div>
    <div className="stats">
      <Stat icon={Wifi} label="TRẠNG THÁI" value={status?.bot_running?'ONLINE':'OFFLINE'} good={!!status?.bot_running}/><Stat icon={Activity} label="UPTIME" value={uptime}/><Stat icon={MessageSquare} label="TIN NHẮN" value={String(status?.message_count ?? '—')} meta={`${status?.text_count ?? 0} text · ${status?.photo_count ?? 0} ảnh`}/><Stat icon={Users} label="NGƯỜI DÙNG" value={String(status?.unique_users ?? '—')} meta={`${conversations.length} hội thoại đang lưu`}/>
    </div>
    <div className="grid2"><section className="card glass"><Head icon={Activity} title="Bot health"/><div className="health"><div><span>Phản hồi trung bình</span><b>{status?.avg_response_seconds ?? 0}s</b></div><div><span>Lỗi</span><b className={status?.error_count?'bad':''}>{status?.error_count ?? 0}</b></div><div><span>Hoạt động cuối</span><b>{status?.last_message_at ?? 'Chưa có'}</b></div></div>{status?.bot_error&&<div className="errorBox">{status.bot_error}</div>}</section><section className="card glass"><Head icon={CalendarClock} title="Morning scheduler"/><div className="schedulerPreview"><div className="bigTime">06:00</div><div><b>Chào buổi sáng + thời tiết</b><span>Weather chỉ được gọi một lần/ngày tại thời điểm gửi.</span></div></div><button className="linkBtn" onClick={onSettings}>Mở cài đặt scheduler →</button></section></div>
    <section className="card glass"><Head icon={MessageSquare} title="Hội thoại gần nhất"/><ConversationRows conversations={conversations.slice(0,5)}/></section>
  </>
}
function Stat({icon:Icon,label,value,meta,good}:{icon:any;label:string;value:string;meta?:string;good?:boolean}){return <div className="stat glass"><span className="statIcon"><Icon size={17}/></span><small>{label}</small><strong className={good?'good':''}>{value}</strong>{meta&&<span>{meta}</span>}</div>}
function Head({icon:Icon,title}:{icon:any;title:string}){return <div className="head"><div><Icon size={16}/><b>{title}</b></div></div>}
function ConversationPanel({conversations}:{conversations:Conversation[]}){return <section className="card glass"><Head icon={MessageSquare} title={`Hội thoại (${conversations.length})`}/><ConversationRows conversations={conversations}/></section>}
function ConversationRows({conversations}:{conversations:Conversation[]}){if(!conversations.length)return <div className="empty">Chưa có hội thoại. Hãy nhắn tin cho bot trên Zalo để dữ liệu xuất hiện.</div>;return <div className="rows">{conversations.map((c,i)=><article className="conversation" key={`${c.chat_id}-${c.received_at}-${i}`}><div className="convTop"><b>{c.display_name || c.chat_id}</b><span>{c.received_at} · {c.duration}s</span></div><div className="userMsg">{c.user_text || '[ảnh]'}</div><div className="botMsg">{c.bot_reply || '[không có phản hồi text]'}</div></article>)}</div>}
function LogPanel({logs}:{logs:string[]}){return <section className="card glass"><Head icon={FileClock} title={`Live Logs (${logs.length})`}/><div className="terminal">{logs.length?<>{logs.map((l,i)=><div key={`${i}-${l}`}><span>{l}</span></div>)}</>:<div className="empty">Đang chờ log realtime từ bot…</div>}</div></section>}
function SettingsPanel({settings,setSettings,updatePeriod,addPeriod,removePeriod,save,saving,message}:{settings:Settings;setSettings:(s:Settings)=>void;updatePeriod:(d:string,i:number,f:keyof Period,v:string)=>void;addPeriod:(d:string)=>void;removePeriod:(d:string,i:number)=>void;save:()=>void;saving:boolean;message:string}){return <><div className="hero"><div><span className="eyebrow">LIVE CONFIGURATION</span><h1>Điều khiển bot thật.</h1><p>Mọi thay đổi ở đây được PUT trực tiếp xuống FastAPI của bot và lưu bằng storage.py.</p></div><button className="primary" onClick={save} disabled={saving}><Save size={16}/>{saving?'Đang lưu…':'Lưu cài đặt'}</button></div>{message&&<div className="saveMessage"><CheckCircle2 size={16}/>{message}</div>}<div className="grid2"><section className="card glass"><Head icon={Bot} title="Chủ bot"/><label>Owner chat ID<input value={settings.owner_chat_id??''} onChange={e=>setSettings({...settings,owner_chat_id:e.target.value||null})} placeholder="Tự động ghi nhận khi người đầu tiên nhắn bot"/></label></section><section className="card glass"><Head icon={CloudSun} title="Chào buổi sáng"/><div className="toggleRow"><label className="switch"><input type="checkbox" checked={settings.morning_greeting.enabled} onChange={e=>setSettings({...settings,morning_greeting:{...settings.morning_greeting,enabled:e.target.checked}})}/><span/></label><b>{settings.morning_greeting.enabled?'Đang bật':'Đang tắt'}</b><input className="time" type="time" value={settings.morning_greeting.time} onChange={e=>setSettings({...settings,morning_greeting:{...settings.morning_greeting,time:e.target.value}})}/></div><p className="hint">Scheduler kiểm tra mỗi phút nhưng weather chỉ được gọi một lần trong ngày khi tới đúng giờ này.</p></section></div><section className="card glass"><Head icon={MapPin} title="Địa điểm thời tiết"/><div className="form3"><label>Tên địa điểm<input value={settings.location.name??''} onChange={e=>setSettings({...settings,location:{...settings.location,name:e.target.value}})} /></label><label>Latitude<input type="number" step="0.0001" value={settings.location.lat??''} onChange={e=>setSettings({...settings,location:{...settings.location,lat:e.target.value===''?null:Number(e.target.value)}})} /></label><label>Longitude<input type="number" step="0.0001" value={settings.location.lon??''} onChange={e=>setSettings({...settings,location:{...settings.location,lon:e.target.value===''?null:Number(e.target.value)}})} /></label></div></section><section className="card glass"><Head icon={CalendarClock} title="Thời khóa biểu"/>{days.map(([day,label])=><div className="day" key={day}><b>{label}</b>{(settings.schedule[day]??[]).map((p,i)=><div className="period" key={`${day}-${i}`}><input type="time" value={p.start} onChange={e=>updatePeriod(day,i,'start',e.target.value)}/><span>→</span><input type="time" value={p.end} onChange={e=>updatePeriod(day,i,'end',e.target.value)}/><input className="subject" value={p.subject} placeholder="Môn học" onChange={e=>updatePeriod(day,i,'subject',e.target.value)}/><button className="remove" onClick={()=>removePeriod(day,i)}><X size={14}/></button></div>)}<button className="add" onClick={()=>addPeriod(day)}>+ Thêm tiết</button></div>)}</section></>}

const styles = `
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#070a12;color:#edf2ff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.shell{min-height:100vh;display:flex;background:radial-gradient(circle at 20% 0%,#182040 0,transparent 35%),radial-gradient(circle at 90% 10%,#102c35 0,transparent 30%),#070a12;position:relative;overflow:hidden}.orb{position:fixed;border-radius:999px;filter:blur(90px);opacity:.22;pointer-events:none}.orbA{width:320px;height:320px;background:#7c5cff;left:15%;top:-150px}.orbB{width:280px;height:280px;background:#27d9ed;right:-100px;bottom:10%}.glass{background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(255,255,255,.025));border:1px solid rgba(255,255,255,.09);box-shadow:0 24px 80px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.06);backdrop-filter:blur(22px)}.sidebar{width:250px;margin:18px;padding:22px 14px;border-radius:24px;display:flex;flex-direction:column;position:relative;z-index:2}.brand{display:flex;gap:11px;align-items:center;padding:4px 8px 25px}.brandIcon{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:linear-gradient(135deg,#8d72ff,#45dff2);color:#07101b}.brand b{display:block;font-size:15px;letter-spacing:.08em}.brand small{display:block;color:#74809a;font-size:9px;letter-spacing:.18em;margin-top:2px}.navTitle{font-size:9px;color:#5e6880;letter-spacing:.18em;padding:0 10px 9px}.nav{border:0;background:transparent;color:#7e899f;width:100%;padding:11px 12px;border-radius:12px;display:flex;gap:11px;align-items:center;cursor:pointer;text-align:left;font-size:13px;margin:2px 0}.nav:hover{background:#ffffff08;color:#dfe7fa}.nav.active{background:linear-gradient(90deg,#ffffff12,#ffffff05);color:#fff;box-shadow:inset 2px 0 #9c86ff}.sideBottom{margin-top:auto}.connection{display:flex;align-items:center;gap:10px;border:1px solid #ffffff0b;background:#ffffff04;border-radius:14px;padding:12px}.connection b{font-size:12px}.connection small{display:block;color:#66718a;font-size:10px;margin-top:2px}.greenDot,.redDot{width:8px;height:8px;border-radius:50%;background:#5de5a1;box-shadow:0 0 12px #5de5a1}.redDot{background:#ff657c;box-shadow:0 0 12px #ff657c}.main{flex:1;min-width:0;padding:18px 18px 30px;position:relative;z-index:1}.top{height:62px;border-radius:18px;padding:0 18px;display:flex;align-items:center;justify-content:space-between}.muted,.hint{color:#69748c}.topRight{display:flex;align-items:center;gap:15px}.live,.offline{font-size:10px;letter-spacing:.14em;color:#6ef0b0}.live i,.offline i{display:inline-block;width:6px;height:6px;background:#64e9aa;border-radius:50%;margin-right:5px}.offline{color:#ff7284}.offline i{background:#ff7284}.icon{border:1px solid #ffffff12;background:#ffffff06;color:#aab4ca;width:34px;height:34px;border-radius:10px;display:grid;place-items:center;cursor:pointer}.content{max-width:1280px;margin:0 auto;padding:28px 8px}.hero{display:flex;justify-content:space-between;align-items:end;gap:20px;margin:8px 0 26px}.eyebrow{font-size:10px;letter-spacing:.2em;color:#7c8aa6}.hero h1{font-size:clamp(30px,4vw,48px);letter-spacing:-.04em;margin:9px 0 8px}.hero p{color:#758199;max-width:650px;margin:0;font-size:14px}.primary{border:0;border-radius:12px;padding:11px 15px;background:linear-gradient(135deg,#9279ff,#48d8eb);color:#07101a;font-weight:750;display:flex;gap:8px;align-items:center;cursor:pointer;white-space:nowrap}.primary:disabled{opacity:.6}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:12px}.stat{border-radius:18px;padding:16px;min-height:130px}.statIcon{width:34px;height:34px;border-radius:10px;background:#ffffff08;display:grid;place-items:center;color:#9d8aff}.stat small{display:block;color:#66728a;font-size:9px;letter-spacing:.15em;margin-top:13px}.stat strong{display:block;font-size:27px;margin-top:4px}.stat span:last-child{display:block;color:#68748b;font-size:11px;margin-top:5px}.good{color:#6ee7ac}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.card{border-radius:20px;padding:18px;margin-bottom:12px}.head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.head>div{display:flex;align-items:center;gap:9px;color:#91a0bb}.head b{color:#e8edfa;font-size:14px}.health{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.health div{padding:13px;border-radius:13px;background:#ffffff04;border:1px solid #ffffff07}.health span,.health b{display:block}.health span{font-size:10px;color:#66728a}.health b{margin-top:8px;font-size:17px}.bad{color:#ff7184}.errorBox,.alert{color:#ff8c9b;background:#ff52670d;border:1px solid #ff52671f;padding:10px 12px;border-radius:10px;margin-top:12px;font-size:12px}.alert{display:flex;gap:8px;margin-bottom:12px}.schedulerPreview{display:flex;align-items:center;gap:18px}.bigTime{font-size:38px;font-weight:800;letter-spacing:-.05em;color:#a493ff}.schedulerPreview b,.schedulerPreview span{display:block}.schedulerPreview span{color:#6d7890;font-size:11px;margin-top:5px}.linkBtn,.add{border:0;background:none;color:#7fe2f0;padding:10px 0;cursor:pointer;font-size:12px}.rows{display:flex;flex-direction:column;gap:8px}.conversation{border:1px solid #ffffff09;background:#ffffff03;border-radius:13px;padding:13px}.convTop{display:flex;justify-content:space-between;gap:10px}.convTop b{font-size:12px}.convTop span{font-size:10px;color:#657089}.userMsg{color:#c7b9ff;font-size:13px;margin:10px 0 6px}.botMsg{color:#b8c1d2;font-size:13px;white-space:pre-wrap}.empty,.loading{text-align:center;padding:45px;color:#68738a;font-size:13px}.terminal{background:#05070c;border:1px solid #ffffff0a;border-radius:13px;padding:14px;min-height:55vh;max-height:65vh;overflow:auto;font:12px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;color:#8fe7b4}.terminal div{white-space:pre-wrap}.saveMessage{color:#6ee7ac;background:#62e8aa0d;border:1px solid #62e8aa20;border-radius:10px;padding:10px 12px;display:flex;gap:8px;margin-bottom:12px;font-size:12px}.card label{display:block;color:#79859b;font-size:11px}.card input{display:block;width:100%;margin-top:7px;border:1px solid #ffffff0d;background:#080c15;color:#e9efff;border-radius:10px;padding:10px 11px;outline:none}.card input:focus{border-color:#8c7cff66}.toggleRow{display:flex;align-items:center;gap:12px}.toggleRow .time{width:130px;margin:0}.switch input{display:none}.switch span{display:block;width:42px;height:24px;border-radius:20px;background:#273044;position:relative;cursor:pointer}.switch span:after{content:'';position:absolute;width:18px;height:18px;border-radius:50%;left:3px;top:3px;background:#8994a9;transition:.2s}.switch input:checked+span{background:#5f50c9}.switch input:checked+span:after{left:21px;background:#fff}.form3{display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:12px}.day{padding:14px 0;border-top:1px solid #ffffff08}.day>b{display:block;color:#a6b0c5;font-size:12px;margin-bottom:9px}.period{display:grid;grid-template-columns:125px 18px 125px 1fr 34px;gap:8px;align-items:center;margin:7px 0}.period input{margin:0}.period .subject{min-width:0}.period span{color:#566178;text-align:center}.remove{height:35px;border:1px solid #ffffff0b;background:#ffffff05;color:#ff7184;border-radius:9px;display:grid;place-items:center;cursor:pointer}.add{padding:7px 0}.hero-actions{display:flex;gap:8px}
@media(max-width:900px){.sidebar{width:210px}.stats{grid-template-columns:1fr 1fr}.grid2{grid-template-columns:1fr}.period{grid-template-columns:105px 15px 105px 1fr 34px}}
@media(max-width:680px){.shell{display:block}.sidebar{position:sticky;top:8px;width:auto;margin:8px;border-radius:18px;padding:10px;z-index:5}.brand{padding:3px 6px 10px}.navTitle{display:none}.sidebar nav{}.nav{display:none}.nav.active{display:flex;box-shadow:none}.sideBottom{display:none}.main{padding:8px}.top{height:54px}.content{padding:18px 3px}.hero{align-items:start;flex-direction:column}.hero h1{font-size:34px}.stats{grid-template-columns:1fr 1fr}.stat{min-height:110px}.grid2{grid-template-columns:1fr}.health{grid-template-columns:1fr 1fr}.form3{grid-template-columns:1fr}.period{grid-template-columns:1fr 15px 1fr 1fr 34px}.period .subject{grid-column:1/5}.period .remove{grid-column:5;grid-row:1/3}.terminal{min-height:50vh}.topRight .live,.topRight .offline{display:none}}
`
