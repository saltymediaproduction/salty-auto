import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  checkUserFollowsBusiness,
  sendInstagramDirectDM,
  sendInstagramButtonTemplate,
} from "@/lib/meta/instagram";
import { parseRuleConfig } from "@/lib/automation/rules";
import { getOrCreateTrackedLink } from "@/lib/tracking/client";

export const handleInstagramPostback = inngest.createFunction(
  {
    id: "handle-instagram-postback",
    name: "Handle Instagram Postback (Follow-Gate Verification)",
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
  { event: "meta/instagram.postback" },
  async ({ event, step }) => {
    const { accountId, senderId, payload, timestamp } = event.data;

    let parsedPayload: any = null;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      return { status: "ignored", reason: "invalid_payload_json" };
    }

    if (
      (parsedPayload.action !== "CHECK_FOLLOW" && parsedPayload.action !== "OPENING_OPTIN") ||
      !parsedPayload.ruleId
    ) {
      return { status: "ignored", reason: "not_supported_action" };
    }

    const { ruleId, workspaceId, action } = parsedPayload;
    const supabase = createAdminClient();

    // 1. Fetch account access token
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

    // 2. Fetch automation rule
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

    // 3. If action is OPENING_OPTIN and follow is NOT required, deliver directly
    // If action is CHECK_FOLLOW or require_follow is true, verify follow status
    let isFollowing: boolean | null = null;
    let shouldDeliver = action === "OPENING_OPTIN" && !config.require_follow;

    if (!shouldDeliver) {
      isFollowing = await step.run("verify-follow-status", async () => {
        return await checkUserFollowsBusiness(senderId, account.access_token);
      });
      shouldDeliver = isFollowing === true || isFollowing === null;
    }

    // 4. Send reveal or reminder based on status
    if (shouldDeliver) {
      // Deliver the content
      await step.run("send-gated-content", async () => {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://auto.saltymediaproduction.com";

        if (config.buttons && config.buttons.length > 0) {
          const trackedButtons = await Promise.all(
            config.buttons.slice(0, 3).map(async (btn) => {
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
            messageText: config.dm_message || "Thanks for following! Here is your exclusive link: 🎁",
            buttons: trackedButtons,
            accessToken: account.access_token,
          });
        } else {
          await sendInstagramDirectDM(
            accountId,
            senderId,
            config.dm_message || "Thanks for following! Here is your link: 🚀",
            account.access_token
          );
        }
      });

      // Log success in CRM
      await step.run("log-follow-unlocked", async () => {
        await supabase.from("auto_automation_logs").insert({
          workspace_id: account.workspace_id,
          rule_id: rule.id,
          contact_id: null,
          source_id: `postback_${senderId}_${timestamp}`,
          platform: "instagram",
          status: "success",
          error_message: "Follower verified: gated link delivered",
        });
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
