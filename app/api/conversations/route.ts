import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.BOT_API_URL;
  if (!baseUrl) {
    return NextResponse.json({ conversations: [], connected: false });
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/conversations`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) throw new Error(`Bot API returned ${response.status}`);
    const data = await response.json();
    return NextResponse.json({ ...data, connected: true });
  } catch {
    return NextResponse.json({ conversations: [], connected: false }, { status: 503 });
  }
}
