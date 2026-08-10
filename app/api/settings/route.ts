import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function botUrl() {
  const base = process.env.BOT_API_URL?.replace(/\/$/, "");
  if (!base) throw new Error("BOT_API_URL is not configured");
  return `${base}/api/settings`;
}

export async function GET() {
  try {
    const response = await fetch(botUrl(), { cache: "no-store" });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Bot API unavailable", detail: String(error) }, { status: 502 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const response = await fetch(botUrl(), {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: await request.text(),
      cache: "no-store",
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
