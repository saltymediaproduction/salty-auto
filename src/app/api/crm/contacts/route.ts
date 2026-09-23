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

    const adminClient = createAdminClient();

    // 1. Get the user's workspace
    const { data: workspace } = await adminClient
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!workspace) {
      return NextResponse.json({ contacts: [] });
    }

    // 2. Fetch all contacts for this workspace, ordered by last_contacted_at
    const { data: contacts, error } = await adminClient
      .from("auto_contacts")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("last_contacted_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[CRM Contacts] Query Error:", error);
      return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
    }

    return NextResponse.json({ contacts });
  } catch (err) {
    console.error("[CRM Contacts] Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
