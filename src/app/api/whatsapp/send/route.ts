import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTextMessage } from "@/lib/meta/whatsapp";
import { logMessageToCRM } from "@/lib/crm/messages";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { contactId, text } = body;

    if (!contactId || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Fetch Contact
    const { data: contact, error: contactError } = await adminClient
      .from("auto_contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // 2. Verify workspace ownership
    const { data: workspace, error: wsError } = await adminClient
      .from("auto_workspaces")
      .select("id")
      .eq("id", contact.workspace_id)
      .eq("owner_id", user.id)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: "Forbidden: Not your workspace" }, { status: 403 });
    }

    // 3. Fetch WhatsApp Account credentials
    const { data: account, error: accountError } = await adminClient
      .from("auto_social_accounts")
      .select("account_id, access_token")
      .eq("workspace_id", contact.workspace_id)
      .eq("platform", "whatsapp")
      .eq("status", "active")
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "WhatsApp account not connected or active" }, { status: 400 });
    }

    // 4. Send Message via Meta Graph API
    if (!contact.whatsapp_phone) {
      return NextResponse.json({ error: "Contact does not have a WhatsApp phone number" }, { status: 400 });
    }

    const response = await sendWhatsAppTextMessage(
      account.account_id, // Phone Number ID
      contact.whatsapp_phone,
      text,
      account.access_token
    );

    if (!response.success) {
      console.error("[WhatsApp Send] Failed:", response.error);
      return NextResponse.json({ error: response.error }, { status: 500 });
    }

    // 5. Log Message to CRM
    if (response.data?.message_id) {
      await logMessageToCRM({
        workspaceId: contact.workspace_id,
        contactId: contact.id,
        platform: "whatsapp",
        direction: "outbound",
        messageId: response.data.message_id,
        text: text,
      });
    }

    return NextResponse.json({ success: true, messageId: response.data?.message_id });

  } catch (err: any) {
    console.error("[WhatsApp Send] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
