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
