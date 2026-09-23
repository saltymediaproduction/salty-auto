import { createAdminClient } from "@/lib/supabase/admin";

export async function logMessageToCRM(params: {
  workspaceId: string;
  contactId: string;
  platform: "whatsapp" | "instagram";
  direction: "inbound" | "outbound";
  messageId: string;
  text?: string;
  metadata?: any;
}) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("auto_messages").insert({
    workspace_id: params.workspaceId,
    contact_id: params.contactId,
    platform: params.platform,
    direction: params.direction,
    message_id: params.messageId,
    text: params.text || null,
    metadata: params.metadata || {},
  });

  if (error) {
    console.error("[CRM] Failed to log message:", error);
  }
}
