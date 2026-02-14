import { NextRequest, NextResponse } from "next/server";
import { sendEmail, isEmailConfigured, buildOutreachHTML } from "@/lib/email";
import { callOpenRouter } from "@/lib/openrouter";

/**
 * POST /api/email/send
 * 
 * Generates a personalized outreach email via LLM and sends it.
 * Accepts either a pre-written emailBody or generates one from candidate data.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      candidateName,
      candidateEmail,
      overallScore,
      strengths,
      gaps,
      jobTitle,
      companyName,
      emailBody: providedBody,
      subject: providedSubject,
    } = body;

    const recipientEmail = to || candidateEmail;
    if (!recipientEmail || !recipientEmail.includes("@")) {
      return NextResponse.json(
        { error: "Valid recipient email required" },
        { status: 400 }
      );
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email not configured. Set RESEND_API_KEY environment variable." },
        { status: 503 }
      );
    }

    // Either use the provided email body or generate one via LLM
    let emailBody = providedBody;
    if (!emailBody) {
      if (!candidateName) {
        return NextResponse.json(
          { error: "Either emailBody or candidateName required" },
          { status: 400 }
        );
      }

      // Generate email via LLM
      const prompt = [
        `Write a personalized recruiting outreach email.`,
        `Candidate: ${candidateName}`,
        `Score: ${overallScore || "N/A"}/100`,
        `Role: ${jobTitle || "Open Position"}`,
        `Company: ${companyName || "WeAssist"}`,
        `Key strengths: ${(strengths || []).join(", ") || "Strong qualifications"}`,
        `Areas to explore: ${(gaps || []).join(", ") || "None noted"}`,
        ``,
        `Rules:`,
        `- Keep it under 150 words`,
        `- Be specific about why THEY are a fit (reference their actual strengths)`,
        `- Include a clear call to action (schedule a chat)`,
        `- NEVER use em-dashes, use commas or periods instead`,
        `- NEVER use words like: seamless, spearhead, foster, robust, transformative, leverage, synergy`,
        `- Mix short punchy sentences with longer ones`,
        `- Sound like a real person, not a marketing email`,
        `- Open with something specific about them, not a generic greeting`,
        `- Output ONLY the email body text, no subject line or metadata`,
      ].join("\n");

      emailBody = await callOpenRouter(
        [
          { role: "system", content: "You are a friendly tech recruiter writing outreach emails. Write naturally, like you're texting a colleague about someone cool." },
          { role: "user", content: prompt },
        ],
        "auto",
        0.7
      );
    }

    // Generate subject line if not provided
    const subject =
      providedSubject ||
      `${jobTitle || "Exciting opportunity"} at ${companyName || "WeAssist"} - ${candidateName || "for you"}`;

    // Build HTML and send
    const html = buildOutreachHTML(emailBody, candidateName || "Candidate");
    const result = await sendEmail({
      to: recipientEmail,
      subject,
      html,
      text: emailBody,
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      emailBody,
      subject,
      sentTo: recipientEmail,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Email send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/email/send
 * Check email configuration status.
 */
export async function GET() {
  return NextResponse.json({
    configured: isEmailConfigured(),
    provider: "Resend (talentflow.elunari.uk)",
  });
}
