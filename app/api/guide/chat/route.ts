import { NextRequest, NextResponse } from "next/server";
import { findCachedAnswer } from "@/lib/semantic-cache";
import { callOpenRouter } from "@/lib/openrouter";

const SYSTEM_PROMPT = `You are the TalentFlow AI Guide Assistant. You help users understand and use the TalentFlow AI Recruiting Platform.

Key facts about TalentFlow:
- Built with Next.js 16, React 19, Tailwind 4, Framer Motion
- Uses OpenRouter to access free LLMs (Gemma 3 27B, LLaMA 3.3 70B, DeepSeek R1, Qwen3 32B, Mistral Small, Phi-4, DeepHermes 3) with GPT-4o-mini as paid fallback
- n8n provides 5 orchestration workflows: Candidate Intake, Smart Outreach, Data Sync, Health Monitor, Pipeline Reports
- NocoDB serves as the CRM (Candidates table)
- ElevenLabs provides text-to-speech for personalized voice outreach (Rachel voice)
- The pipeline: Upload resume -> AI parses -> 6-axis scoring -> screening questions -> integration results
- "Auto (Smart)" model selection picks the first non-rate-limited free model
- Rate-limited models get a 5-minute cooldown, then retry
- Candidate /apply page sends data to both NocoDB and n8n

Be concise, helpful, and specific. Use markdown formatting. Keep answers under 200 words unless the user asks for detail.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, route, contextSummary, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const hasLiveContext = typeof contextSummary === "string" && contextSummary.trim().length > 0;

    // Try semantic cache first for generic questions only (when no live context is provided)
    if (!hasLiveContext) {
      const cached = findCachedAnswer(message);
      if (cached.hit && cached.answer) {
        return NextResponse.json({
          reply: cached.answer,
          source: "cache",
          matchedQuestion: cached.question,
          category: cached.category,
          confidence: cached.confidence,
        });
      }
    }

    // Fallback to LLM
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "I can answer common questions about TalentFlow from my built-in knowledge, but the AI backend isn't configured for custom questions right now. Try asking about: pipeline, scoring, n8n, NocoDB, ElevenLabs, models, or troubleshooting.",
        source: "fallback",
        confidence: 0,
      });
    }

    const chatHistory = Array.isArray(history)
      ? history
          .filter((entry) => entry && typeof entry.content === "string" && (entry.role === "user" || entry.role === "assistant"))
          .slice(-12)
          .map((entry) => ({ role: entry.role as "user" | "assistant", content: String(entry.content) }))
      : [];

    const contextualSystemPrompt = `${SYSTEM_PROMPT}\n\nCurrent route: ${typeof route === "string" ? route : "unknown"}.\nLive app context: ${hasLiveContext ? String(contextSummary) : "not provided"}.\n\nWhen live context is provided, prioritize concrete next-step guidance and troubleshooting specific to that context.`;

    const reply = await callOpenRouter(
      [
        { role: "system", content: contextualSystemPrompt },
        ...chatHistory,
        { role: "user", content: message },
      ],
      "auto"
    );

    return NextResponse.json({
      reply: reply || "Sorry, I couldn't generate a response.",
      source: "llm",
      confidence: 0,
    });
  } catch (error) {
    console.error("Guide chat error:", error);
    return NextResponse.json({
      reply: "Sorry, I ran into an error. Try asking a common question like 'How do I get started?' or 'What does n8n do?'",
      source: "error",
      confidence: 0,
    }, { status: 500 });
  }
}
