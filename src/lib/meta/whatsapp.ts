const GRAPH_API_BASE = "https://graph.facebook.com";
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";

export interface WhatsAppApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Sends a standard text message to a WhatsApp user within the 24-hour customer care window.
 * Endpoint: POST /{PHONE_NUMBER_ID}/messages
 */
export async function sendWhatsAppTextMessage(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  accessToken: string
): Promise<WhatsAppApiResponse<{ message_id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`;

  // Sanitize phone number (strip leading +, spaces, dashes)
  const cleanTo = to.replace(/[^0-9]/g, "");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleanTo,
        type: "text",
        text: {
          preview_url: false,
          body: bodyText,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp API] Send text error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send WhatsApp message",
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: {
        message_id: data.messages?.[0]?.id,
      },
      statusCode: res.status,
    };
  } catch (err) {
    console.error("[WhatsApp API] Send text network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Marks an incoming WhatsApp message as read.
 */
export async function markWhatsAppMessageAsRead(
  phoneNumberId: string,
  messageId: string,
  accessToken: string
): Promise<WhatsAppApiResponse<{ success: boolean }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });

    const data = await res.json();
    return {
      success: res.ok,
      data: { success: data.success || res.ok },
      statusCode: res.status,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
