'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Activity, Bot, CloudSun, Gauge, LayoutDashboard, MessageSquare, Radio, ScrollText, Settings, Users, Zap } from 'lucide-react'

const nav = [
  { label: 'Tổng quan', icon: LayoutDashboard, active: true },
  { label: 'Hội thoại', icon: MessageSquare },
  { label: 'Logs', icon: ScrollText },
  { label: 'Người dùng', icon: Users },
  { label: 'Scheduler', icon: Radio },
  { label: 'Thời tiết', icon: CloudSun },
  { label: 'Cài đặt', icon: Settings },
]

const initialLogs = [
  ['14:32:08', 'scheduler', 'Morning greeting job armed', 'ok'],
  ['14:31:42', 'weather', 'Open-Meteo response received · 24°C', 'ok'],
  ['14:30:17', 'zalo', 'Message delivered to 12 recipients', 'ok'],
  ['14:28:04', 'gemini', 'Response generated · 842ms', 'info'],
  ['14:26:51', 'system', 'Health check completed', 'ok'],
]

export default function Home() {
  const [logs, setLogs] = useState(initialLogs)
  const [pulse, setPulse] = useState(98)
  useEffect(() => {
    const timer = setInterval(() => {
      setPulse((v) => Math.max(96, Math.min(100, v + (Math.random() > .5 ? 1 : -1))))
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const time = useMemo(() => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }), [])
  const addLog = () => setLogs((current) => [[time.format(new Date()), 'console', 'Dashboard connection verified', 'ok'], ...current].slice(0, 8))

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Bot size={19} /></div><div><b>TBZ-BOT</b><span>CONTROL CENTER</span></div></div>
        <div className="nav-label">WORKSPACE</div>
        <nav>{nav.map(({ label, icon: Icon, active }) => <button className={active ? 'nav-item active' : 'nav-item'} key={label}><Icon size={17}/><span>{label}</span>{active && <i />}</button>)}</nav>
        <div className="sidebar-bottom"><div className="mini-status"><span className="dot"/><div><b>Bot online</b><small>Render · production</small></div></div><button className="settings"><Settings size={16}/> Preferences</button></div>
      </aside>

      <section className="content">
        <header className="topbar"><div className="crumb"><span>TBZ-BOT</span><b>/</b><strong>Overview</strong></div><div className="top-actions"><span className="live"><span className="dot"/> LIVE</span><button className="icon-btn" aria-label="activity"><Activity size={18}/></button><div className="avatar">TB</div></div></header>

        <div className="page">
          <div className="hero-row"><div><div className="eyebrow"><Zap size={13}/> SYSTEM OVERVIEW</div><h1>Everything is <em>running.</em></h1><p>Monitor your bot, automations and connected services from one place.</p></div><button className="primary" onClick={addLog}><Radio size={16}/> Test connection</button></div>

          <div className="stats-grid">
            <Stat icon={Activity} label="SYSTEM STATUS" value="ONLINE" meta="All systems operational" live />
            <Stat icon={Gauge} label="UPTIME" value="2d 14h" meta="99.98% this month" />
            <Stat icon={MessageSquare} label="MESSAGES" value="1,284" meta="+18.4% this week" trend />
            <Stat icon={Users} label="USERS" value="42" meta="8 active right now" />
          </div>

          <div className="main-grid">
            <section className="panel logs-panel"><div className="panel-head"><div><span className="panel-kicker">ACTIVITY</span><h2>Live system logs</h2></div><button className="ghost">View all <span>→</span></button></div><div className="terminal"><div className="terminal-head"><span/><span/><span/><label>tbz-bot / production</label></div><div className="terminal-body">{logs.map(([t, source, message, type], i) => <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2, delay: i * .02 }} className="log-line" key={`${t}-${i}`}><time>{t}</time><b className={`tag ${type}`}>{source}</b><span>{message}</span><i>✓</i></motion.div>)}</div></div></section>
            <section className="panel health-panel"><div className="panel-head"><div><span className="panel-kicker">HEALTH</span><h2>Service status</h2></div><span className="tiny-live">OPERATIONAL</span></div><Service name="Zalo Gateway" value="Connected" latency="42ms"/><Service name="Gemini AI" value="Healthy" latency="842ms"/><Service name="Weather API" value="Healthy" latency="186ms"/><div className="health-score"><div><span>Overall health</span><strong>{pulse}%</strong></div><div className="bar"><motion.i animate={{ width: `${pulse}%` }} /></div></div></section>
          </div>

          <div className="bottom-grid"><section className="panel small-panel"><div className="panel-kicker">SCHEDULED</div><h3>Next automation</h3><div className="schedule"><div className="schedule-time">06:00<span>AM</span></div><div><b>Morning greeting</b><small>Weather briefing · Zalo</small></div><span className="scheduled-dot"/></div></section><section className="panel small-panel"><div className="panel-kicker">TODAY</div><h3>Quick metrics</h3><div className="metrics"><div><b>38</b><span>messages sent</span></div><div><b>12</b><span>AI requests</span></div><div><b>0</b><span>errors</span></div></div></section></div>
        </div>
      </section>
    </main>
  )
}

function Stat({ icon: Icon, label, value, meta, live, trend }: { icon: typeof Activity; label: string; value: string; meta: string; live?: boolean; trend?: boolean }) {
  return <motion.div className="stat-card" whileHover={{ y: -3 }} transition={{ duration: .18 }}><div className="stat-top"><span className="stat-icon"><Icon size={17}/></span>{live && <span className="status-pill"><span className="dot"/> LIVE</span>}</div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className={trend ? 'stat-meta positive' : 'stat-meta'}>{trend && '↗ '}{meta}</div></motion.div>
}
function Service({ name, value, latency }: { name: string; value: string; latency: string }) { return <div className="service"><span className="dot"/><div><b>{name}</b><small>{value}</small></div><code>{latency}</code></div> }
