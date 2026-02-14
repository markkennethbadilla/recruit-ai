/**
 * Kokoro-82M Text-to-Speech Integration (Self-Hosted, Free)
 * Generates realistic AI voice audio for candidate outreach
 * Used by WF2 (Smart Outreach) to create personalized voice messages
 * 
 * Runs on T480 server via Kokoro-FastAPI container (OpenAI-compatible API)
 * Exposed through Cloudflare tunnel at tts.elunari.uk
 */

const KOKORO_TTS_URL = process.env.KOKORO_TTS_URL || "https://tts.elunari.uk";

// Default voice: "af_heart" - warm, professional female voice
// Good for recruitment outreach. 67 voices available.
const DEFAULT_VOICE = "af_heart";
const DEFAULT_MODEL = "kokoro";

export interface TTSOptions {
  voice?: string;
  model?: string;
  speed?: number;
  responseFormat?: "mp3" | "wav" | "opus" | "flac";
}

export interface TTSResult {
  success: boolean;
  audioBase64?: string;
  audioUrl?: string;
  contentType?: string;
  characterCount?: number;
  error?: string;
}

export interface VoiceInfo {
  voice_id: string;
  name: string;
  category: string;
  labels: Record<string, string>;
}

/**
 * Convert text to speech using Kokoro-82M (OpenAI-compatible API)
 * Returns base64-encoded audio data
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  const voice = options.voice || DEFAULT_VOICE;
  const model = options.model || DEFAULT_MODEL;
  const responseFormat = options.responseFormat || "mp3";

  try {
    const response = await fetch(`${KOKORO_TTS_URL}/v1/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        input: text,
        voice,
        response_format: responseFormat,
        speed: options.speed ?? 1.0,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        error: `Kokoro TTS error ${response.status}: ${errorBody}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const contentTypeMap: Record<string, string> = {
      mp3: "audio/mpeg",
      wav: "audio/wav",
      opus: "audio/opus",
      flac: "audio/flac",
    };

    return {
      success: true,
      audioBase64: base64,
      contentType: contentTypeMap[responseFormat] || "audio/mpeg",
      characterCount: text.length,
    };
  } catch (error) {
    return {
      success: false,
      error: `Kokoro TTS failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Generate a personalized outreach voice message for a candidate
 * Creates a professional recruitment script and converts to audio
 */
export async function generateOutreachAudio(
  candidateName: string,
  jobTitle: string,
  score: number,
  recommendation: string,
  options: TTSOptions = {}
): Promise<TTSResult & { script: string }> {
  const script = buildOutreachScript(candidateName, jobTitle, score, recommendation);
  const result = await textToSpeech(script, options);
  return { ...result, script };
}

/**
 * Build a natural outreach script for voice synthesis
 * Anti-AI rules: no em-dashes, no "seamless/robust/transformative",
 * mix short + long sentences, sound like a real recruiter talking
 */
function buildOutreachScript(
  candidateName: string,
  jobTitle: string,
  score: number,
  recommendation: string
): string {
  const firstName = candidateName.split(" ")[0];
  const scoreLabel =
    score >= 80 ? "really strong" : score >= 60 ? "solid" : "interesting";

  return (
    `Hey ${firstName}, quick message from the TalentFlow team. ` +
    `So we took a look at your background for the ${jobTitle} role, and honestly? You scored a ${score} out of 100, which is a ${scoreLabel} result. ` +
    `A few things stood out to us: ${recommendation}. ` +
    `We'd love to hop on a quick call to talk next steps. ` +
    `Check your email when you get a chance, or just reply here and we'll get something on the calendar. ` +
    `Looking forward to connecting, ${firstName}. Talk soon.`
  );
}

/**
 * List available voices from Kokoro
 * Returns in ElevenLabs-compatible format for backwards compatibility
 */
export async function listVoices(): Promise<VoiceInfo[]> {
  try {
    const response = await fetch(`${KOKORO_TTS_URL}/v1/audio/voices`);
    if (!response.ok) return [];

    const data = await response.json();
    const voices: string[] = data.voices || [];

    // Map voice IDs to human-readable info
    const categoryMap: Record<string, string> = {
      af_: "American Female",
      am_: "American Male",
      bf_: "British Female",
      bm_: "British Male",
      ef_: "European Female",
      em_: "European Male",
      ff_: "French Female",
      hf_: "Hindi Female",
      hm_: "Hindi Male",
      if_: "Italian Female",
      im_: "Italian Male",
      jf_: "Japanese Female",
      jm_: "Japanese Male",
      pf_: "Portuguese Female",
      pm_: "Portuguese Male",
      zf_: "Chinese Female",
      zm_: "Chinese Male",
    };

    return voices.map((v) => {
      const prefix = v.substring(0, 3);
      const category = categoryMap[prefix] || "Other";
      const name = v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

      return {
        voice_id: v,
        name,
        category,
        labels: { accent: category, age: "adult" },
      };
    });
  } catch {
    return [];
  }
}

/**
 * Get Kokoro TTS service status (no usage limits since self-hosted)
 */
export async function getUsageInfo(): Promise<{
  character_count: number;
  character_limit: number;
  can_use: boolean;
}> {
  try {
    const response = await fetch(`${KOKORO_TTS_URL}/health`);
    const healthy = response.ok;

    return {
      character_count: 0,
      character_limit: 999999, // unlimited (self-hosted)
      can_use: healthy,
    };
  } catch {
    return { character_count: 0, character_limit: 0, can_use: false };
  }
}

/**
 * Check if Kokoro TTS service is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${KOKORO_TTS_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}
