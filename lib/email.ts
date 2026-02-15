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

/** Escape HTML special characters to prevent injection */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface Attachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: Attachment[];
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
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        content_type: a.contentType,
      })),
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
 * Build a branded HTML outreach email with wow-factor design.
 * Includes gradient banner, TalentFlow logo, score badge, and optional voice message callout.
 */
export function buildOutreachHTML(
  emailBody: string,
  candidateName: string,
  options?: {
    score?: number;
    jobTitle?: string;
    companyName?: string;
    hasVoiceMessage?: boolean;
    strengths?: string[];
    recruiterName?: string;
    recruiterEmail?: string;
  }
): string {
  const { score, jobTitle, companyName, hasVoiceMessage, strengths, recruiterName, recruiterEmail } = options || {};

  // Sanitize all user-supplied strings to prevent HTML injection
  const safeName = escapeHtml(candidateName);
  const firstName = escapeHtml(candidateName.split(" ")[0]);
  const safeJobTitle = escapeHtml(jobTitle || "Position");
  const safeCompanyName = escapeHtml(companyName || "WeAssist");
  const safeRecruiterName = recruiterName ? escapeHtml(recruiterName) : "";
  const replyEmail = recruiterEmail && recruiterEmail.includes("@") ? recruiterEmail : FROM_EMAIL;

  // Convert line breaks to paragraphs (sanitize email body content)
  const paragraphs = emailBody
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin: 0 0 14px 0; line-height: 1.7; color: #374151; font-size: 15px;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
    )
    .join("");

  // Score color
  const scoreColor =
    score && score >= 80
      ? "#10b981"
      : score && score >= 60
        ? "#f59e0b"
        : "#ef4444";
  const scoreLabel =
    score && score >= 80
      ? "Strong Match"
      : score && score >= 60
        ? "Potential Match"
        : "Worth Reviewing";

  // Strengths pills
  const strengthsHtml =
    strengths && strengths.length > 0
      ? `<div style="margin: 16px 0 0; display: flex; flex-wrap: wrap; gap: 6px;">
          ${strengths
            .slice(0, 4)
            .map(
              (s) =>
                `<span style="display: inline-block; background: linear-gradient(135deg, #ede9fe, #dbeafe); color: #5b21b6; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 20px;">${escapeHtml(s)}</span>`
            )
            .join("")}
        </div>`
      : "";

  // Voice message section
  const voiceSection = hasVoiceMessage
    ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff, #eff6ff); border: 1px solid #e9d5ff; border-radius: 12px; margin: 20px 0;">
        <tr>
          <td style="padding: 16px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 40px; height: 40px; background: linear-gradient(135deg, #8b5cf6, #3b82f6); border-radius: 50%; text-align: center; vertical-align: middle; padding: 0;">
                  <span style="display: inline-block; font-size: 18px; line-height: 40px;">&#127908;</span>
                </td>
                <td style="padding-left: 12px; vertical-align: middle;">
                  <p style="margin: 0; font-weight: 600; color: #1f2937; font-size: 14px;">Personal Voice Message Attached</p>
                  <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">We recorded a quick personal message just for you, ${firstName}. Check the attachment!</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${safeJobTitle} at ${safeCompanyName}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">

          <!-- BANNER -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed, #6366f1, #3b82f6); border-radius: 16px 16px 0 0; padding: 40px 32px 32px; text-align: center;">
              <!-- Logo Icon -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto 16px;">
                <tr>
                  <td style="background: rgba(255,255,255,0.2); width: 56px; height: 56px; border-radius: 14px; text-align: center; vertical-align: middle;">
                    <span style="font-size: 28px;">&#10024;</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 0 0 4px; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">TalentFlow AI</h1>
              <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.8); font-weight: 400;">Intelligent Recruiting Pipeline</p>

              ${
                score
                  ? `<!-- Score Badge -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 20px auto 0;">
                <tr>
                  <td style="background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 28px; padding: 8px 20px;">
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right: 8px;">
                          <div style="width: 32px; height: 32px; background: ${scoreColor}; border-radius: 50%; text-align: center; line-height: 32px; font-size: 14px; font-weight: 800; color: white;">${score}</div>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #ffffff;">${scoreLabel}</p>
                          <p style="margin: 0; font-size: 11px; color: rgba(255,255,255,0.7);">${safeJobTitle} fit score</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>`
                  : ""
              }
            </td>
          </tr>

          <!-- EMAIL BODY -->
          <tr>
            <td style="background: #ffffff; padding: 32px 32px 8px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              ${paragraphs}
              ${voiceSection}
              ${strengthsHtml}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background: #ffffff; padding: 8px 32px 32px; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
              ${safeRecruiterName ? `<p style="margin: 0 0 12px; font-size: 14px; color: #374151;">Best,<br><strong>${safeRecruiterName}</strong></p>` : ""}
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 16px 0 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #7c3aed, #3b82f6); border-radius: 10px; text-align: center;">
                    <a href="mailto:${replyEmail}?subject=Re:%20${encodeURIComponent((jobTitle || "Opportunity") + " at " + (companyName || "WeAssist"))}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; letter-spacing: 0.3px;">
                      I'm Interested &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background: #f9fafb; padding: 24px 32px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb; border-top: none;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <table role="presentation" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="width: 28px; height: 28px; background: linear-gradient(135deg, #7c3aed, #3b82f6); border-radius: 7px; text-align: center; vertical-align: middle;">
                          <span style="font-size: 14px;">&#10024;</span>
                        </td>
                        <td style="padding-left: 10px;">
                          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #374151;">TalentFlow AI</p>
                          <p style="margin: 0; font-size: 11px; color: #9ca3af;">Powered by AI. Built for humans.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <a href="https://talentflow-ai.elunari.uk" style="font-size: 12px; color: #6366f1; text-decoration: none; font-weight: 500;">Visit Platform &rarr;</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 10px; color: #d1d5db; text-align: center;">
                You received this because your profile matched an open position. &copy; 2026 TalentFlow AI
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
