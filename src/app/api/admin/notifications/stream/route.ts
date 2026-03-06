import { getServerSession } from "next-auth";
import * as Sentry from "@sentry/nextjs";

import { authOptions } from "@/lib/auth";
import { buildNotifications, buildNotificationsFingerprint } from "@/lib/admin-notifications";
import { getMonitoringSnapshot } from "@/lib/monitoring";

const encoder = new TextEncoder();

async function makePayload() {
  const snapshot = await getMonitoringSnapshot();
  const notifications = buildNotifications(snapshot);
  return {
    unreadCount: notifications.length,
    fingerprint: buildNotificationsFingerprint(notifications),
  };
}

function encodeDataEvent(data: string) {
  return encoder.encode(`data: ${data}\n\n`);
}

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  }

  let intervalId: ReturnType<typeof setInterval> | null = null;
  let heartbeatId: ReturnType<typeof setInterval> | null = null;
  let previousFingerprint: string | null = null;
  let isClosed = false;

  const clearTimers = () => {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (heartbeatId) {
      clearInterval(heartbeatId);
      heartbeatId = null;
    }
  };

  const isClosedControllerError = (error: unknown) =>
    error instanceof TypeError &&
    (error as { code?: string }).code === "ERR_INVALID_STATE" &&
    error.message.includes("Controller is already closed");

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const safeEnqueue = (chunk: Uint8Array) => {
        if (isClosed) return false;

        try {
          controller.enqueue(chunk);
          return true;
        } catch (error) {
          isClosed = true;
          clearTimers();

          if (!isClosedControllerError(error)) {
            Sentry.captureException(error);
          }
          return false;
        }
      };

      const sendLatest = async () => {
        try {
          const payload = await makePayload();
          const hasNew =
            previousFingerprint !== null && payload.fingerprint !== previousFingerprint;

          previousFingerprint = payload.fingerprint;

          safeEnqueue(
            encodeDataEvent(
              JSON.stringify({
                hasNew,
                unreadCount: payload.unreadCount,
              }),
            ),
          );
        } catch (error) {
          if (!isClosed) {
            Sentry.captureException(error);
          }
          // Keep stream alive on transient monitoring errors.
        }
      };

      await sendLatest();

      intervalId = setInterval(() => {
        void sendLatest();
      }, 5000);

      heartbeatId = setInterval(() => {
        safeEnqueue(encoder.encode(": heartbeat\\n\\n"));
      }, 15000);
    },
    cancel() {
      isClosed = true;
      clearTimers();
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
