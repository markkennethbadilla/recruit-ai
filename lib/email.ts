/**
 * Email Sending Utility
 * 
 * Uses Resend with custom domain (talentflow.elunari.uk) for email delivery.
 * Requires RESEND_API_KEY environment variable.
 */

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = "recruiting@talentflow.elunari.uk";
const FROM_NAME = "TalentFlow AI";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email via Resend (talentflow.elunari.uk domain).
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
      replyTo: options.replyTo || FROM_EMAIL,
    });

    if (error) {
      console.error("[Email]", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email send failed";
    console.error("[Email]", message);
    return { success: false, error: message };
  }
}

/**
 * Check if email credentials are configured.
 */
export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

/**
 * Build a clean HTML email from plain text outreach content.
 */
export function buildOutreachHTML(emailBody: string, candidateName: string): string {
  // Convert line breaks to paragraphs
  const paragraphs = emailBody
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin: 0 0 12px 0; line-height: 1.6;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${paragraphs}
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
  <p style="font-size: 11px; color: #999; margin: 0;">
    Sent via <a href="https://talentflow-ai.vercel.app" style="color: #6366f1;">TalentFlow AI</a>
  </p>
</body>
</html>`.trim();
}
