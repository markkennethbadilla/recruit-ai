import { NextRequest, NextResponse } from "next/server";
import { generateOutreach } from "@/lib/n8n";
import { generateOutreachAudio, getUsageInfo } from "@/lib/kokoro";

/**
 * Build a human-sounding email prompt for LLM-powered outreach.
 * Anti-AI rules: no em-dashes, no "seamless/robust/transformative",
 * mix short + long sentences, sound like a recruiter talking to a colleague.
 */
function buildEmailPrompt(params: {
  candidateName: string;
  score: number;
  jobTitle: string;
  companyName: string;
  strengths: string[];
}): string {
  const { candidateName, score, jobTitle, companyName, strengths } = params;
  return [
    `Write a personalized recruiting outreach email.`,
    `Candidate: ${candidateName}`,
    `Score: ${score}/100`,
    `Role: ${jobTitle}`,
    `Company: ${companyName}`,
    `Key strengths: ${strengths.join(", ")}`,
    `Tone: warm, genuine, like texting a friend about a cool opportunity`,
    ``,
    `Rules:`,
    `- Keep it under 150 words`,
    `- Be specific about why THEY are a fit (reference their actual strengths)`,
    `- Include a clear call to action (schedule a chat)`,
    `- NEVER use em-dashes, use commas or periods instead`,
    `- NEVER use words like: seamless, spearhead, foster, robust, transformative, leverage, synergy`,
    `- Mix short punchy sentences with longer ones (human burstiness)`,
    `- No "header: description" list patterns`,
    `- Sound like a real person, not a marketing email`,
    `- Open with something specific about them, not a generic greeting`,
  ].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { candidateName, candidateEmail, overallScore, strengths, gaps, jobTitle, companyName } = body;

    if (!candidateName) {
      return NextResponse.json({ error: "Missing candidateName" }, { status: 400 });
    }

    // Fire n8n outreach webhook + Kokoro TTS in parallel
    const [n8nResult, kokoroResult] = await Promise.allSettled([
      generateOutreach({
        candidateName,
        candidateEmail: candidateEmail || "",
        overallScore: overallScore || 0,
        strengths: strengths || [],
        gaps: gaps || [],
        jobTitle: jobTitle || "Open Position",
        companyName: companyName || "WeAssist",
      }),
      // Generate real voice audio via Kokoro TTS
      generateOutreachAudio(
        candidateName,
        jobTitle || "Open Position",
        overallScore || 0,
        strengths?.length > 0
          ? `Key strengths: ${strengths.join(", ")}`
          : "Strong candidate with promising qualifications"
      ),
    ]);

    const n8n =
      n8nResult.status === "fulfilled"
        ? n8nResult.value
        : { success: false, error: "n8n unreachable" };

    const tts =
      kokoroResult.status === "fulfilled"
        ? kokoroResult.value
        : { success: false, error: "Kokoro TTS unreachable", script: "", audioBase64: undefined, contentType: undefined, characterCount: undefined };

    // Get usage info (non-blocking)
    const usage = await getUsageInfo().catch(() => ({
      character_count: 0,
      character_limit: 0,
      can_use: false,
    }));

    // Build a human-sounding email prompt locally (anti-AI compliant)
    const localEmailPrompt = buildEmailPrompt({
      candidateName,
      score: overallScore || 0,
      jobTitle: jobTitle || "Open Position",
      companyName: companyName || "WeAssist",
      strengths: strengths || [],
    });

    // Prefer n8n-generated prompt, fallback to our local anti-AI version
    const n8nEmailPrompt = n8n.success ? (n8n as { data?: { emailPrompt?: string } }).data?.emailPrompt || "" : "";
    const toneLabel = "warm and genuine";

    return NextResponse.json({
      success: n8n.success || tts.success,
      emailPrompt: localEmailPrompt, // always use anti-AI compliant prompt
      voiceScript: tts.script || (n8n.success ? (n8n as { data?: { voiceScript?: string } }).data?.voiceScript || "" : ""),
      tone: toneLabel,
      // Kokoro TTS audio
      voiceAudio: tts.success
        ? {
            base64: tts.audioBase64,
            contentType: tts.contentType,
            characterCount: tts.characterCount,
          }
        : null,
      // Integration statuses
      n8nConnected: n8n.success,
      kokoroConnected: tts.success,
      kokoroUsage: {
        used: usage.character_count,
        limit: usage.character_limit,
        remaining: usage.character_limit - usage.character_count,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Outreach generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
