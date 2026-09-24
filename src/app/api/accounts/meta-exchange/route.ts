import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, sessionInfo } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Authorization code is missing" }, { status: 400 });
    }

    const appId = process.env.NEXT_PUBLIC_META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;

    if (!appId || !appSecret) {
      return NextResponse.json({ error: "Server is missing Meta App credentials" }, { status: 500 });
    }

    // 1. Exchange the OAuth code for a long-lived access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Meta Exchange] Failed to get access token:", tokenData);
      return NextResponse.json({ error: tokenData.error?.message || "Failed to exchange token" }, { status: 400 });
    }

    const accessToken = tokenData.access_token;
    
    // Extract Phone Number ID from the Embedded Signup Session Info
    // The session info contains { type: 'WA_EMBEDDED_SIGNUP', data: { phone_number_id, waba_id, ... } }
    const phoneId = sessionInfo?.data?.phone_number_id || sessionInfo?.data?.phone_number_ids?.[0];
    const wabaId = sessionInfo?.data?.waba_id;

    if (!phoneId) {
      console.warn("[Meta Exchange] Could not find phone ID in sessionInfo, using a placeholder.");
    }

    const supabase = createAdminClient();

    // 2. Find or auto-provision workspace
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

    // 3. Upsert into auto_social_accounts
    const { data: account, error } = await (supabase
      .from("auto_social_accounts") as any)
      .upsert(
        {
          workspace_id: workspace.id,
          platform: "whatsapp",
          account_id: phoneId || "unknown_phone_id",
          account_name: wabaId ? `WABA: ${wabaId}` : "WhatsApp Account",
          access_token: accessToken,
          status: "active",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "workspace_id,platform,account_id",
        }
      )
      .select("id, platform, account_id, account_name, status, created_at")
      .single();

    if (error) {
      console.error("[Meta Exchange] Save account error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, account });
  } catch (err) {
    console.error("[Meta Exchange] POST error:", err);
    return NextResponse.json({ error: "Failed to exchange Meta code" }, { status: 500 });
  }
}
