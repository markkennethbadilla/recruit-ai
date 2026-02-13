/**
 * ElevenLabs Text-to-Speech Integration
 * Generates realistic AI voice audio for candidate outreach
 * Used by WF2 (Smart Outreach) to create personalized voice messages
 */

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "";
const ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1";

// Default voice: "Rachel" - professional, warm female voice
// Good for recruitment outreach. Can be changed to any ElevenLabs voice ID.
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel
const DEFAULT_MODEL_ID = "eleven_multilingual_v2";

export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  outputFormat?: "mp3_44100_128" | "mp3_22050_32" | "pcm_16000" | "pcm_22050";
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
 * Convert text to speech using ElevenLabs API
 * Returns base64-encoded audio data
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<TTSResult> {
  if (!ELEVENLABS_API_KEY) {
    return {
      success: false,
      error: "ELEVENLABS_API_KEY not configured",
    };
  }

  const voiceId = options.voiceId || DEFAULT_VOICE_ID;
  const modelId = options.modelId || DEFAULT_MODEL_ID;
  const outputFormat = options.outputFormat || "mp3_44100_128";

  try {
    const response = await fetch(
      `${ELEVENLABS_BASE_URL}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: modelId,
          voice_settings: {
            stability: options.stability ?? 0.5,
            similarity_boost: options.similarityBoost ?? 0.75,
            style: options.style ?? 0.0,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      return {
        success: false,
        error: `ElevenLabs API error ${response.status}: ${errorBody}`,
      };
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      success: true,
      audioBase64: base64,
      contentType: "audio/mpeg",
      characterCount: text.length,
    };
  } catch (error) {
    return {
      success: false,
      error: `ElevenLabs TTS failed: ${error instanceof Error ? error.message : String(error)}`,
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
  // Generate a natural, professional outreach script
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

  return `Hey ${firstName}, quick message from the TalentFlow team. ` +
    `So we took a look at your background for the ${jobTitle} role, and honestly? You scored a ${score} out of 100, which is a ${scoreLabel} result. ` +
    `A few things stood out to us: ${recommendation}. ` +
    `We'd love to hop on a quick call to talk next steps. ` +
    `Check your email when you get a chance, or just reply here and we'll get something on the calendar. ` +
    `Looking forward to connecting, ${firstName}. Talk soon.`;
}

/**
 * List available voices from ElevenLabs
 */
export async function listVoices(): Promise<VoiceInfo[]> {
  if (!ELEVENLABS_API_KEY) return [];

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.voices || []).map((v: VoiceInfo) => ({
      voice_id: v.voice_id,
      name: v.name,
      category: v.category,
      labels: v.labels,
    }));
  } catch {
    return [];
  }
}

/**
 * Get current ElevenLabs subscription/usage info
 */
export async function getUsageInfo(): Promise<{
  character_count: number;
  character_limit: number;
  can_use: boolean;
}> {
  if (!ELEVENLABS_API_KEY) {
    return { character_count: 0, character_limit: 0, can_use: false };
  }

  try {
    const response = await fetch(`${ELEVENLABS_BASE_URL}/user/subscription`, {
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    });

    if (!response.ok) {
      return { character_count: 0, character_limit: 0, can_use: false };
    }

    const data = await response.json();
    return {
      character_count: data.character_count || 0,
      character_limit: data.character_limit || 0,
      can_use: (data.character_count || 0) < (data.character_limit || 0),
    };
  } catch {
    return { character_count: 0, character_limit: 0, can_use: false };
  }
}
