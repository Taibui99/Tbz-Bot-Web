"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export default function LogsPage() {
  const [lines, setLines] = useState<string[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [connected, setConnected] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const source = new EventSource("/api/logs");
    source.onopen = () => setConnected(true);
    source.onmessage = (event) => setLines((current) => [...current, event.data].slice(-500));
    source.onerror = () => setConnected(false);
    return () => source.close();
  }, []);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "auto" }), [lines.length]);

  const visible = useMemo(() => filter === "ALL" ? lines : lines.filter((line) => line.toUpperCase().includes(filter)), [lines, filter]);

  return (
    <main className="page-shell">
      <div className="page-header">
        <div><div className="eyebrow">TBZ-BOT / LIVE LOGS</div><h1>Live Logs</h1><p>Luồng log trực tiếp từ bot, giới hạn 500 dòng trên trình duyệt.</p></div>
        <div className={`status-pill ${connected ? "online" : "offline"}`}><span /> {connected ? "STREAM CONNECTED" : "STREAM OFFLINE"}</div>
      </div>
      <section className="glass-card log-toolbar">
        {['ALL', 'INFO', 'WARN', 'ERROR'].map((item) => <button key={item} className={filter === item ? "filter-btn active" : "filter-btn"} onClick={() => setFilter(item)}>{item}</button>)}
        <span className="muted">{visible.length} dòng</span><button className="filter-btn clear" onClick={() => setLines([])}>Clear</button>
      </section>
      <section className="glass-card terminal-card">
        <div className="terminal-head"><span className="terminal-dot" /><span>tbz-bot / stream</span></div>
        <div className="terminal-body">
          {visible.length === 0 ? <div className="terminal-empty">Đang chờ log từ bot...</div> : visible.map((line, index) => <div className="terminal-line" key={`${index}-${line}`}>{line}</div>)}
          <div ref={bottom} />
        </div>
      </section>
    </main>
  );
}
