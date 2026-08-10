import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = process.env.BOT_API_URL?.replace(/\/$/, "");
  if (!base) return NextResponse.json({ error: "BOT_API_URL is not configured" }, { status: 503 });

  try {
    const response = await fetch(`${base}/api/status`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Bot API unavailable", detail: String(error) }, { status: 502 });
  }
}
