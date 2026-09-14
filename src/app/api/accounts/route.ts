import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
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
      return NextResponse.json({ accounts: [] });
    }

    // 2. Fetch connected accounts
    const { data: accounts, error } = await supabase
      .from("auto_social_accounts")
      .select("id, platform, account_id, account_name, status, token_expires_at, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Accounts API] Error fetching accounts:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ accounts: accounts || [] });
  } catch (err) {
    console.error("[Accounts API] GET error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform, accountId, accountName, accessToken, tokenExpiresAt } =
      await req.json();

    if (!platform || !accountId || !accessToken) {
      return NextResponse.json(
        { error: "platform, accountId, and accessToken are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Find or auto-provision workspace
    let { data: workspace } = await supabase
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (!workspace) {
      const { data: newWorkspace } = await (supabase
        .from("auto_workspaces") as any)
        .insert({
          name: "My Workspace",
          owner_id: uid,
        })
        .select("id")
        .single();
      workspace = newWorkspace;
    }

    if (!workspace) {
      return NextResponse.json(
        { error: "Could not find or create workspace." },
        { status: 500 }
      );
    }

    // 2. Upsert into auto_social_accounts
    const { data: account, error } = await (supabase
      .from("auto_social_accounts") as any)
      .upsert(
        {
          workspace_id: workspace.id,
          platform: platform.toLowerCase(),
          account_id: accountId.trim(),
          account_name: accountName?.trim() || null,
          access_token: accessToken.trim(),
          status: "active",
          token_expires_at: tokenExpiresAt || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "workspace_id,platform,account_id",
        }
      )
      .select("id, platform, account_id, account_name, status, created_at")
      .single();

    if (error) {
      console.error("[Accounts API] Save account error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, account });
  } catch (err) {
    console.error("[Accounts API] POST error:", err);
    return NextResponse.json({ error: "Failed to connect account" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("id");

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify ownership through workspace
    const { data: workspace } = await supabase
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("auto_social_accounts")
      .delete()
      .eq("id", accountId)
      .eq("workspace_id", workspace.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Accounts API] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
