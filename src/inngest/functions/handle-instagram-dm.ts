import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkUserFollowsBusiness,
  sendInstagramDirectDM,
  sendInstagramButtonTemplate,
} from "@/lib/meta/instagram";
import { parseRuleConfig } from "@/lib/automation/rules";
import { getOrCreateTrackedLink } from "@/lib/tracking/client";

export const handleInstagramDm = inngest.createFunction(
  {
    id: "handle-instagram-dm",
    name: "Handle Inbound Instagram DM",
    concurrency: {
      limit: 3,
      key: "event.data.accountId",
    },
    throttle: {
      limit: 750,
      period: "1h",
      key: "event.data.accountId",
    },
    retries: 2,
  },
  { event: "meta/instagram.dm" },
  async ({ event, step }) => {
    const { accountId, senderId, text, timestamp } = event.data;

    const supabase = createAdminClient();

    // Find the latest contact for this sender to know which rule they are interacting with
    const contact = await step.run("fetch-contact", async () => {
      const { data } = await supabase
        .from("auto_contacts")
        .select("workspace_id, metadata")
        .eq("instagram_scoped_id", senderId)
        .order("last_contacted_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    });

    if (!contact || !contact.metadata) {
      return { status: "ignored", reason: "no_active_context" };
    }

    const metadata = contact.metadata as Record<string, any>;

    if (!metadata.last_rule_matched) {
      return { status: "ignored", reason: "no_active_context" };
    }

    const ruleId = metadata.last_rule_matched;

    // Fetch account access token
    const account = await step.run("fetch-account", async () => {
      const { data, error } = await supabase
        .from("auto_social_accounts")
        .select("id, workspace_id, access_token")
        .eq("platform", "instagram")
        .eq("account_id", accountId)
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) {
        throw new Error(`Account not found for ID: ${accountId}`);
      }
      return data;
    });

    // Fetch automation rule
    const rule = await step.run("fetch-rule", async () => {
      const { data, error } = await supabase
        .from("auto_automation_rules")
        .select("*")
        .eq("id", ruleId)
        .maybeSingle();

      if (error || !data) {
        throw new Error(`Rule not found for ID: ${ruleId}`);
      }
      return data;
    });

    const config = parseRuleConfig(rule.dm_message, rule);

    // If follow is required, verify follow status
    let isFollowing: boolean | null = null;
    let shouldDeliver = !config.require_follow;

    if (!shouldDeliver) {
      isFollowing = await step.run("verify-follow-status", async () => {
        return await checkUserFollowsBusiness(senderId, account.access_token);
      });
      shouldDeliver = isFollowing === true || isFollowing === null;
    }

    // Send reveal or reminder based on status
    if (shouldDeliver) {
      // Deliver the content
      await step.run("send-gated-content", async () => {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://auto.saltymediaproduction.com";

        if (config.buttons && config.buttons.length > 0) {
          const trackedButtons = await Promise.all(
            config.buttons.slice(0, 3).map(async (btn: any) => {
              const slug = await getOrCreateTrackedLink({
                workspaceId: account.workspace_id,
                ruleId: rule.id,
                destinationUrl: btn.url,
                label: btn.title,
              });

              return {
                type: "web_url" as const,
                title: btn.title,
                url: `${appUrl}/r/${slug}`,
              };
            })
          );

          await sendInstagramButtonTemplate({
            instagramAccountId: accountId,
            recipient: { id: senderId },
            messageText: config.dm_message || "Thanks! Here is your exclusive link: 🎁",
            buttons: trackedButtons,
            accessToken: account.access_token,
          });
        } else {
          await sendInstagramDirectDM(
            accountId,
            senderId,
            config.dm_message || "Thanks! Here is your link: 🚀",
            account.access_token
          );
        }
      });

      return { status: "unlocked", isFollowing };
    } else {
      // User is not yet following -> Re-prompt politely with button
      await step.run("send-follow-reminder", async () => {
        await sendInstagramButtonTemplate({
          instagramAccountId: accountId,
          recipient: { id: senderId },
          messageText: "Looks like you aren't following yet! Please tap follow on our profile above, then tap below to unlock your link: 👇",
          buttons: [
            {
              type: "postback",
              title: config.follow_prompt_button_label || "I Followed! Unlock Link",
              payload: JSON.stringify({
                action: "CHECK_FOLLOW",
                ruleId: rule.id,
                workspaceId: account.workspace_id,
              }),
            },
          ],
          accessToken: account.access_token,
        });
      });

      return { status: "reprompted", isFollowing: false };
    }
  }
);
