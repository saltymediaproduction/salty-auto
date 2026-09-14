import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWhatsAppTextMessage } from "@/lib/meta/whatsapp";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId, recipientPhone, messageText } = await req.json();

    if (!accountId || !recipientPhone) {
      return NextResponse.json(
        { error: "accountId and recipientPhone are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch workspace
    const { data: workspace } = await supabase
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // 2. Fetch the social account
    const { data: account, error: accError } = await supabase
      .from("auto_social_accounts")
      .select("id, platform, account_id, access_token")
      .eq("id", accountId)
      .eq("workspace_id", workspace.id)
      .single();

    if (accError || !account) {
      return NextResponse.json(
        { error: "WhatsApp account not found or unauthorized." },
        { status: 404 }
      );
    }

    if (account.platform !== "whatsapp") {
      return NextResponse.json(
        { error: "Selected account is not a WhatsApp account." },
        { status: 400 }
      );
    }

    const defaultTestMessage =
      messageText?.trim() ||
      "🚀 Hello from Salty Auto! Your WhatsApp Business Cloud API is successfully connected and responding in realtime.";

    // 3. Dispatch via WhatsApp Cloud API
    const response = await sendWhatsAppTextMessage(
      account.account_id, // Phone Number ID
      recipientPhone.trim(),
      defaultTestMessage,
      account.access_token
    );

    if (!response.success) {
      return NextResponse.json(
        {
          error: response.error || "Failed to send WhatsApp message via Meta Cloud API",
          details: response,
        },
        { status: response.statusCode || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: response.data?.message_id,
      recipient: recipientPhone,
      message: defaultTestMessage,
    });
  } catch (err) {
    console.error("[Test WhatsApp API] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
