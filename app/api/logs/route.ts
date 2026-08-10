import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.BOT_API_URL;
  if (!baseUrl) return new Response("BOT_API_URL is not configured", { status: 503 });

  const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/api/logs/stream`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "text/event-stream" },
  }).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    return new Response("Bot log stream unavailable", { status: 503 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(encoder.encode(decoder.decode(value, { stream: true })));
      } catch {
        controller.close();
      }
    },
    cancel() {
      reader.cancel().catch(() => undefined);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
