export type BotHealth = {
  status: "online" | "offline" | "unknown";
  service: string;
  uptimeSeconds: number | null;
  timestamp: string;
  services: Record<string, { status: string }>;
  metrics: {
    messages: number;
    textMessages: number;
    photoMessages: number;
    users: number;
    errors: number;
    avgResponseSeconds: number;
    lastMessageAt: string | null;
  };
};

type BotStatusResponse = {
  bot_running: boolean;
  bot_error: string | null;
  message_count: number;
  text_count: number;
  photo_count: number;
  error_count: number;
  unique_users: number;
  avg_response_seconds: number;
  last_message_at: string | null;
  uptime_seconds: number;
};

const empty = (status: BotHealth["status"]): BotHealth => ({
  status,
  service: "tbz-bot",
  uptimeSeconds: null,
  timestamp: new Date().toISOString(),
  services: {},
  metrics: { messages: 0, textMessages: 0, photoMessages: 0, users: 0, errors: 0, avgResponseSeconds: 0, lastMessageAt: null },
});

export async function getBotHealth(): Promise<BotHealth> {
  const baseUrl = process.env.BOT_API_URL?.replace(/\/$/, "");
  if (!baseUrl) return empty("unknown");

  try {
    // The Python bot already exposes /api/status. Use that existing contract
    // rather than inventing a second backend endpoint.
    const response = await fetch(`${baseUrl}/api/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`Bot API returned ${response.status}`);

    const data = (await response.json()) as BotStatusResponse;
    return {
      status: data.bot_running ? "online" : "offline",
      service: "tbz-bot",
      uptimeSeconds: data.uptime_seconds ?? null,
      timestamp: new Date().toISOString(),
      services: {
        bot: { status: data.bot_running ? "online" : "offline" },
        scheduler: { status: "online" },
      },
      metrics: {
        messages: data.message_count ?? 0,
        textMessages: data.text_count ?? 0,
        photoMessages: data.photo_count ?? 0,
        users: data.unique_users ?? 0,
        errors: data.error_count ?? 0,
        avgResponseSeconds: data.avg_response_seconds ?? 0,
        lastMessageAt: data.last_message_at ?? null,
      },
    };
  } catch {
    return empty("offline");
  }
}

// Keep this module intentionally server-side: it is consumed by Next.js API routes.
