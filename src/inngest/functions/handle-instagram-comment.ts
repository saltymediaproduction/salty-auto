import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  replyToInstagramComment,
  sendInstagramPrivateDM,
} from "@/lib/meta/instagram";

export const handleInstagramComment = inngest.createFunction(
  {
    id: "handle-instagram-comment",
    name: "Handle Instagram Comment-to-DM",
    // Safeguards against account bans with per-account concurrency and rate limits
    concurrency: {
      limit: 3,
      key: "event.data.accountId",
    },
    rateLimit: {
      limit: 5,
      period: "1s",
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
    } = event.data;

    const supabase = createAdminClient();

    // 1. Deduplication check via database
    const isAlreadyProcessed = await step.run("check-deduplication", async () => {
      const { data } = await supabase
        .from("auto_automation_logs")
        .select("id")
        .eq("source_id", commentId)
        .maybeSingle();

      return !!data;
    });

    if (isAlreadyProcessed) {
      return { status: "skipped", reason: "already_processed" };
    }

    // 2. Fetch active connected social account & access token
    const account = await step.run("fetch-social-account", async () => {
      const { data, error } = await supabase
        .from("auto_social_accounts")
        .select("id, workspace_id, access_token, status")
        .eq("platform", "instagram")
        .eq("account_id", accountId)
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) {
        throw new Error(
          `No active social account found for Instagram ID: ${accountId}`
        );
      }

      return data;
    });

    // 3. Find matching active rule
    const matchingRule = await step.run("match-automation-rule", async () => {
      const { data: rules, error } = await supabase
        .from("auto_automation_rules")
        .select("*")
        .eq("workspace_id", account.workspace_id)
        .eq("platform", "instagram")
        .eq("trigger_type", "comment")
        .eq("is_active", true);

      if (error || !rules || rules.length === 0) {
        return null;
      }

      const cleanText = text.trim().toLowerCase();

      // Find the first rule that matches post ID and keyword
      for (const rule of rules) {
        // Post filter: either 'all' or specific post mediaId
        if (rule.target_post_id !== "all" && rule.target_post_id !== mediaId) {
          continue;
        }

        // Keyword filter:
        const matched = rule.keywords.some((kw) => {
          const cleanKw = kw.trim().toLowerCase();
          if (rule.match_type === "exact") {
            return cleanText === cleanKw;
          }
          return cleanText.includes(cleanKw);
        });

        if (matched) {
          return rule;
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

    // 4. Humanized jitter delay (1 to 3 seconds)
    await step.sleep("human-jitter", `${Math.floor(Math.random() * 2) + 1}s`);

    // 5. Post public reply to comment (pick randomized variant to avoid bot flags)
    const publicReplyText = await step.run("reply-public-comment", async () => {
      const variants = matchingRule.public_reply_variants;
      const selectedVariant =
        variants.length > 0
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

    // 6. Send private Direct Message to commenter
    const dmResult = await step.run("send-private-dm", async () => {
      // Personalize message copy
      const personalizedMessage = matchingRule.dm_message
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
            instagram_username: fromUsername,
            instagram_scoped_id: fromId,
            stage: "engaged",
            tags: ["instagram-comment-funnel"],
            last_contacted_at: new Date().toISOString(),
          },
          {
            onConflict: "workspace_id,instagram_scoped_id",
          }
        )
        .select("id")
        .single();

      if (error) {
        console.error("[CRM] Failed to upsert contact:", error);
        return null;
      }

      return data;
    });

    // 8. Record audit log
    await step.run("record-success-log", async () => {
      await supabase.from("auto_automation_logs").insert({
        workspace_id: account.workspace_id,
        rule_id: matchingRule.id,
        contact_id: contact?.id || null,
        source_id: commentId,
        platform: "instagram",
        status: "success",
        error_message: null,
      });
    });

    return {
      status: "success",
      ruleId: matchingRule.id,
      dmMessageId: dmResult?.message_id,
      publicReply: publicReplyText,
    };
  }
);
