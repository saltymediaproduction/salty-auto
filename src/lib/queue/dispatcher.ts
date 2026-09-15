import { inngest } from "@/inngest/client";

export interface AutomationEvent<T = any> {
  name: string;
  data: T;
}

export type QueueDriver = "auto" | "inngest" | "qstash";

/**
 * Universal Queue Dispatcher (Inngest + Upstash QStash Dual-Driver)
 *
 * Provides a cost-reduction fallback:
 * - Inngest: Complex multi-step state machines, delays, and approval steps.
 * - Upstash QStash: High-volume fire-and-forget webhooks ($1.00 per 100,000 messages),
 *   saving up to 70-80% on event queue infrastructure at massive scale.
 */
export async function dispatchAutomationEvent(
  event: AutomationEvent,
  preferredDriver: QueueDriver = "auto"
): Promise<{ driver: "inngest" | "qstash"; success: boolean; messageId?: string }> {
  const configuredDriver = process.env.QUEUE_DRIVER || "inngest";
  const targetDriver = preferredDriver === "auto" ? configuredDriver : preferredDriver;

  const qstashToken = process.env.QSTASH_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://auto.saltymediaproduction.com";

  // Use QStash if requested and token is available
  if (targetDriver === "qstash" && qstashToken) {
    try {
      const destinationUrl = `${appUrl}/api/webhooks/qstash`;
      const qstashEndpoint = `https://qstash.upstash.io/v2/publish/${encodeURIComponent(destinationUrl)}`;

      const res = await fetch(qstashEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
          "Upstash-Retries": "3",
          "Upstash-Forward-Event-Name": event.name,
        },
        body: JSON.stringify(event),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return {
          driver: "qstash",
          success: true,
          messageId: data.messageId || "qstash_ok",
        };
      } else {
        const errText = await res.text();
        console.warn("[Queue Dispatcher] QStash error, falling back to Inngest:", errText);
      }
    } catch (qstashErr) {
      console.warn("[Queue Dispatcher] QStash dispatch failed, falling back to Inngest:", qstashErr);
    }
  }

  // Primary / Fallback: Inngest
  await (inngest.send as any)({
    name: event.name,
    data: event.data,
  });

  return {
    driver: "inngest",
    success: true,
  };
}
