import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json({ error: "Missing contactId parameter" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Verify workspace ownership
    const { data: workspace } = await adminClient
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Verify contact belongs to workspace
    const { data: contact } = await adminClient
      .from("auto_contacts")
      .select("id")
      .eq("id", contactId)
      .eq("workspace_id", workspace.id)
      .single();

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // 3. Fetch messages
    const { data: messages, error } = await adminClient
      .from("auto_messages")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) {
      console.error("[CRM Messages] Query Error:", error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("[CRM Messages] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
