import { NextRequest, NextResponse } from "next/server";
import { verifyMetaSignature } from "@/lib/meta/crypto";
import { inngest } from "@/inngest/client";

/**
 * GET Handler: Meta Webhook URL Verification Challenge
 * Triggered by Meta Developer Dashboard when saving the Webhook URL
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const expectedToken = process.env.META_VERIFY_TOKEN;

  if (mode === "subscribe" && token === expectedToken && challenge) {
    console.log("[Meta Webhook] Verification challenge passed successfully");
    return new Response(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("[Meta Webhook] Verification challenge failed: token mismatch");
  return new Response("Forbidden: Verification token mismatch", { status: 403 });
}

/**
 * POST Handler: Inbound Real-Time Webhook Notification
 * Dispatches events to Inngest and returns 200 OK immediately (< 50ms)
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    // 1. Verify HMAC SHA-256 Signature (Enterprise Security)
    const isValid = verifyMetaSignature(rawBody, signature);
    if (!isValid) {
      console.warn("[Meta Webhook] Rejected: Invalid HMAC SHA-256 signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

    // 2. Parse Instagram Events
    if (payload.object === "instagram") {
      for (const entry of payload.entry || []) {
        const accountId = entry.id; // Instagram Business Account ID

        for (const change of entry.changes || []) {
          // Instagram Comment Event
          if (change.field === "comments" && change.value) {
            const val = change.value;

            // Don't process comments made by the page itself
            if (val.from?.id === accountId) {
              continue;
            }

            await inngest.send({
              name: "meta/instagram.comment",
              data: {
                accountId,
                commentId: val.id,
                mediaId: val.media?.id || "unknown",
                fromId: val.from?.id || "",
                fromUsername: val.from?.username || "anonymous",
                text: val.text || "",
                timestamp: val.created_time ? Number(val.created_time) * 1000 : Date.now(),
              },
            });
          }
        }
      }
    }

    // 3. Parse WhatsApp Business Cloud API Events
    if (payload.object === "whatsapp_business_account") {
      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          const phoneNumberId = value?.metadata?.phone_number_id;

          if (value?.messages && phoneNumberId) {
            for (const msg of value.messages) {
              // We handle inbound text messages
              if (msg.type === "text" && msg.text?.body) {
                const contact = value.contacts?.find((c: { wa_id: string }) => c.wa_id === msg.from);

                await inngest.send({
                  name: "meta/whatsapp.message",
                  data: {
                    phoneNumberId,
                    messageId: msg.id,
                    from: msg.from,
                    profileName: contact?.profile?.name || "",
                    text: msg.text.body,
                    timestamp: msg.timestamp ? Number(msg.timestamp) * 1000 : Date.now(),
                  },
                });
              }
            }
          }
        }
      }
    }

    // Always respond 200 OK immediately to satisfy Meta's 3-second SLA
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (err) {
    console.error("[Meta Webhook] Handler error:", err);
    // Still return 200 to prevent Meta webhook retries and subscription deactivations
    return NextResponse.json({ status: "handled_with_error" }, { status: 200 });
  }
}
