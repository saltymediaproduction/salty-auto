const GRAPH_API_BASE = "https://graph.facebook.com";
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";

export interface WhatsAppApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

export interface WhatsAppReplyButton {
  id: string;
  title: string;
}

export interface WhatsAppListSectionRow {
  id: string;
  title: string;
  description?: string;
}

export interface WhatsAppListSection {
  title: string;
  rows: WhatsAppListSectionRow[];
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
 * Marks an incoming WhatsApp message as read and activates typing indicator (simulating human concierge).
 */
export async function sendWhatsAppTypingIndicator(
  phoneNumberId: string,
  messageId: string,
  accessToken: string
): Promise<void> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
        typing_indicator: {
          type: "text",
        },
      }),
    });
  } catch (err) {
    // Non-blocking typing indicator
    console.warn("[WhatsApp API] Typing indicator error:", err);
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
    console.error("[WhatsApp API] Mark as read error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Sends an Interactive Reply Button Message (Meta-Approved, up to 3 buttons).
 * Modeled directly on Meta's Jasper's Market interactive replies:
 * e.g. "Shop online", "Explore Services", "Current promo".
 */
export async function sendWhatsAppInteractiveButtons(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttons: WhatsAppReplyButton[],
  accessToken: string,
  incomingMessageId?: string
): Promise<WhatsAppApiResponse<{ message_id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`;
  const cleanTo = to.replace(/[^0-9]/g, "");

  // Optional: trigger typing indicator if incomingMessageId provided
  if (incomingMessageId) {
    await sendWhatsAppTypingIndicator(phoneNumberId, incomingMessageId, accessToken);
  }

  // Meta Cloud API allows maximum 3 buttons for interactive reply
  const formattedButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: {
      id: b.id,
      title: b.title.slice(0, 20), // Max 20 chars per button title in Meta spec
    },
  }));

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
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: bodyText,
          },
          action: {
            buttons: formattedButtons,
          },
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp API] Interactive buttons error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send WhatsApp interactive buttons",
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
    console.error("[WhatsApp API] Interactive buttons network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Sends an Interactive List Menu Message (Up to 10 options across sections).
 */
export async function sendWhatsAppInteractiveList(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttonLabel: string,
  sections: WhatsAppListSection[],
  accessToken: string,
  incomingMessageId?: string
): Promise<WhatsAppApiResponse<{ message_id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`;
  const cleanTo = to.replace(/[^0-9]/g, "");

  if (incomingMessageId) {
    await sendWhatsAppTypingIndicator(phoneNumberId, incomingMessageId, accessToken);
  }

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
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: bodyText,
          },
          action: {
            button: buttonLabel.slice(0, 20),
            sections: sections,
          },
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp API] Interactive list error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send WhatsApp interactive list",
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
    console.error("[WhatsApp API] Interactive list network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Sends a rich media message (Image or Video) with formatted caption.
 */
export async function sendWhatsAppMediaMessage(
  phoneNumberId: string,
  to: string,
  mediaUrl: string,
  caption: string,
  accessToken: string,
  mediaType: "image" | "video" = "image"
): Promise<WhatsAppApiResponse<{ message_id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`;
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
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          caption: caption,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp API] Send media error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send WhatsApp media",
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
    console.error("[WhatsApp API] Send media network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export interface WhatsAppCarouselCard {
  cardIndex: number;
  imageUrl: string;
  buttons: Array<{
    id: string;
    title: string;
  }>;
}

/**
 * Sends a WhatsApp Media Card Carousel (Jasper's Market Recipe/Product Carousel Architecture).
 * Dispatches a horizontal scrollable card deck.
 */
export async function sendWhatsAppMediaCarousel(
  phoneNumberId: string,
  to: string,
  templateName: string,
  cards: WhatsAppCarouselCard[],
  accessToken: string,
  locale = "en_US"
): Promise<WhatsAppApiResponse<{ message_id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`;
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
        type: "template",
        template: {
          name: templateName,
          language: { code: locale },
          components: [
            {
              type: "carousel",
              cards: cards.map((c) => ({
                card_index: c.cardIndex,
                components: [
                  {
                    type: "header",
                    parameters: [
                      {
                        type: "image",
                        image: { link: c.imageUrl },
                      },
                    ],
                  },
                  {
                    type: "button",
                    sub_type: "quick_reply",
                    index: 0,
                    parameters: [
                      {
                        type: "payload",
                        payload: c.buttons[0]?.id || "carousel_action",
                      },
                    ],
                  },
                ],
              })),
            },
          ],
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp API] Carousel error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send WhatsApp carousel",
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: { message_id: data.messages?.[0]?.id },
      statusCode: res.status,
    };
  } catch (err) {
    console.error("[WhatsApp API] Carousel network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Sends a Limited-Time Offer (LTO) Template with native copy coupon code button (Jasper's Market BERRIES20/SALTY20 pattern).
 */
export async function sendWhatsAppLimitedTimeOfferTemplate(
  phoneNumberId: string,
  to: string,
  templateName: string,
  offerCode: string,
  expirationTimeMs: number,
  imageUrl: string,
  accessToken: string,
  locale = "en_US"
): Promise<WhatsAppApiResponse<{ message_id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${phoneNumberId}/messages`;
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
        type: "template",
        template: {
          name: templateName,
          language: { code: locale },
          components: [
            {
              type: "header",
              parameters: [
                {
                  type: "image",
                  image: { link: imageUrl },
                },
              ],
            },
            {
              type: "limited_time_offer",
              parameters: [
                {
                  type: "limited_time_offer",
                  limited_time_offer: {
                    expiration_time_ms: expirationTimeMs,
                  },
                },
              ],
            },
            {
              type: "button",
              sub_type: "copy_code",
              index: 0,
              parameters: [
                {
                  type: "coupon_code",
                  coupon_code: offerCode,
                },
              ],
            },
          ],
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[WhatsApp API] LTO error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send LTO template",
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: { message_id: data.messages?.[0]?.id },
      statusCode: res.status,
    };
  } catch (err) {
    console.error("[WhatsApp API] LTO network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

