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

const FALLBACK_MODEL = "openai/gpt-4o";

function isRateLimitError(status: number, errorText: string): boolean {
  return status === 429 || errorText.toLowerCase().includes("rate limit") || errorText.toLowerCase().includes("quota exceeded");
}

export async function callOpenRouter(
  messages: OpenRouterMessage[],
  model: string = "google/gemini-2.0-flash-001",
  temperature: number = 0.3
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  // Try requested model first
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://recruit-ai.vercel.app",
      "X-Title": "TalentFlow AI",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    
    // If rate limited and not already using fallback, try paid model
    if (isRateLimitError(response.status, error) && model !== FALLBACK_MODEL) {
      console.log(`Rate limit hit on ${model}, falling back to ${FALLBACK_MODEL}`);
      
      const fallbackResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://recruit-ai.vercel.app",
          "X-Title": "TalentFlow AI",
        },
        body: JSON.stringify({
          model: FALLBACK_MODEL,
          messages,
          temperature,
          max_tokens: 4000,
        }),
      });

      if (!fallbackResponse.ok) {
        const fallbackError = await fallbackResponse.text();
        throw new Error(`Fallback model also failed: ${fallbackResponse.status} - ${fallbackError}`);
      }

      const fallbackData = (await fallbackResponse.json()) as OpenRouterResponse;
      return fallbackData.choices[0]?.message?.content || "";
    }
    
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as OpenRouterResponse;
  return data.choices[0]?.message?.content || "";
}
