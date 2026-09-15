import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

/**
 * Upstash QStash Inbound Delivery Endpoint
 * Receives high-volume queued webhook messages from QStash.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const event = JSON.parse(rawBody);

    if (!event || !event.name || !event.data) {
      return NextResponse.json({ error: "Invalid QStash payload" }, { status: 400 });
    }

    // Forward to Inngest execution pipeline or process directly
    await (inngest.send as any)({
      name: event.name,
      data: event.data,
    });

    return NextResponse.json({ received: true, event: event.name });
  } catch (err: any) {
    console.error("[QStash Webhook] Processing error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process QStash message" },
      { status: 500 }
    );
  }
}
