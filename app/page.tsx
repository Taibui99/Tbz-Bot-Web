'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Bell,
  Bot,
  CalendarClock,
  ChevronDown,
  CloudSun,
  Command,
  Gauge,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Radio,
  ScrollText,
  Search,
  Send,
  Settings,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const nav = [
  { label: 'Tổng quan', icon: LayoutDashboard },
  { label: 'Hội thoại', icon: MessageSquare },
  { label: 'Logs', icon: ScrollText },
  { label: 'Người dùng', icon: Users },
  { label: 'Scheduler', icon: CalendarClock },
  { label: 'Thời tiết', icon: CloudSun },
]

const traffic = [
  { day: 'T2', messages: 38, ai: 16 },
  { day: 'T3', messages: 52, ai: 24 },
  { day: 'T4', messages: 44, ai: 21 },
  { day: 'T5', messages: 76, ai: 33 },
  { day: 'T6', messages: 61, ai: 28 },
  { day: 'T7', messages: 83, ai: 37 },
  { day: 'CN', messages: 57, ai: 25 },
]

const performance = [
  { day: '08', value: 52 }, { day: '09', value: 61 }, { day: '10', value: 58 },
  { day: '11', value: 74 }, { day: '12', value: 68 }, { day: '13', value: 86 },
  { day: '14', value: 79 }, { day: '15', value: 93 }, { day: '16', value: 88 },
]

const initialLogs = [
  ['14:32:08', 'scheduler', 'Morning greeting job armed', 'ok'],
  ['14:31:42', 'weather', 'Open-Meteo response received · 24°C', 'ok'],
  ['14:30:17', 'zalo', 'Message delivered to 12 recipients', 'ok'],
  ['14:28:04', 'gemini', 'Response generated · 842ms', 'info'],
  ['14:26:51', 'system', 'Health check completed', 'ok'],
]

export default function Home() {
  const [active, setActive] = useState('Tổng quan')
  const [logs, setLogs] = useState(initialLogs)
  const [pulse, setPulse] = useState(98)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifications, setNotifications] = useState(3)

  useEffect(() => {
    const timer = setInterval(() => {
      setPulse((v) => Math.max(96, Math.min(100, v + (Math.random() > .5 ? 1 : -1))))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const time = useMemo(
    () => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    [],
  )

  const addLog = () => {
    setLogs((current) => [
      [time.format(new Date()), 'console', 'Dashboard connection verified', 'ok'],
      ...current,
    ].slice(0, 8))
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-a" />
      <div className="ambient ambient-b" />

      <aside className="sidebar glass">
        <div className="brand">
          <div className="brand-mark"><Bot size={20} /></div>
          <div><b>TBZ-BOT</b><span>CONTROL CENTER</span></div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          {nav.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setActive(label)}
              className={active === label ? 'nav-item active' : 'nav-item'}
            >
              <Icon size={17} />
              <span>{label}</span>
              {active === label && <i />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="mini-status glass-soft">
            <span className="dot" />
            <div><b>Bot online</b><small>Render · production</small></div>
            <span className="online-ring" />
          </div>
          <button className="settings"><Settings size={16} /> Preferences</button>
        </div>
      </aside>

      <section className="content">
        <header className="topbar glass">
          <div className="crumb"><span>TBZ-BOT</span><b>/</b><strong>{active}</strong></div>
          <div className="top-actions">
            <button className="search-trigger" onClick={() => setSearchOpen((v) => !v)}><Search size={16} /><span>Search</span><kbd>⌘ K</kbd></button>
            <span className="live"><span className="dot" /> LIVE</span>
            <button className="icon-btn" aria-label="notifications" onClick={() => setNotifications(0)}><Bell size={17} />{notifications > 0 && <i>{notifications}</i>}</button>
            <div className="avatar">TB</div>
          </div>
        </header>

        {searchOpen && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="search-pop glass">
            <Search size={17} /><input autoFocus placeholder="Tìm trong dashboard..." /><kbd>ESC</kbd>
          </motion.div>
        )}

        <div className="page">
          <div className="hero-row">
            <div>
              <div className="eyebrow"><Sparkles size={13} /> SYSTEM OVERVIEW</div>
              <h1>Everything is <em>running.</em></h1>
              <p>Monitor your bot, automations and connected services from one place.</p>
            </div>
            <div className="hero-actions">
              <button className="secondary" onClick={() => setNotifications((v) => v + 1)}><Bell size={15} /> Test alert</button>
              <button className="primary" onClick={addLog}><Radio size={16} /> Test connection</button>
            </div>
          </div>

          <div className="stats-grid">
            <Stat icon={Activity} label="SYSTEM STATUS" value="ONLINE" meta="All systems operational" live />
            <Stat icon={Gauge} label="UPTIME" value="2d 14h" meta="99.98% this month" />
            <Stat icon={MessageSquare} label="MESSAGES" value="1,284" meta="+18.4% this week" trend />
            <Stat icon={Users} label="USERS" value="42" meta="8 active right now" />
          </div>

          <div className="analytics-grid">
            <section className="panel glass-card chart-panel">
              <div className="panel-head"><div><span className="panel-kicker">ACTIVITY</span><h2>Message traffic</h2></div><button className="select"><span>Last 7 days</span><ChevronDown size={13} /></button></div>
              <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={traffic} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
                <defs><linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.34} /><stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#ffffff0b" vertical={false} /><XAxis dataKey="day" tick={{ fill: '#68748a', fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#68748a', fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: '#11182aee', border: '1px solid #ffffff18', borderRadius: 12, color: '#fff', fontSize: 11 }} /><Area type="monotone" dataKey="messages" stroke="#a78bfa" strokeWidth={2.5} fill="url(#trafficFill)" />
              </AreaChart></ResponsiveContainer></div>
              <div className="chart-legend"><span><i className="legend-purple" /> Messages</span><span><i className="legend-cyan" /> AI requests</span><strong>+18.4%</strong></div>
            </section>

            <section className="panel glass-card chart-panel compact-chart">
              <div className="panel-head"><div><span className="panel-kicker">PERFORMANCE</span><h2>Response health</h2></div><MoreHorizontal size={18} className="muted-icon" /></div>
              <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={performance} margin={{ top: 8, right: 2, left: -28, bottom: 0 }}><CartesianGrid stroke="#ffffff09" vertical={false} /><XAxis dataKey="day" tick={{ fill: '#68748a', fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis hide /><Bar dataKey="value" radius={[5, 5, 2, 2]} fill="#22d3ee" /></BarChart></ResponsiveContainer></div>
              <div className="performance"><div><span>Avg. latency</span><b>386ms</b></div><div><span>Success rate</span><b>99.8%</b></div></div>
            </section>
          </div>

          <div className="main-grid">
            <section className="panel glass-card logs-panel">
              <div className="panel-head"><div><span className="panel-kicker">ACTIVITY</span><h2>Live system logs</h2></div><button className="ghost">View all <span>→</span></button></div>
              <div className="terminal glass-soft"><div className="terminal-head"><span/><span/><span/><label>tbz-bot / production</label><div><Command size={11} /> live</div></div><div className="terminal-body">{logs.map(([t, source, message, type], i) => <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .2, delay: i * .02 }} className="log-line" key={`${t}-${i}`}><time>{t}</time><b className={`tag ${type}`}>{source}</b><span>{message}</span><i>✓</i></motion.div>)}</div></div>
            </section>

            <section className="panel glass-card health-panel">
              <div className="panel-head"><div><span className="panel-kicker">HEALTH</span><h2>Service status</h2></div><span className="tiny-live">OPERATIONAL</span></div>
              <Service name="Zalo Gateway" value="Connected" latency="42ms" />
              <Service name="Gemini AI" value="Healthy" latency="842ms" />
              <Service name="Weather API" value="Healthy" latency="186ms" />
              <div className="health-score"><div><span>Overall health</span><strong>{pulse}%</strong></div><div className="bar"><motion.i animate={{ width: `${pulse}%` }} /></div></div>
            </section>
          </div>

          <div className="bottom-grid">
            <section className="panel glass-card small-panel"><div className="panel-kicker">SCHEDULED</div><h3>Next automation</h3><div className="schedule"><div className="schedule-time">06:00<span>AM</span></div><div><b>Morning greeting</b><small>Weather briefing · Zalo</small></div><span className="scheduled-dot" /></div></section>
            <section className="panel glass-card small-panel"><div className="panel-kicker">TODAY</div><h3>Quick metrics</h3><div className="metrics"><div><b>38</b><span>messages sent</span></div><div><b>12</b><span>AI requests</span></div><div><b>0</b><span>errors</span></div></div></section>
            <section className="panel glass-card small-panel command-panel"><div className="panel-kicker">QUICK ACTION</div><h3>Bot command</h3><div className="command-input"><Send size={15} /><span>Send a test message...</span><kbd>↵</kbd></div></section>
          </div>
        </div>
      </section>
    </main>
  )
}

function Stat({ icon: Icon, label, value, meta, live, trend }: { icon: typeof Activity; label: string; value: string; meta: string; live?: boolean; trend?: boolean }) {
  return <motion.div className="stat-card glass-card" whileHover={{ y: -4, scale: 1.008 }} transition={{ duration: .18 }}><div className="stat-top"><span className="stat-icon"><Icon size={17} /></span>{live && <span className="status-pill"><span className="dot" /> LIVE</span>}</div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className={trend ? 'stat-meta positive' : 'stat-meta'}>{trend && '↗ '}{meta}</div></motion.div>
}

function Service({ name, value, latency }: { name: string; value: string; latency: string }) {
  return <div className="service"><span className="dot" /><div><b>{name}</b><small>{value}</small></div><code>{latency}</code></div>
}
