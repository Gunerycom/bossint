import { NextRequest } from "next/server";

export const runtime = "nodejs";

// Allow long-running research queries (5 minutes)
export const maxDuration = 300;

/**
 * POST /api/chat
 *
 * Accepts { message, session_id } from the Bossint frontend,
 * proxies to the upstream provider server-side, and re-maps
 * SSE events into Bossint's own contract.
 */
export async function POST(request: NextRequest) {
  const upstreamUrl = process.env.UPSTREAM_CHAT_URL;
  if (!upstreamUrl) {
    return sseError("Bossint is not configured correctly. Please contact support.");
  }

  let body: { message?: string; session_id?: string | null };
  try {
    body = await request.json();
  } catch {
    return sseError("Invalid request body.");
  }

  const { message, session_id } = body;
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return sseError("Message is required.");
  }

  // Build upstream payload — hardcoded server-side fields
  const upstreamPayload = {
    message: message.trim(),
    session_id: session_id ?? null,
    stream: true,
    show_reasoning: true,
    followup: !!session_id,
  };

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstreamPayload),
      // No signal timeout — let long research queries run
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      return sseError("Bossint couldn't complete this request. Please try again.");
    }

    const upstreamReader = upstreamResponse.body.getReader();
    const decoder = new TextDecoder();

    // Use start() with an async read loop instead of pull() for more
    // reliable proxy streaming — avoids backpressure edge cases
    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await upstreamReader.read();

            if (done) {
              // Flush any remaining buffered data
              if (buffer.trim()) {
                processBuffer(buffer, controller);
              }
              controller.close();
              return;
            }

            buffer += decoder.decode(value, { stream: true });

            // Normalize \r\n to \n to handle different upstream line endings
            buffer = buffer.replace(/\r\n/g, "\n");

            // Process complete SSE messages (separated by double newlines)
            const parts = buffer.split("\n\n");
            // Keep the last part as it might be incomplete
            buffer = parts.pop() || "";

            for (const part of parts) {
              if (part.trim()) {
                processBuffer(part, controller);
              }
            }
          }
        } catch (err) {
          // Only emit error if the controller hasn't been closed
          try {
            emitEvent(controller, {
              type: "error",
              text: "Bossint couldn't complete this request. Please try again.",
            });
            controller.close();
          } catch {
            // Controller already closed — ignore
          }
        }
      },
      cancel() {
        upstreamReader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return sseError("Bossint couldn't complete this request. Please try again.");
  }
}

/** Parse an SSE data line and re-map to Bossint's contract */
function processBuffer(raw: string, controller: ReadableStreamDefaultController) {
  const lines = raw.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) continue;

    const jsonStr = trimmed.slice(5).trim();
    if (!jsonStr || jsonStr === "[DONE]") continue;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(jsonStr);
    } catch {
      continue; // Skip malformed JSON
    }

    const eventType = data.type as string;

    switch (eventType) {
      case "session":
        emitEvent(controller, {
          type: "session",
          sessionId: data.session_id ?? data.sessionId ?? null,
        });
        break;

      case "step":
        emitEvent(controller, {
          type: "status",
          label: "Thinking",
          step: data.step ?? 1,
        });
        break;

      case "action":
        emitEvent(controller, {
          type: "status",
          label: (data.text as string) || (data.action as string) || "Processing",
        });
        break;

      case "crawled_url":
        emitEvent(controller, {
          type: "status",
          label: "Reading a source",
        });
        break;

      case "progress":
        emitEvent(controller, {
          type: "status",
          label: (data.text as string) || (data.message as string) || "Working",
        });
        break;

      case "reasoning":
        emitEvent(controller, {
          type: "reasoning",
          text: (data.text as string) || "",
        });
        break;

      case "answer":
        emitEvent(controller, {
          type: "answer",
          text: (data.text as string) || "",
        });
        break;

      case "done":
        emitEvent(controller, {
          type: "done",
          answer: (data.answer as string) || (data.text as string) || "",
          sources: (data.sources as Array<{ url: string; title?: string }>) || [],
        });
        break;

      case "image_url":
      case "intent":
        // Dropped — not used in this UI
        break;

      default:
        // Unknown event types are silently dropped
        break;
    }
  }
}

/** Encode and enqueue an SSE event */
function emitEvent(
  controller: ReadableStreamDefaultController,
  payload: Record<string, unknown>
) {
  const encoded = new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
  controller.enqueue(encoded);
}

/** Return an SSE stream containing a single error event */
function sseError(text: string): Response {
  const payload = JSON.stringify({ type: "error", text });
  const body = `data: ${payload}\n\n`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
