import { NextRequest, NextResponse } from "next/server";
import {
  textToSpeech,
  generateOutreachAudio,
  listVoices,
  getUsageInfo,
} from "@/lib/kokoro";

/**
 * GET /api/elevenlabs/tts — Get Kokoro TTS status, voices, and usage
 * (route path kept for backwards compatibility)
 */
export async function GET() {
  try {
    const [voices, usage] = await Promise.all([listVoices(), getUsageInfo()]);

    return NextResponse.json({
      success: true,
      connected: voices.length > 0 || usage.can_use,
      usage: {
        characters_used: usage.character_count,
        characters_limit: usage.character_limit,
        characters_remaining: usage.character_limit - usage.character_count,
        can_generate: usage.can_use,
      },
      voices: voices.slice(0, 10).map((v) => ({
        id: v.voice_id,
        name: v.name,
        category: v.category,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to reach Kokoro TTS",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/elevenlabs/tts — Generate TTS audio (Kokoro)
 * Body options:
 *   { text: string } — raw text-to-speech
 *   { candidateName, jobTitle, score, recommendation } — outreach voice message
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // If candidate fields provided, generate full outreach audio
    if (body.candidateName && body.jobTitle) {
      const result = await generateOutreachAudio(
        body.candidateName,
        body.jobTitle,
        body.score || 0,
        body.recommendation || "Strong candidate",
        {
          voice: body.voice || body.voiceId,
          model: body.model || body.modelId,
          speed: body.speed,
        }
      );

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        script: result.script,
        audio: {
          base64: result.audioBase64,
          contentType: result.contentType,
          characterCount: result.characterCount,
        },
      });
    }

    // Raw text-to-speech
    if (body.text) {
      const result = await textToSpeech(body.text, {
        voice: body.voice || body.voiceId,
        model: body.model || body.modelId,
        speed: body.speed,
      });

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        audio: {
          base64: result.audioBase64,
          contentType: result.contentType,
          characterCount: result.characterCount,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Provide either { text } for raw TTS, or { candidateName, jobTitle, score, recommendation } for outreach audio",
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Kokoro TTS generation failed",
      },
      { status: 500 }
    );
  }
}
