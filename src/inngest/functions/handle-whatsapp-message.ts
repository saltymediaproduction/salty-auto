import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendWhatsAppTextMessage,
  markWhatsAppMessageAsRead,
} from "@/lib/meta/whatsapp";

export const handleWhatsAppMessage = inngest.createFunction(
  {
    id: "handle-whatsapp-message",
    name: "Handle WhatsApp Inbound Message",
    concurrency: {
      limit: 5,
      key: "event.data.phoneNumberId",
    },
    retries: 2,
  },
  { event: "meta/whatsapp.message" },
  async ({ event, step }) => {
    const {
      phoneNumberId,
      messageId,
      from,
      profileName,
      text,
    } = event.data;

    const supabase = createAdminClient();

    // 1. Deduplication check
    const isAlreadyProcessed = await step.run("check-deduplication", async () => {
      const { data } = await supabase
        .from("auto_automation_logs")
        .select("id")
        .eq("source_id", messageId)
        .maybeSingle();

      return !!data;
    });

    if (isAlreadyProcessed) {
      return { status: "skipped", reason: "already_processed" };
    }

    // 2. Fetch active connected WhatsApp account
    const account = await step.run("fetch-whatsapp-account", async () => {
      const { data, error } = await supabase
        .from("auto_social_accounts")
        .select("id, workspace_id, access_token, status")
        .eq("platform", "whatsapp")
        .eq("account_id", phoneNumberId)
        .eq("status", "active")
        .maybeSingle();

      if (error || !data) {
        throw new Error(
          `No active WhatsApp account found for Phone ID: ${phoneNumberId}`
        );
      }

      return data;
    });

    // 3. Mark message as read on WhatsApp
    await step.run("mark-read", async () => {
      await markWhatsAppMessageAsRead(phoneNumberId, messageId, account.access_token);
    });

    // 4. Upsert or update contact in Social CRM
    const contact = await step.run("upsert-whatsapp-contact", async () => {
      const { data, error } = await supabase
        .from("auto_contacts")
        .upsert(
          {
            workspace_id: account.workspace_id,
            name: profileName || from,
            whatsapp_phone: from,
            stage: "engaged",
            tags: ["whatsapp-inbound"],
            last_contacted_at: new Date().toISOString(),
          },
          {
            onConflict: "workspace_id,whatsapp_phone",
          }
        )
        .select("id")
        .single();

      if (error) {
        console.error("[CRM] Failed to upsert WhatsApp contact:", error);
        return null;
      }

      return data;
    });

    // 5. Check if an active WhatsApp keyword auto-reply exists
    const autoReplyRule = await step.run("match-whatsapp-rule", async () => {
      const { data: rules } = await supabase
        .from("auto_automation_rules")
        .select("*")
        .eq("workspace_id", account.workspace_id)
        .eq("platform", "whatsapp")
        .eq("is_active", true);

      if (!rules || rules.length === 0) return null;

      const cleanText = text.trim().toLowerCase();
      for (const rule of rules) {
        const matched = rule.keywords.some((kw) => {
          const cleanKw = kw.trim().toLowerCase();
          return rule.match_type === "exact"
            ? cleanText === cleanKw
            : cleanText.includes(cleanKw);
        });

        if (matched) return rule;
      }

      return null;
    });

    // 6. Send response within 24h Customer Service Window (Free Tier)
    if (autoReplyRule) {
      await step.run("send-whatsapp-reply", async () => {
        const replyText = autoReplyRule.dm_message.replace(
          /\{name\}/gi,
          profileName || "there"
        );

        const res = await sendWhatsAppTextMessage(
          phoneNumberId,
          from,
          replyText,
          account.access_token
        );

        if (!res.success) {
          throw new Error(`Failed to send WhatsApp reply: ${res.error}`);
        }

        return res.data;
      });
    }

    // 7. Record log
    await step.run("record-log", async () => {
      await supabase.from("auto_automation_logs").insert({
        workspace_id: account.workspace_id,
        rule_id: autoReplyRule?.id || null,
        contact_id: contact?.id || null,
        source_id: messageId,
        platform: "whatsapp",
        status: "success",
        error_message: null,
      });
    });

    return { status: "success", contactId: contact?.id };
  }
);
