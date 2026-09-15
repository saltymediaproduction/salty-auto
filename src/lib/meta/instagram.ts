const GRAPH_API_BASE = "https://graph.facebook.com";
const GRAPH_VERSION = process.env.META_GRAPH_VERSION || "v21.0";

export interface InstagramApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

/**
 * Replies publicly to an Instagram comment on a post or reel.
 * Endpoint: POST /{comment_id}/replies
 */
export async function replyToInstagramComment(
  commentId: string,
  message: string,
  accessToken: string
): Promise<InstagramApiResponse<{ id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${commentId}/replies`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Instagram API] Comment reply error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to reply to comment",
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: { id: data.id },
      statusCode: res.status,
    };
  } catch (err) {
    console.error("[Instagram API] Comment reply network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Sends a private Direct Message to a user who commented on a post.
 * Uses Meta's comment-attribution recipient schema: { recipient: { comment_id: "..." } }
 * Endpoint: POST /{instagram_business_account_id}/messages
 */
export async function sendInstagramPrivateDM(
  instagramAccountId: string,
  commentId: string,
  messageText: string,
  accessToken: string
): Promise<InstagramApiResponse<{ recipient_id: string; message_id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${instagramAccountId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          comment_id: commentId,
        },
        message: {
          text: messageText,
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Instagram API] Send private DM error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send private DM",
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: {
        recipient_id: data.recipient_id,
        message_id: data.message_id,
      },
      statusCode: res.status,
    };
  } catch (err) {
    console.error("[Instagram API] Send DM network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

export type InstagramButton =
  | { type: "web_url"; url: string; title: string }
  | { type: "postback"; title: string; payload: string };

/**
 * Sends an interactive Button Template DM via Meta Graph API.
 * Supports up to 3 buttons (web_url or postback).
 * Meta restricts button template text to 640 characters and titles to 20 characters.
 */
export async function sendInstagramButtonTemplate({
  instagramAccountId,
  recipient,
  messageText,
  buttons,
  accessToken,
}: {
  instagramAccountId: string;
  recipient: { comment_id: string } | { id: string };
  messageText: string;
  buttons: InstagramButton[];
  accessToken: string;
}): Promise<InstagramApiResponse<{ recipient_id: string; message_id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${instagramAccountId}/messages`;

  const formattedButtons = buttons.slice(0, 3).map((btn) => {
    if (btn.type === "web_url") {
      return {
        type: "web_url",
        url: btn.url,
        title: btn.title.slice(0, 20),
      };
    }
    return {
      type: "postback",
      title: btn.title.slice(0, 20),
      payload: btn.payload,
    };
  });

  const payload = {
    recipient,
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: messageText.slice(0, 640),
          buttons: formattedButtons,
        },
      },
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Instagram API] Button template error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send button template",
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: {
        recipient_id: data.recipient_id,
        message_id: data.message_id,
      },
      statusCode: res.status,
    };
  } catch (err) {
    console.error("[Instagram API] Button template network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Sends a Direct Message to a user by their Instagram Scoped ID (IGSID).
 * Used for follow-up responses and follow-gate reveal messages within the 24-hour window.
 */
export async function sendInstagramDirectDM(
  instagramAccountId: string,
  recipientIgsid: string,
  messageText: string,
  accessToken: string
): Promise<InstagramApiResponse<{ recipient_id: string; message_id: string }>> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${instagramAccountId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: { id: recipientIgsid },
        message: { text: messageText },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Instagram API] Direct DM error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send direct DM",
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: {
        recipient_id: data.recipient_id,
        message_id: data.message_id,
      },
      statusCode: res.status,
    };
  } catch (err) {
    console.error("[Instagram API] Direct DM network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Checks whether an Instagram user follows the business account.
 * Queries Meta Graph API: GET /{recipient_igsid}?fields=is_user_follow_business
 * 
 * Returns:
 * - true if user is confirmed following
 * - false if user is confirmed not following
 * - null if status cannot be determined (privacy/unsupported), allowing callers to fail-open.
 */
export async function checkUserFollowsBusiness(
  recipientIgsid: string,
  accessToken: string
): Promise<boolean | null> {
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${recipientIgsid}?fields=is_user_follow_business`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (typeof data?.is_user_follow_business === "boolean") {
      return data.is_user_follow_business;
    }

    return null;
  } catch {
    return null;
  }
}

export interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "REELS" | "FEED";
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
}

/**
 * Fetches user's published media (Posts, Reels, Carousels) from Meta Graph API.
 * Endpoint: GET /{ig_user_id}/media
 */
export async function getInstagramUserMedia(
  accountId: string,
  accessToken: string,
  limit = 50
): Promise<InstagramApiResponse<InstagramMediaItem[]>> {
  const fields = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count";
  const url = `${GRAPH_API_BASE}/${GRAPH_VERSION}/${accountId}/media?fields=${fields}&limit=${limit}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Instagram API] Fetch media error:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to fetch Instagram posts",
        statusCode: res.status,
      };
    }

    return {
      success: true,
      data: data.data || [],
      statusCode: res.status,
    };
  } catch (err) {
    console.error("[Instagram API] Fetch media network error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

