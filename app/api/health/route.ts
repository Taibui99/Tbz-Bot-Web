import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = process.env.BOT_STARTED_AT;
  const uptimeSeconds = startedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))
    : null;

  return NextResponse.json({
    status: "online",
    service: "tbz-bot",
    uptimeSeconds,
    timestamp: new Date().toISOString(),
    services: {
      bot: { status: "online" },
      scheduler: { status: "online" },
      weather: { status: "ready" },
      gemini: { status: process.env.GEMINI_API_KEY ? "configured" : "not_configured" },
    },
  });
}
