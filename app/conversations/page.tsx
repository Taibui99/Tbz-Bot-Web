"use client";

import { useEffect, useMemo, useState } from "react";

interface Conversation {
  chat_id: string | number;
  display_name?: string;
  type?: string;
  sent_at?: string;
  duration?: number;
  user_text?: string;
  bot_reply?: string;
}

export default function ConversationsPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [query, setQuery] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch("/api/conversations", { cache: "no-store" });
      const data = await res.json();
      setItems(data.conversations ?? []);
      setConnected(Boolean(data.connected));
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.display_name, item.chat_id, item.user_text, item.bot_reply].some((v) =>
        String(v ?? "").toLowerCase().includes(q),
      ),
    );
  }, [items, query]);

  return (
    <main className="page-shell">
      <div className="page-header">
        <div>
          <div className="eyebrow">TBZ-BOT / CONVERSATIONS</div>
          <h1>Hội thoại</h1>
          <p>Lịch sử tin nhắn thực từ bot, cập nhật nhẹ mỗi 10 giây.</p>
        </div>
        <div className={`status-pill ${connected ? "online" : "offline"}`}>
          <span /> {connected ? "BOT CONNECTED" : "BOT OFFLINE"}
        </div>
      </div>
      <section className="glass-card toolbar-card">
        <input className="search-input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm người dùng, nội dung hoặc chat ID..." />
        <span className="muted">{filtered.length} cuộc hội thoại</span>
      </section>
      <section className="conversation-list">
        {loading ? <div className="glass-card empty-state">Đang tải hội thoại...</div> : null}
        {!loading && filtered.length === 0 ? <div className="glass-card empty-state">Chưa có dữ liệu hội thoại.</div> : null}
        {filtered.map((item, index) => (
          <article className="glass-card conversation-card" key={`${item.chat_id}-${item.sent_at}-${index}`}>
            <div className="conversation-head">
              <div><strong>{item.display_name || "Unknown user"}</strong><span className="muted"> · {item.chat_id}</span></div>
              <span className="badge">{item.type === "photo" ? "ẢNH" : "TEXT"}</span>
            </div>
            <div className="message user-message">{item.user_text || "[không có nội dung]"}</div>
            <div className="message bot-message">{item.bot_reply || "[không có phản hồi]"}</div>
            <div className="conversation-foot"><span>{item.sent_at || ""}</span>{typeof item.duration === "number" ? <span>{item.duration}s response</span> : null}</div>
          </article>
        ))}
      </section>
    </main>
  );
}
