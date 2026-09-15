import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { serializeRuleConfig } from "@/lib/automation/rules";
import { invalidateRulesCache } from "@/lib/cache/rules-cache";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const platform = searchParams.get("platform");

    const supabase = createAdminClient();

    // 1. Get workspace for this user
    const { data: workspace } = await supabase
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({ rules: [] });
    }

    // 2. Fetch rules
    let query = supabase
      .from("auto_automation_rules")
      .select("*")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: false });

    if (platform) {
      query = query.eq("platform", platform.toLowerCase());
    }

    const { data: rules, error } = await query;

    if (error) {
      console.error("[Rules API] Error fetching rules:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ rules: rules || [] });
  } catch (err) {
    console.error("[Rules API] GET error:", err);
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

    const body = await req.json();
    const {
      name,
      platform = "instagram",
      trigger_type = "comment",
      target_post_id = "all",
      keywords = [],
      match_type = "contains",
      public_reply_variants = [],
      dm_message,
      buttons = [],
      wa_buttons = [],
      require_follow = false,
      follow_prompt_message,
      follow_prompt_button_label,
      opening_dm_enabled = false,
      opening_dm_message,
      opening_dm_button_label,
      follow_up_enabled = false,
      follow_up_message,
      follow_up_delay_minutes,
      pending_next_reel = false,
      whole_word_match = true,
      post_permalink,
      social_account_id = null,
      is_active = true,
    } = body;

    if (!name || !dm_message) {
      return NextResponse.json(
        { error: "Rule name and message copy are required." },
        { status: 400 }
      );
    }

    const finalDmMessage = serializeRuleConfig({
      dm_message: dm_message.trim(),
      buttons,
      wa_buttons,
      require_follow,
      follow_prompt_message,
      follow_prompt_button_label,
      opening_dm_enabled,
      opening_dm_message,
      opening_dm_button_label,
      follow_up_enabled,
      follow_up_message,
      follow_up_delay_minutes,
      pending_next_reel,
      whole_word_match,
      post_permalink,
    });

    const supabase = createAdminClient();

    // 1. Find or create workspace
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
        { error: "Workspace could not be created." },
        { status: 500 }
      );
    }

    // 2. Insert rule into auto_automation_rules
    const { data: rule, error } = await (supabase
      .from("auto_automation_rules") as any)
      .insert({
        workspace_id: workspace.id,
        social_account_id: social_account_id || null,
        name: name.trim(),
        platform: platform.toLowerCase(),
        trigger_type: trigger_type.toLowerCase(),
        target_post_id: target_post_id || "all",
        keywords: Array.isArray(keywords)
          ? keywords
          : String(keywords)
              .split(",")
              .map((k: string) => k.trim().toUpperCase())
              .filter(Boolean),
        match_type: match_type === "exact" ? "exact" : "contains",
        public_reply_variants: Array.isArray(public_reply_variants)
          ? public_reply_variants.filter(Boolean)
          : [],
        dm_message: finalDmMessage,
        is_active: Boolean(is_active),
      })
      .select("*")
      .single();

    if (error) {
      console.error("[Rules API] Insert rule error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate edge cache so next webhook gets fresh rules immediately
    invalidateRulesCache(workspace.id);

    return NextResponse.json({ success: true, rule });
  } catch (err) {
    console.error("[Rules API] POST error:", err);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const uid = cookieStore.get("salty_uid")?.value;

    if (!uid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, is_active } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify workspace
    const { data: workspace } = await supabase
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const { data: updatedRule, error } = await (supabase
      .from("auto_automation_rules") as any)
      .update({
        is_active: Boolean(is_active),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("workspace_id", workspace.id)
      .select("*")
      .single();

    if (error) {
      console.error("[Rules API] Update rule error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateRulesCache(workspace.id);

    return NextResponse.json({ success: true, rule: updatedRule });
  } catch (err) {
    console.error("[Rules API] PATCH error:", err);
    return NextResponse.json({ error: "Failed to update rule" }, { status: 500 });
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
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Rule ID is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: workspace } = await supabase
      .from("auto_workspaces")
      .select("id")
      .eq("owner_id", uid)
      .maybeSingle();

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("auto_automation_rules")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspace.id);

    if (error) {
      console.error("[Rules API] Delete rule error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    invalidateRulesCache(workspace.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Rules API] DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete rule" }, { status: 500 });
  }
}
