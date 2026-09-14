import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export const SENDER_EMAIL = process.env.RESEND_FROM_EMAIL || "team@saltymediaproduction.com";
export const SENDER_NAME = process.env.RESEND_FROM_NAME || "Salty Media";
export const REPLY_TO = process.env.RESEND_REPLY_TO || "saltymediaproduction@gmail.com";

export const DEFAULT_FROM = `"${SENDER_NAME}" <${SENDER_EMAIL}>`;

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Sends a branded welcome email to newly registered agency users.
 */
export async function sendWelcomeEmail(
  toEmail: string,
  userName?: string | null
): Promise<SendEmailResult> {
  if (!resend) {
    console.warn("[Resend] Skipped sending welcome email: Missing RESEND_API_KEY");
    return { success: false, error: "Missing RESEND_API_KEY" };
  }

  const name = userName || "Agency Leader";

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [toEmail],
      replyTo: REPLY_TO,
      subject: "Welcome to Salty Auto — Your Social Media Automation Engine",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f8fafc; padding: 40px 20px; text-align: center;">
          <div style="max-width: 540px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 20px; padding: 36px 30px; text-align: left;">
            <div style="font-size: 20px; font-weight: 800; color: #6366f1; letter-spacing: 0.5px; margin-bottom: 20px;">
              SALTY AUTO
            </div>
            <h1 style="font-size: 22px; font-weight: 700; color: #ffffff; margin-bottom: 14px; line-height: 1.3;">
              Welcome to Salty Auto, ${name}! 🚀
            </h1>
            <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px;">
              Your agency workspace is officially provisioned and ready. You can now build high-converting Instagram Comment-to-DM funnels, run official WhatsApp Cloud API campaigns, and track leads in your unified Social CRM.
            </p>
            <div style="background-color: #1e293b; border-radius: 12px; padding: 18px; margin-bottom: 28px;">
              <div style="font-size: 13px; font-weight: 600; color: #ffffff; margin-bottom: 6px;">Your Dedicated Portal:</div>
              <a href="https://auto.saltymediaproduction.com" style="font-size: 14px; font-family: monospace; color: #818cf8; text-decoration: none;">
                auto.saltymediaproduction.com
              </a>
            </div>
            <a href="https://auto.saltymediaproduction.com" style="display: block; text-align: center; background-color: #4f46e5; color: #ffffff; font-weight: 600; font-size: 14px; padding: 14px 24px; border-radius: 12px; text-decoration: none;">
              Open Your Automation Dashboard →
            </a>
            <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center;">
              Sent by Salty Media Production • Dedicated Agency Automation Engine
            </div>
          </div>
        </div>
      `,
    });

    return { success: true, id: data.data?.id };
  } catch (err) {
    console.error("[Resend] Error sending welcome email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}

/**
 * Sends real-time alerts when a new qualified lead is captured on Instagram or WhatsApp.
 */
export async function sendLeadAlertEmail(
  toEmail: string,
  details: {
    leadName: string;
    channel: "instagram" | "whatsapp";
    identifier: string;
    keywordTriggered: string;
  }
): Promise<SendEmailResult> {
  if (!resend) return { success: false, error: "Missing RESEND_API_KEY" };

  try {
    const data = await resend.emails.send({
      from: DEFAULT_FROM,
      to: [toEmail],
      replyTo: REPLY_TO,
      subject: `🎯 New ${details.channel.toUpperCase()} Lead Captured: ${details.leadName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #090d16; color: #f8fafc; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 28px;">
            <h2 style="font-size: 18px; color: #ffffff; margin-bottom: 12px;">New Lead Synced to Social CRM</h2>
            <p style="font-size: 14px; color: #94a3b8; line-height: 1.5;">
              A new contact engaged with your automation:
            </p>
            <ul style="font-size: 13px; color: #cbd5e1; line-height: 1.8; margin: 16px 0; padding-left: 20px;">
              <li><strong>Contact:</strong> ${details.leadName}</li>
              <li><strong>Channel:</strong> ${details.channel.toUpperCase()} (${details.identifier})</li>
              <li><strong>Keyword Triggered:</strong> <span style="color: #818cf8; font-family: monospace;">${details.keywordTriggered}</span></li>
            </ul>
            <a href="https://auto.saltymediaproduction.com/crm" style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 13px; font-weight: 600; padding: 10px 18px; border-radius: 10px; text-decoration: none; margin-top: 10px;">
              View Lead in CRM →
            </a>
          </div>
        </div>
      `,
    });

    return { success: true, id: data.data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to send email" };
  }
}
