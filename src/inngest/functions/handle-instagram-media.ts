import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseRuleConfig, serializeRuleConfig } from "@/lib/automation/rules";

export const handleInstagramMedia = inngest.createFunction(
  {
    id: "handle-instagram-media",
    name: "Handle Instagram Media (Attach to Next Reel)",
    retries: 2,
  },
  { event: "meta/instagram.media" },
  async ({ event, step }) => {
    const { accountId, mediaId, mediaType } = event.data;

    const supabase = createAdminClient();

    // 1. Fetch connected social account
    const account = await step.run("fetch-account", async () => {
      const { data, error } = await supabase
        .from("auto_social_accounts")
        .select("id, workspace_id")
        .eq("platform", "instagram")
        .eq("account_id", accountId)
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) {
        throw new Error(`Active account not found for Instagram ID: ${accountId}`);
      }
      return data;
    });

    // 2. Find rules waiting for the next reel
    const boundCount = await step.run("bind-pending-rules", async () => {
      const { data: rules } = await supabase
        .from("auto_automation_rules")
        .select("*")
        .eq("workspace_id", account.workspace_id)
        .eq("platform", "instagram")
        .eq("is_active", true);

      if (!rules || rules.length === 0) {
        return 0;
      }

      let attached = 0;
      for (const rule of rules) {
        const config = parseRuleConfig(rule.dm_message, rule);

        // Check if rule is waiting for the next reel
        if (config.pending_next_reel || rule.target_post_id === "next_reel") {
          const updatedConfig = {
            ...config,
            pending_next_reel: false,
          };

          const newDmMessage = serializeRuleConfig(updatedConfig);

          await supabase
            .from("auto_automation_rules")
            .update({
              target_post_id: mediaId,
              dm_message: newDmMessage,
              updated_at: new Date().toISOString(),
            })
            .eq("id", rule.id);

          // Log attachment
          await supabase.from("auto_automation_logs").insert({
            workspace_id: account.workspace_id,
            rule_id: rule.id,
            contact_id: null,
            source_id: `attached_${mediaId}`,
            platform: "instagram",
            status: "success",
            error_message: `Auto-attached to newly published ${mediaType} (Media ID: ${mediaId})`,
          });

          attached++;
        }
      }

      return attached;
    });

    return { status: "processed", mediaId, boundRules: boundCount };
  }
);
