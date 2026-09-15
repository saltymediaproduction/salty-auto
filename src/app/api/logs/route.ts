import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const supabase = createAdminClient();

    // 1. Get workspace for this user
    const { data: workspace } = await supabase
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({ logs: [] });
    }

    // 2. Fetch logs with contacts and rules
    let query = supabase
      .from("auto_automation_logs")
      .select(`
        id,
        platform,
        status,
        source_id,
        error_message,
        created_at,
        rule:auto_automation_rules(id, name),
        contact:auto_contacts(id, name, instagram_username, whatsapp_phone)
      `)
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (platform) {
      query = query.eq("platform", platform.toLowerCase());
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error("[Logs API] Error fetching logs:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (err) {
    console.error("[Logs API] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
