import { NextResponse } from "next/server";
import { getBotHealth } from "@/lib/bot-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getBotHealth();
  return NextResponse.json({
    ...health,
    source: process.env.BOT_API_URL ? "bot-api" : "local-adapter",
  });
}
