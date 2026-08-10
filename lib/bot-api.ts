export type BotHealth = {
  status: "online" | "offline" | "unknown";
  service: string;
  uptimeSeconds: number | null;
  timestamp: string;
  services: Record<string, { status: string }>;
};

export async function getBotHealth(): Promise<BotHealth> {
  const baseUrl = process.env.BOT_API_URL;
  if (!baseUrl) {
    return {
      status: "unknown",
      service: "tbz-bot",
      uptimeSeconds: null,
      timestamp: new Date().toISOString(),
      services: {},
    };
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`Bot API returned ${response.status}`);
    return (await response.json()) as BotHealth;
  } catch {
    return {
      status: "offline",
      service: "tbz-bot",
      uptimeSeconds: null,
      timestamp: new Date().toISOString(),
      services: {},
    };
  }
}
