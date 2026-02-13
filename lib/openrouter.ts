export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

// Free model cascade — different providers to avoid per-provider rate limits
// GPT-4o-mini is cheap ($0.15/1M) and reliable as fast fallback
const FREE_FALLBACKS = [
  "google/gemma-3-27b-it:free",
  "openai/gpt-4o-mini",  // cheap paid fallback — always available
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "deepseek/deepseek-r1-0528:free",
  "qwen/qwen3-32b:free",
  "microsoft/phi-4-reasoning-plus:free",
  "nousresearch/deephermes-3-llama-3-8b-preview:free",
];

// Track rate-limited models with expiry timestamps (5-minute cooldown)
const RATE_LIMITED_MODELS = new Map<string, number>();
const RATE_LIMIT_COOLDOWN_MS = 5 * 60 * 1000; // 5 min

function markRateLimited(model: string): void {
  RATE_LIMITED_MODELS.set(model, Date.now() + RATE_LIMIT_COOLDOWN_MS);
}

function isModelRateLimited(model: string): boolean {
  const expiry = RATE_LIMITED_MODELS.get(model);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    RATE_LIMITED_MODELS.delete(model);
    return false;
  }
  return true;
}

/** Return list of currently rate-limited model IDs (for UI display) */
export function getRateLimitedModels(): string[] {
  const now = Date.now();
  const result: string[] = [];
  for (const [model, expiry] of RATE_LIMITED_MODELS) {
    if (now < expiry) result.push(model);
    else RATE_LIMITED_MODELS.delete(model);
  }
  return result;
}

function isRetryableError(status: number, errorText: string): boolean {
  const lower = errorText.toLowerCase();
  return status === 429 || status === 402 || status === 503 || status === 400 ||
    lower.includes("rate limit") ||
    lower.includes("quota exceeded") ||
    lower.includes("spend limit") ||
    lower.includes("overloaded") ||
    lower.includes("provider returned error") ||
    lower.includes("not enabled");
}

/** Parse a raw API error into a clean, human-readable message */
function friendlyError(rawError: string, status: number): string {
  const lower = rawError.toLowerCase();
  if (status === 429 || lower.includes("rate limit"))
    return "AI model is temporarily busy (rate limited). The system will automatically try alternative models.";
  if (status === 402 || lower.includes("spend limit") || lower.includes("quota exceeded"))
    return "Model usage quota reached. Switching to a free alternative automatically.";
  if (lower.includes("overloaded") || status === 503)
    return "AI provider is overloaded right now. Trying backup models...";
  if (lower.includes("not enabled") || lower.includes("developer instruction"))
    return "This model doesn't support the required features. Falling back to a compatible model.";
  if (status === 400)
    return "Request format issue with this model. Trying an alternative...";
  if (status === 0)
    return "Could not reach the AI service. Check your internet connection and try again.";
  return `AI service error (${status}). The system tried all available models but none responded.`;
}

async function tryModel(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[],
  temperature: number,
): Promise<{ ok: true; content: string; model: string } | { ok: false; error: string; status: number }> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://recruit-ai.vercel.app",
        "X-Title": "TalentFlow AI",
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: 4000 }),
    });

    if (!res.ok) {
      const error = await res.text();
      return { ok: false, error, status: res.status };
    }

    const data = (await res.json()) as OpenRouterResponse;
    const content = data.choices[0]?.message?.content || "";
    if (!content) return { ok: false, error: "Empty response", status: 200 };
    return { ok: true, content, model };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error", status: 0 };
  }
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  model: string = "meta-llama/llama-3.3-70b-instruct:free",
  temperature: number = 0.3
): Promise<string> {
  const { recordAIRequest } = await import("@/lib/ai-monitor");
  const startTime = Date.now();
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OpenRouter API key is not configured. Add OPENROUTER_API_KEY to your environment.");

  // "auto" — skip directly to cascade through all free models
  const isAuto = model === "auto";
  
  // Skip if the requested model is known to be rate-limited
  let result: { ok: false; error: string; status: number } | null = null;
  if (!isAuto && !isModelRateLimited(model)) {
    const r = await tryModel(apiKey, model, messages, temperature);
    if (r.ok) {
      recordAIRequest(model, Date.now() - startTime, true, undefined, r.content.length);
      return r.content;
    }
    result = r;
    if (isRetryableError(r.status, r.error)) {
      markRateLimited(model);
    }
  } else if (!isAuto) {
    console.log(`[OpenRouter] ${model} is rate-limited, skipping to fallbacks...`);
    result = { ok: false, error: "rate limited (cached)", status: 429 };
  }

  // Cascade through fallbacks
  if (!result || isRetryableError(result.status, result.error)) {
    console.log(`[OpenRouter] ${model} failed (${result?.status || "cached"}), trying fallbacks...`);

    for (const fallback of FREE_FALLBACKS) {
      if (fallback === model) continue;
      if (isModelRateLimited(fallback)) {
        console.log(`[OpenRouter] ${fallback} is rate-limited, skipping...`);
        continue;
      }

      console.log(`[OpenRouter] Trying fallback: ${fallback}`);
      await new Promise(r => setTimeout(r, 300));
      const fbResult = await tryModel(apiKey, fallback, messages, temperature);
      if (fbResult.ok) {
        console.log(`[OpenRouter] Success with fallback: ${fallback}`);
        recordAIRequest(fallback, Date.now() - startTime, true, undefined, fbResult.content.length);
        return fbResult.content;
      }
      console.log(`[OpenRouter] ${fallback} also failed (${fbResult.status})`);
      if (isRetryableError(fbResult.status, fbResult.error)) {
        markRateLimited(fallback);
      }
    }
  }

  // All failed — throw a FRIENDLY error
  const { recordAIRequest: record } = await import("@/lib/ai-monitor");
  record(model, Date.now() - startTime, false, result?.error);
  throw new Error(friendlyError(result?.error || "Unknown error", result?.status || 500));
}
