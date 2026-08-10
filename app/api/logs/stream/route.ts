import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const base = process.env.BOT_API_URL?.replace(/\/$/, "");
  if (!base) return NextResponse.json({ error: "BOT_API_URL is not configured" }, { status: 500 });

  try {
    const response = await fetch(`${base}/api/logs/stream`, {
      cache: "no-store",
      headers: { Accept: "text/event-stream" },
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok || !response.body) {
      return NextResponse.json({ error: `Bot API returned ${response.status}` }, { status: response.status || 502 });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Bot log stream unavailable", detail: String(error) }, { status: 502 });
  }
}
