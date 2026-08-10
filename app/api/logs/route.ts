import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest) {
  const baseUrl = process.env.BOT_API_URL?.replace(/\/$/, "");
  if (!baseUrl) return new Response("BOT_API_URL is not configured", { status: 503 });

  // SSE is intentionally long-lived: do not use a short request timeout here.
  const upstream = await fetch(`${baseUrl}/api/logs/stream`, {
    cache: "no-store",
    headers: { Accept: "text/event-stream" },
  }).catch(() => null);

  if (!upstream?.ok || !upstream.body) {
    return new Response("Bot log stream unavailable", { status: 503 });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(new TextEncoder().encode(decoder.decode(value, { stream: true })));
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
