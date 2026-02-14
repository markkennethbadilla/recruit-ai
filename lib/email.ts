/**
 * Email Sending Utility
 * 
 * Uses Nodemailer with Gmail SMTP for actual email delivery.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD environment variables.
 * 
 * App Password setup: Google Account > Security > 2-Step Verification > App Passwords
 */

import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";

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

function createTransport() {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    throw new Error("Gmail credentials not configured (GMAIL_USER, GMAIL_APP_PASSWORD)");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });
}

/**
 * Send an email via Gmail SMTP.
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const transport = createTransport();

    const info = await transport.sendMail({
      from: `"TalentFlow AI" <${GMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""),
      replyTo: options.replyTo || GMAIL_USER,
    });

    return { success: true, messageId: info.messageId };
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
  return Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);
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
