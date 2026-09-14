import { createHash, randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export interface TrackedLinkRecord {
  id: string;
  workspace_id: string;
  rule_id: string | null;
  slug: string;
  destination_url: string;
  label?: string;
  clicks_count: number;
}

/**
 * Generates a short, collision-resistant URL slug
 */
export function generateSlug(length: number = 6): string {
  const chars = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = randomBytes(length);
  let slug = "";
  for (let i = 0; i < length; i++) {
    slug += chars[bytes[i] % chars.length];
  }
  return slug;
}

/**
 * Creates or retrieves a tracked short link for an automation campaign
 */
export async function getOrCreateTrackedLink({
  workspaceId,
  ruleId,
  destinationUrl,
  label,
}: {
  workspaceId: string;
  ruleId: string | null;
  destinationUrl: string;
  label?: string;
}): Promise<string> {
  const supabase = createAdminClient();

  // Try querying auto_tracked_links if table exists
  try {
    const { data: existing } = await (supabase as any)
      .from("auto_tracked_links")
      .select("slug")
      .eq("workspace_id", workspaceId)
      .eq("destination_url", destinationUrl)
      .maybeSingle();

    if (existing?.slug) {
      return existing.slug;
    }

    const slug = generateSlug(6);

    const { error: insertError } = await (supabase as any)
      .from("auto_tracked_links")
      .insert({
        workspace_id: workspaceId,
        rule_id: ruleId,
        slug,
        destination_url: destinationUrl,
        label: label || null,
        clicks_count: 0,
      });

    if (!insertError) {
      return slug;
    }
  } catch {
    // If auto_tracked_links table is not yet migrated, fallback to automation logs metadata
  }

  // Fallback: Create slug and store definition in auto_automation_logs
  const fallbackSlug = generateSlug(6);
  await supabase.from("auto_automation_logs").insert({
    workspace_id: workspaceId,
    rule_id: ruleId,
    contact_id: null,
    source_id: `link_${fallbackSlug}`,
    platform: "instagram",
    status: "success",
    error_message: JSON.stringify({
      type: "tracked_link",
      slug: fallbackSlug,
      destination_url: destinationUrl,
      label: label || null,
    }),
  });

  return fallbackSlug;
}

/**
 * Resolves a short slug to its destination URL
 */
export async function resolveTrackedSlug(slug: string): Promise<string | null> {
  const supabase = createAdminClient();

  // 1. Try resolving from auto_tracked_links
  try {
    const { data } = await (supabase as any)
      .from("auto_tracked_links")
      .select("destination_url")
      .eq("slug", slug)
      .maybeSingle();

    if (data?.destination_url) {
      return data.destination_url;
    }
  } catch {
    // Fallback to logs
  }

  // 2. Fallback: Search from auto_automation_logs
  try {
    const { data: log } = await supabase
      .from("auto_automation_logs")
      .select("error_message")
      .eq("source_id", `link_${slug}`)
      .maybeSingle();

    if (log?.error_message) {
      const parsed = JSON.parse(log.error_message);
      if (parsed.destination_url) {
        return parsed.destination_url;
      }
    }
  } catch {
    // Not found
  }

  return null;
}

/**
 * Records a click on a tracked link asynchronously
 */
export async function recordLinkClick({
  slug,
  ip,
  userAgent,
  referrer,
}: {
  slug: string;
  ip?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}): Promise<void> {
  const supabase = createAdminClient();
  const ipHash = ip ? createHash("sha256").update(ip).digest("hex").slice(0, 16) : null;

  try {
    // 1. Fetch tracked link row
    const { data: link } = await (supabase as any)
      .from("auto_tracked_links")
      .select("id, workspace_id, rule_id, clicks_count")
      .eq("slug", slug)
      .maybeSingle();

    if (link) {
      // Increment click counter
      await (supabase as any)
        .from("auto_tracked_links")
        .update({
          clicks_count: (link.clicks_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", link.id);

      // Insert click log
      await (supabase as any)
        .from("auto_link_clicks")
        .insert({
          workspace_id: link.workspace_id,
          tracked_link_id: link.id,
          rule_id: link.rule_id,
          ip_hash: ipHash,
          user_agent: userAgent ? userAgent.slice(0, 255) : null,
          referrer: referrer ? referrer.slice(0, 255) : null,
        });
      return;
    }
  } catch {
    // Fallback
  }

  // Fallback: Record click in auto_automation_logs
  try {
    const { data: log } = await supabase
      .from("auto_automation_logs")
      .select("workspace_id, rule_id")
      .eq("source_id", `link_${slug}`)
      .maybeSingle();

    if (log) {
      await supabase.from("auto_automation_logs").insert({
        workspace_id: log.workspace_id,
        rule_id: log.rule_id,
        contact_id: null,
        source_id: `click_${slug}_${Date.now()}`,
        platform: "instagram",
        status: "success",
        error_message: JSON.stringify({
          type: "link_click",
          slug,
          ip_hash: ipHash,
          user_agent: userAgent,
          referrer,
        }),
      });
    }
  } catch (err) {
    console.warn("[Link Tracking] Failed to record click:", err);
  }
}
