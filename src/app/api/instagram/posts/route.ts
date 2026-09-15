import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { getInstagramUserMedia } from "@/lib/meta/instagram";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminClient();

    // 1. Get workspace for this user
    const { data: workspace } = await supabase
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json(
        { error: "No active workspace found." },
        { status: 404 }
      );
    }

    // 2. Fetch connected Instagram account with access_token
    const { data: account } = await supabase
      .from("auto_social_accounts")
      .select("id, account_id, account_name, access_token, status")
      .eq("workspace_id", workspace.id)
      .eq("platform", "instagram")
      .eq("status", "active")
      .maybeSingle();

    if (!account || !account.access_token) {
      return NextResponse.json(
        {
          error: "Instagram account not connected. Please connect your Instagram account first.",
          posts: [],
        },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // 3. Fetch published media from Meta Graph API
    const res = await getInstagramUserMedia(
      account.account_id,
      account.access_token,
      limit
    );

    if (!res.success) {
      return NextResponse.json(
        {
          error: res.error || "Failed to fetch Instagram posts from Meta Graph API",
          posts: [],
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      accountName: account.account_name,
      posts: res.data || [],
    });
  } catch (err) {
    console.error("[Instagram Posts API] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", posts: [] },
      { status: 500 }
    );
  }
}
