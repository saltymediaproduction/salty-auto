import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  replyToInstagramComment,
  sendInstagramPrivateDM,
  sendInstagramButtonTemplate,
  sendInstagramDirectDM,
} from "@/lib/meta/instagram";
import { matchKeywords } from "@/lib/utils/keyword-matcher";
import { parseRuleConfig } from "@/lib/automation/rules";
import { getOrCreateTrackedLink } from "@/lib/tracking/client";
import { deductAutomationCost } from "@/lib/billing/wallet";
import { getCachedActiveRules, getCachedSocialAccount } from "@/lib/cache/rules-cache";

export const handleInstagramComment = inngest.createFunction(
  {
    id: "handle-instagram-comment",
    name: "Handle Instagram Comment-to-DM",
    // Safeguards against account bans with per-account concurrency and Meta 750/hr rate limit
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
  { event: "meta/instagram.comment" },
  async ({ event, step }) => {
    const {
      accountId,
      commentId,
      mediaId,
      fromId,
      fromUsername,
      text,
      timestamp,
    } = event.data;

    const supabase = createAdminClient();

    // 1. Deduplication check: Has this comment already been processed?
    const isAlreadyProcessed = await step.run("check-deduplication", async () => {
      const { data } = await supabase
        .from("auto_automation_logs")
        .select("id")
        .eq("source_id", commentId)
        .maybeSingle();

      return !!data;
    });

    if (isAlreadyProcessed) {
      console.log(`[Instagram Inngest] Comment ${commentId} already processed. Skipping.`);
      return { status: "skipped", reason: "already_processed" };
    }

    // 2. Fetch active connected social account & access token (Edge-Cached)
    const account = await step.run("fetch-social-account", async () => {
      const data = await getCachedSocialAccount("instagram", accountId);

      if (!data) {
        throw new Error(
          `No active social account found for Instagram ID: ${accountId}`
        );
      }

      return data;
    });

    // 3. Find matching active rule (Edge-Cached)
    const matchingRule = await step.run("match-automation-rule", async () => {
      const rules = await getCachedActiveRules(
        account.workspace_id,
        "instagram",
        "comment"
      );

      if (!rules || rules.length === 0) {
        return null;
      }

      for (const rule of rules) {
        const config = parseRuleConfig(rule.dm_message, rule);

        // Post filter: either 'all' or specific post mediaId
        if (rule.target_post_id !== "all" && rule.target_post_id !== mediaId) {
          continue;
        }

        // Multi-script & diacritic-resistant keyword matching
        const matchResult = matchKeywords(
          text,
          rule.keywords || [],
          config.whole_word_match
        );

        if (matchResult.matched) {
          return {
            rule,
            config,
            matchedKeyword: matchResult.matchedKeyword,
          };
        }
      }

      return null;
    });

    if (!matchingRule) {
      // Record as skipped so we don't re-evaluate
      await step.run("log-skipped", async () => {
        await supabase.from("auto_automation_logs").insert({
          workspace_id: account.workspace_id,
          rule_id: null,
          contact_id: null,
          source_id: commentId,
          platform: "instagram",
          status: "skipped",
          error_message: "No matching keyword or rule found",
        });
      });

      return { status: "skipped", reason: "no_matching_rule" };
    }

    // 4. Humanized jitter delay (1 to 2 seconds)
    await step.sleep("human-jitter", `${Math.floor(Math.random() * 2) + 1}s`);

    // 5. Post public reply to comment (pick randomized variant to avoid bot flags)
    const publicReplyText = await step.run("reply-public-comment", async () => {
      const variants = matchingRule.rule.public_reply_variants;
      const selectedVariant =
        variants && variants.length > 0
          ? variants[Math.floor(Math.random() * variants.length)]
          : "Sent you a DM! 🚀";

      const res = await replyToInstagramComment(
        commentId,
        selectedVariant,
        account.access_token
      );

      if (!res.success) {
        console.warn(
          `[Instagram Automation] Failed to reply to comment ${commentId}: ${res.error}`
        );
      }

      return selectedVariant;
    });

    // 6. Send private Direct Message to commenter (Button Template, Follow-Gate, or Plain DM)
    const dmResult = await step.run("send-private-dm", async () => {
      const { rule, config } = matchingRule;

      // Case A: Follow-Gated Campaign (Opening DM with Postback Button)
      if (config.require_follow) {
        const promptText = config.follow_prompt_message
          .replace(/\{username\}/gi, fromUsername)
          .replace(/\{name\}/gi, fromUsername);

        const res = await sendInstagramButtonTemplate({
          instagramAccountId: accountId,
          recipient: { comment_id: commentId },
          messageText: promptText,
          buttons: [
            {
              type: "postback",
              title: config.follow_prompt_button_label || "I'm Following",
              payload: JSON.stringify({
                action: "CHECK_FOLLOW",
                ruleId: rule.id,
                workspaceId: account.workspace_id,
                commentId,
              }),
            },
          ],
          accessToken: account.access_token,
        });

        if (!res.success) {
          throw new Error(`Failed to send follow-gate button DM: ${res.error}`);
        }

        return res.data;
      }

      // Case A2: 2-Step Opening DM Icebreaker Opt-In
      if (config.opening_dm_enabled) {
        const openingText = (config.opening_dm_message || "Hey there! Tap below to get your exclusive access link 🚀")
          .replace(/\{username\}/gi, fromUsername)
          .replace(/\{name\}/gi, fromUsername);

        const res = await sendInstagramButtonTemplate({
          instagramAccountId: accountId,
          recipient: { comment_id: commentId },
          messageText: openingText,
          buttons: [
            {
              type: "postback",
              title: config.opening_dm_button_label || "Send me the link!",
              payload: JSON.stringify({
                action: config.require_follow ? "CHECK_FOLLOW" : "OPENING_OPTIN",
                ruleId: rule.id,
                workspaceId: account.workspace_id,
                commentId,
              }),
            },
          ],
          accessToken: account.access_token,
        });

        if (!res.success) {
          throw new Error(`Failed to send opening DM: ${res.error}`);
        }

        return res.data;
      }

      // Case B: Interactive Button Template Campaign (with Tracked Links)
      if (config.buttons && config.buttons.length > 0) {
        const messageText = config.dm_message
          .replace(/\{username\}/gi, fromUsername)
          .replace(/\{name\}/gi, fromUsername);

        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://auto.saltymediaproduction.com";

        // Convert each button URL into a tracked short link
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

        const res = await sendInstagramButtonTemplate({
          instagramAccountId: accountId,
          recipient: { comment_id: commentId },
          messageText,
          buttons: trackedButtons,
          accessToken: account.access_token,
        });

        if (!res.success) {
          throw new Error(`Failed to send button template DM: ${res.error}`);
        }

        return res.data;
      }

      // Case C: Standard Text Direct Message
      const personalizedMessage = config.dm_message
        .replace(/\{username\}/gi, fromUsername)
        .replace(/\{name\}/gi, fromUsername);

      const res = await sendInstagramPrivateDM(
        accountId,
        commentId,
        personalizedMessage,
        account.access_token
      );

      if (!res.success) {
        throw new Error(`Failed to send private DM: ${res.error}`);
      }

      return res.data;
    });

    // 7. Upsert contact in Social CRM
    const contact = await step.run("upsert-crm-contact", async () => {
      const { data, error } = await supabase
        .from("auto_contacts")
        .upsert(
          {
            workspace_id: account.workspace_id,
            name: fromUsername,
            instagram_username: fromUsername,
            instagram_scoped_id: dmResult?.recipient_id || fromId || null,
            stage: "lead",
            tags: ["instagram", "comment_lead"],
            metadata: {
              last_comment_id: commentId,
              last_media_id: mediaId,
              last_rule_matched: matchingRule.rule.id,
              matched_keyword: matchingRule.matchedKeyword,
              dm_sent_at: new Date().toISOString(),
            },
            last_contacted_at: new Date().toISOString(),
          },
          {
            onConflict: "workspace_id,instagram_scoped_id",
          }
        )
        .select("id")
        .single();

      if (error) {
        console.warn("[Social CRM] Upsert contact warning:", error.message);
      }

      return data;
    });

    // 8. Log successful automation run for deduplication & audit trail and deduct cost
    await step.run("log-automation-success", async () => {
      await supabase.from("auto_automation_logs").insert({
        workspace_id: account.workspace_id,
        rule_id: matchingRule.rule.id,
        contact_id: contact?.id || null,
        source_id: commentId,
        platform: "instagram",
        status: "success",
        error_message: null,
      });

      // Deduct automation cost from real-time wallet ledger
      try {
        await deductAutomationCost(
          account.workspace_id,
          0.15,
          `Instagram Comment-to-DM: @${fromUsername}`,
          matchingRule.rule.id
        );
      } catch (deductErr) {
        console.warn("[Billing] Automation deduction failed:", deductErr);
      }
    });

    // 9. Scheduled Follow-Up DM (Optional, within 24-hour customer care window)
    if (matchingRule.config.follow_up_enabled && matchingRule.config.follow_up_message && dmResult?.recipient_id) {
      const delayMinutes = matchingRule.config.follow_up_delay_minutes || 15;
      await step.sleep("wait-for-follow-up", `${delayMinutes}m`);

      await step.run("send-delayed-follow-up", async () => {
        const followUpCopy = matchingRule.config.follow_up_message
          .replace(/\{username\}/gi, fromUsername)
          .replace(/\{name\}/gi, fromUsername);

        await sendInstagramDirectDM(
          accountId,
          dmResult.recipient_id,
          followUpCopy,
          account.access_token
        );
      });
    }

    return {
      status: "success",
      ruleId: matchingRule.rule.id,
      recipientId: dmResult?.recipient_id,
      publicReply: publicReplyText,
    };
  }
);
