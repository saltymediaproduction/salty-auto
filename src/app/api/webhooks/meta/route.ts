import { NextRequest, NextResponse } from "next/server";
import { verifyMetaSignature } from "@/lib/meta/crypto";
import { dispatchAutomationEvent } from "@/lib/queue/dispatcher";

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

        // 2a. Changes array (Comments and Media publication events)
        for (const change of entry.changes || []) {
          // Instagram Comment Event
          if (change.field === "comments" && change.value) {
            const val = change.value;

            // Don't process comments made by the page itself
            if (val.from?.id === accountId) {
              continue;
            }

            await dispatchAutomationEvent({
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

          // Instagram New Media Published (for 'Attach to Next Reel' workflows)
          if (change.field === "media" && change.value) {
            const val = change.value;
            await dispatchAutomationEvent({
              name: "meta/instagram.media",
              data: {
                accountId,
                mediaId: val.id || val.media_id || "unknown",
                mediaType: val.media_type || "reel",
                timestamp: Date.now(),
              },
            });
          }
        }

        // 2b. Messaging array (Button Postbacks & Inbound DMs / Story Replies)
        for (const msgItem of entry.messaging || []) {
          const senderId = msgItem.sender?.id;

          // Ignore echoes sent by the business account itself
          if (senderId === accountId || msgItem.message?.is_echo) {
            continue;
          }

          // Button Template Postback (e.g. "I'm Following" button click)
          if (msgItem.postback) {
            await dispatchAutomationEvent({
              name: "meta/instagram.postback",
              data: {
                accountId,
                senderId,
                payload: msgItem.postback.payload || "",
                title: msgItem.postback.title || "",
                timestamp: msgItem.timestamp ? Number(msgItem.timestamp) : Date.now(),
              },
            });
          }

          // Inbound Direct Message or Story Reply
          if (msgItem.message && msgItem.message.text) {
            await dispatchAutomationEvent({
              name: "meta/instagram.dm",
              data: {
                accountId,
                senderId,
                messageId: msgItem.message.mid,
                text: msgItem.message.text,
                isStoryReply: !!msgItem.message.reply_to?.story,
                timestamp: msgItem.timestamp ? Number(msgItem.timestamp) : Date.now(),
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
              const contact = value.contacts?.find((c: { wa_id: string }) => c.wa_id === msg.from);
              const profileName = contact?.profile?.name || "";
              const timestamp = msg.timestamp ? Number(msg.timestamp) * 1000 : Date.now();

              // Inbound standard text messages
              if (msg.type === "text" && msg.text?.body) {
                await dispatchAutomationEvent({
                  name: "meta/whatsapp.message",
                  data: {
                    phoneNumberId,
                    messageId: msg.id,
                    from: msg.from,
                    profileName,
                    text: msg.text.body,
                    timestamp,
                  },
                });
              }

              // Inbound interactive button replies or list selections (Jasper's Market architecture)
              if (msg.type === "interactive" && msg.interactive) {
                const buttonReply = msg.interactive.button_reply;
                const listReply = msg.interactive.list_reply;
                const interactiveId = buttonReply?.id || listReply?.id || "";
                const interactiveTitle = buttonReply?.title || listReply?.title || "";

                await dispatchAutomationEvent({
                  name: "meta/whatsapp.message",
                  data: {
                    phoneNumberId,
                    messageId: msg.id,
                    from: msg.from,
                    profileName,
                    text: interactiveTitle || interactiveId,
                    isInteractive: true,
                    interactiveId,
                    interactiveType: msg.interactive.type,
                    timestamp,
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
