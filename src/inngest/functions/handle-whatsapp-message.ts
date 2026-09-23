import { inngest } from "../client";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  sendWhatsAppTextMessage,
  sendWhatsAppInteractiveButtons,
  sendWhatsAppTypingIndicator,
  markWhatsAppMessageAsRead,
  WhatsAppReplyButton,
} from "@/lib/meta/whatsapp";
import { parseRuleConfig } from "@/lib/automation/rules";
import { deductAutomationCost } from "@/lib/billing/wallet";
import { getCachedActiveRules, getCachedSocialAccount } from "@/lib/cache/rules-cache";
import { logMessageToCRM } from "@/lib/crm/messages";

// Default Jasper's Market Interactive Button CTAs
const JASPERS_DEFAULT_BUTTONS: WhatsAppReplyButton[] = [
  { id: "reply-services", title: "Explore Services" },
  { id: "reply-portfolio", title: "Portfolio Work" },
  { id: "reply-offer", title: "Claim 20% Promo" },
];

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
      isInteractive,
      interactiveId,
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

    // 2. Fetch active connected WhatsApp account (Edge-Cached)
    const account = await step.run("fetch-whatsapp-account", async () => {
      const data = await getCachedSocialAccount("whatsapp", phoneNumberId);

      if (!data) {
        throw new Error(
          `No active WhatsApp account found for Phone ID: ${phoneNumberId}`
        );
      }

      return data;
    });

    // 3. Mark message as read and trigger typing indicator on WhatsApp
    await step.run("mark-read-and-type", async () => {
      await markWhatsAppMessageAsRead(phoneNumberId, messageId, account.access_token);
      await sendWhatsAppTypingIndicator(phoneNumberId, messageId, account.access_token);
    });

    // 4. Upsert or update contact in Social CRM
    const contactTags = ["whatsapp-inbound"];
    if (isInteractive && interactiveId) {
      contactTags.push(`choice:${interactiveId}`);
    }

    const contact = await step.run("upsert-whatsapp-contact", async () => {
      const { data, error } = await supabase
        .from("auto_contacts")
        .upsert(
          {
            workspace_id: account.workspace_id,
            name: profileName || from,
            whatsapp_phone: from,
            stage: "engaged",
            tags: contactTags,
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

    // 4b. Log inbound message to CRM
    if (contact?.id) {
      await step.run("log-inbound-message", async () => {
        await logMessageToCRM({
          workspaceId: account.workspace_id,
          contactId: contact.id,
          platform: "whatsapp",
          direction: "inbound",
          messageId: messageId,
          text: text,
          metadata: { isInteractive, interactiveId },
        });
      });
    }

    // 5. Fetch all active WhatsApp rules for this workspace (Edge-Cached)
    const rules = await step.run("fetch-active-rules", async () => {
      const data = await getCachedActiveRules(account.workspace_id, "whatsapp");
      return data || [];
    });

    let dispatchedRuleId: string | null = null;
    let followUpEnabled = false;

    // =========================================================================
    // CASE A: User clicked an Interactive Reply Button (Jasper's Market Flow)
    // =========================================================================
    if (isInteractive && interactiveId) {
      await step.run("handle-interactive-click", async () => {
        // 1. Check if a custom rule contains a matching button ID
        for (const rule of rules) {
          const config = parseRuleConfig(rule.dm_message);
          const matchedBtn = config.wa_buttons?.find((b) => b.id === interactiveId);

          if (matchedBtn) {
            dispatchedRuleId = rule.id;
            followUpEnabled = config.follow_up_enabled;
            const reply = matchedBtn.reply_text.replace(/\{name\}/gi, profileName || "there");
            await sendWhatsAppTextMessage(phoneNumberId, from, reply, account.access_token);
            return;
          }
        }

        // 2. Handle built-in Jasper's Market interactive button selections
        if (interactiveId === "reply-services" || interactiveId === "reply-interactive-with-media") {
          const body = `🎬 *Salty Media Production Services*\n\n• High-Converting Video Ads & Showreels\n• Instagram & WhatsApp Growth Automation\n• Creator Studio & Viral Storytelling\n\nVisit our full course and workshop hub:\nhttps://saltymediaproduction.com/workshops`;
          await sendWhatsAppTextMessage(phoneNumberId, from, body, account.access_token);
          followUpEnabled = true;
        } else if (interactiveId === "reply-portfolio" || interactiveId === "reply-media-card-carousel") {
          const body = `🌟 *Featured Client Production Showcase*\n\nExplore our latest commercial reels, masterclass highlights, and creative case studies:\nhttps://saltymediaproduction.com/courses\n\nReply 'CALL' to schedule a 1-on-1 strategy session with our director.`;
          await sendWhatsAppTextMessage(phoneNumberId, from, body, account.access_token);
          followUpEnabled = true;
        } else if (interactiveId === "reply-offer") {
          const body = `🎁 *Exclusive Limited-Time Offer*\n\nUse voucher code *SALTY20* to get 20% off your first month creative retainer or masterclass booking!\n\nRedeem now: https://saltymediaproduction.com\n_Valid for the next 48 hours._`;
          await sendWhatsAppTextMessage(phoneNumberId, from, body, account.access_token);
          followUpEnabled = true;
        } else {
          // Generic interactive fallback
          await sendWhatsAppTextMessage(
            phoneNumberId,
            from,
            `Thank you for selecting ${text}! A member of our creative team has been notified and will assist you shortly.`,
            account.access_token
          );
        }
      });
    }

    // =========================================================================
    // CASE B: Inbound Standard Text Message
    // =========================================================================
    else {
      const cleanText = (text || "").trim().toLowerCase();

      // Check for matching custom keyword rules first
      let matchedRule: any = null;
      for (const rule of rules) {
        const isMatch = rule.keywords.some((kw: string) => {
          const cleanKw = kw.trim().toLowerCase();
          return rule.match_type === "exact"
            ? cleanText === cleanKw
            : cleanText.includes(cleanKw);
        });

        if (isMatch) {
          matchedRule = rule;
          break;
        }
      }

      // If a custom rule matched
      if (matchedRule) {
        dispatchedRuleId = matchedRule.id;
        const config = parseRuleConfig(matchedRule.dm_message);
        followUpEnabled = config.follow_up_enabled;
        const replyText = config.dm_message.replace(/\{name\}/gi, profileName || "there");

        await step.run("send-custom-rule-reply", async () => {
          // If rule has interactive buttons configured, send as interactive button message!
          if (config.wa_buttons && config.wa_buttons.length > 0) {
            const btns = config.wa_buttons.slice(0, 3).map((b) => ({
              id: b.id,
              title: b.title,
            }));

            await sendWhatsAppInteractiveButtons(
              phoneNumberId,
              from,
              replyText,
              btns,
              account.access_token,
              messageId
            );
          } else {
            await sendWhatsAppTextMessage(
              phoneNumberId,
              from,
              replyText,
              account.access_token
            );
          }
        });
      }

      // If no custom rule matched, check if it's a common greeting / menu trigger
      else {
        const isGreeting =
          cleanText === "hi" ||
          cleanText === "hello" ||
          cleanText === "hey" ||
          cleanText === "start" ||
          cleanText === "menu" ||
          cleanText === "help" ||
          cleanText.includes("get started");

        if (isGreeting) {
          await step.run("send-jaspers-interactive-menu", async () => {
            const welcomeText = `Welcome to *Salty Media Production*! 🎬\n\nWhat can we help you with today? Tap an option below:`;
            await sendWhatsAppInteractiveButtons(
              phoneNumberId,
              from,
              welcomeText,
              JASPERS_DEFAULT_BUTTONS,
              account.access_token,
              messageId
            );
          });
          followUpEnabled = true;
        } else {
          // Default friendly concierge response
          await step.run("send-default-concierge", async () => {
            const defaultText = `Hi ${profileName || "there"}! 🌟 Thanks for contacting Salty Media Production.\n\nReply 'MENU' to view our interactive services, or let us know what creative project you're planning!`;
            await sendWhatsAppTextMessage(
              phoneNumberId,
              from,
              defaultText,
              account.access_token
            );
          });
        }
      }
    }

    // =========================================================================
    // CASE C: Serverless Follow-Up (Jasper's Market Re-engagement)
    // =========================================================================
    if (followUpEnabled) {
      await step.sleep("wait-for-customer-follow-up", "3m");

      await step.run("send-follow-up-check", async () => {
        const followUpText = `Is there anything else we can help you with today, ${profileName || "friend"}? 😊`;
        await sendWhatsAppInteractiveButtons(
          phoneNumberId,
          from,
          followUpText,
          [
            { id: "reply-services", title: "View Services" },
            { id: "reply-offer", title: "Promo Code" },
          ],
          account.access_token
        );
      });
    }

    // 8. Record audit log and deduct automation cost
    await step.run("record-log", async () => {
      await supabase.from("auto_automation_logs").insert({
        workspace_id: account.workspace_id,
        rule_id: dispatchedRuleId,
        contact_id: contact?.id || null,
        source_id: messageId,
        platform: "whatsapp",
        status: "success",
        error_message: null,
      });

      try {
        await deductAutomationCost(
          account.workspace_id,
          0.48,
          `WhatsApp Conversation Interaction: ${from}`,
          dispatchedRuleId || undefined
        );
      } catch (deductErr) {
        console.warn("[Billing] WhatsApp deduction failed:", deductErr);
      }
    });

    return { status: "success", contactId: contact?.id };
  }
);
