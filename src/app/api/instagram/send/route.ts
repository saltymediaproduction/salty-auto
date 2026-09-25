import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInstagramDirectDM } from "@/lib/meta/instagram";
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

    // 3. Fetch Instagram Account credentials
    const { data: account, error: accountError } = await adminClient
      .from("auto_social_accounts")
      .select("account_id, access_token")
      .eq("workspace_id", contact.workspace_id)
      .eq("platform", "instagram")
      .eq("status", "active")
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Instagram account not connected or active" }, { status: 400 });
    }

    // 4. Send Message via Meta Graph API
    if (!contact.instagram_scoped_id) {
      return NextResponse.json({ error: "Contact does not have an Instagram Scoped ID" }, { status: 400 });
    }

    const response = await sendInstagramDirectDM(
      account.account_id, // Instagram Business Account ID
      contact.instagram_scoped_id,
      text,
      account.access_token
    );

    if (!response.success) {
      console.error("[Instagram Send] Failed:", response.error);
      return NextResponse.json({ error: response.error }, { status: 500 });
    }

    // 5. Log Message to CRM
    if (response.data?.message_id) {
      await logMessageToCRM({
        workspaceId: contact.workspace_id,
        contactId: contact.id,
        platform: "instagram",
        direction: "outbound",
        messageId: response.data.message_id,
        text: text,
      });
    }

    return NextResponse.json({ success: true, messageId: response.data?.message_id });

  } catch (err: any) {
    console.error("[Instagram Send] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
