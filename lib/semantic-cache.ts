/**
 * Semantic Cache for TalentFlow Guide Chatbot
 * 
 * Predetermined Q&A pairs matched via keyword/phrase similarity.
 * Falls back to LLM only when no cached answer scores above threshold.
 * This reduces OpenRouter API usage significantly for common questions.
 */

export interface CachedQA {
  keywords: string[];        // tokens for matching
  question: string;          // canonical phrasing
  answer: string;            // predetermined response
  category: string;          // for display grouping
}

export const CACHED_RESPONSES: CachedQA[] = [
  // ─── Getting Started ───
  {
    keywords: ["how", "start", "begin", "use", "get started", "quick start"],
    question: "How do I get started?",
    answer: "Head to the **Pipeline** page, paste a job description (or pick a template), then upload a resume. The AI will parse, score, and generate screening questions automatically. The whole process takes under 30 seconds.",
    category: "Getting Started",
  },
  {
    keywords: ["what", "talentflow", "about", "overview", "purpose"],
    question: "What is TalentFlow AI?",
    answer: "TalentFlow AI is an autonomous recruiting pipeline. It parses resumes, scores candidates against job descriptions across 6 dimensions, generates tailored screening questions, and orchestrates outreach via n8n workflows — all powered by free-tier LLMs through OpenRouter.",
    category: "Getting Started",
  },
  {
    keywords: ["free", "cost", "pricing", "pay", "money", "charge"],
    question: "Is TalentFlow free?",
    answer: "TalentFlow uses **free-tier models** from OpenRouter by default (Gemma, LLaMA, DeepSeek, Qwen, etc.). The only paid fallback is GPT-4o-mini at $0.15/1M tokens. Voice AI uses Kokoro-82M, self-hosted on the T480 server — completely free with unlimited usage. NocoDB and n8n Community are also free and self-hosted.",
    category: "Getting Started",
  },

  // ─── Pipeline ───
  {
    keywords: ["resume", "upload", "parse", "pdf", "format", "file"],
    question: "What resume formats are supported?",
    answer: "PDF and plain text (TXT/pasted). Upload a file via drag-and-drop or use the file picker. The AI extracts: contact info, skills, experience entries, education, and certifications into structured JSON.",
    category: "Pipeline",
  },
  {
    keywords: ["score", "scoring", "fit", "dimensions", "how scored", "rating"],
    question: "How does candidate scoring work?",
    answer: "Candidates are scored on **6 dimensions**: Skills Match, Experience Relevance, Education Fit, Technical Depth, Communication, and Cultural Fit. Each gets a 0-100 score with explanations. The overall score is a weighted average. A recommendation (Strong Match, Good Fit, Potential, or Not Recommended) is generated based on the total.",
    category: "Pipeline",
  },
  {
    keywords: ["question", "screening", "interview", "generate questions"],
    question: "How are screening questions generated?",
    answer: "AI generates 8 tailored questions based on the candidate's specific strengths and gaps found during scoring. Questions span Easy, Medium, and Hard difficulty. Each includes the ideal answer and what to look for.",
    category: "Pipeline",
  },
  {
    keywords: ["model", "auto", "smart", "select model", "which model", "llm"],
    question: "What does 'Auto (Smart)' model do?",
    answer: "Auto (Smart) picks the first available free model that isn't rate-limited. The cascade order: Gemma 3 27B -> GPT-4o-mini -> Mistral Small -> LLaMA 3.3 70B -> DeepSeek R1 -> Qwen3 32B -> Phi-4 Reasoning -> DeepHermes 3. If one fails, it instantly tries the next.",
    category: "Pipeline",
  },
  {
    keywords: ["rate limit", "limited", "429", "too many", "cooldown"],
    question: "Why is a model showing as rate-limited?",
    answer: "Free models have usage caps. When a model returns a 429 error, TalentFlow marks it as rate-limited for 5 minutes and automatically switches to the next model. Rate-limited models show as greyed-out in the dropdown. Use 'Auto (Smart)' to handle this seamlessly.",
    category: "Pipeline",
  },
  {
    keywords: ["template", "job description", "jd", "preset"],
    question: "Can I use pre-built job descriptions?",
    answer: "Yes — the pipeline includes templates for common roles like Full-Stack Engineer, Data Scientist, Product Manager, and DevOps Engineer. Click a template to auto-fill the job description, then customize as needed.",
    category: "Pipeline",
  },

  // ─── Integrations ───
  {
    keywords: ["n8n", "workflow", "automation", "orchestration"],
    question: "What does n8n do in TalentFlow?",
    answer: "n8n is the orchestration layer with 5 workflows:\n- **WF1 Candidate Intake**: Routes candidates by score to appropriate actions\n- **WF2 Smart Outreach**: Generates personalized emails + voice messages\n- **WF3 Data Sync**: Pushes records to NocoDB CRM\n- **WF4 Health Monitor**: Checks system health every 5 minutes\n- **WF5 Pipeline Report**: Generates weekly analytics\n\nAccess the dashboard at n8n.elunari.uk.",
    category: "Integrations",
  },
  {
    keywords: ["nocodb", "crm", "database", "records", "sync", "airtable"],
    question: "How does NocoDB integration work?",
    answer: "After scoring, TalentFlow pushes a flat record to NocoDB containing: candidate name, email, skills, experience summary, overall score, recommendation, and processing date. The record lands in the 'Candidates' table via the NocoDB REST API v2. View your data at db.elunari.uk.",
    category: "Integrations",
  },
  {
    keywords: ["kokoro", "voice", "audio", "tts", "speech", "elevenlabs"],
    question: "How does Kokoro voice integration work?",
    answer: "WF2 (Smart Outreach) generates a personalized voice message using Kokoro-82M, a self-hosted TTS model running on the T480 server. The script is written to sound natural and human — no AI buzzwords, varied sentence lengths, casual linking phrases. It's completely free with unlimited usage, accessible at tts.elunari.uk.",
    category: "Integrations",
  },
  {
    keywords: ["openrouter", "api", "model", "llm", "ai provider"],
    question: "What is OpenRouter?",
    answer: "OpenRouter is an API gateway that provides access to 200+ LLMs through a single endpoint. TalentFlow uses it to access free-tier models (Gemma, LLaMA, Mistral, DeepSeek, Qwen, Phi-4) with automatic fallback to GPT-4o-mini when free models are rate-limited.",
    category: "Integrations",
  },

  // ─── Architecture ───
  {
    keywords: ["architecture", "diagram", "how built", "tech stack", "stack"],
    question: "What's the tech stack?",
    answer: "**Frontend**: Next.js 16 (App Router), React 19, Tailwind 4, Framer Motion\n**AI**: OpenRouter (8-model cascade), Kokoro-82M (TTS, self-hosted)\n**Orchestration**: n8n (5 workflows)\n**Data**: NocoDB (CRM), localStorage (session)\n**Deployment**: Vercel (frontend), T480 server (n8n + NocoDB + Kokoro via Cloudflare Tunnel)\n\nSee the Architecture Diagram on the Guide page for a visual overview.",
    category: "Architecture",
  },
  {
    keywords: ["api", "routes", "endpoint", "backend"],
    question: "What API routes are available?",
    answer: "TalentFlow has 12 API routes:\n- `/api/parse-resume` — Extract structured data from resume\n- `/api/score-candidate` — 6-axis scoring\n- `/api/generate-questions` — Tailored screening questions\n- `/api/apply` — Candidate self-service submission\n- `/api/n8n/sync` — Push to NocoDB via n8n\n- `/api/n8n/outreach` — Email + voice generation\n- `/api/n8n/status` — Check n8n workflows\n- `/api/n8n/report` — Pipeline analytics\n- `/api/airtable` — Direct NocoDB operations\n- `/api/elevenlabs/tts` — Text-to-speech (Kokoro)\n- `/api/models/status` — Rate-limited model status\n- `/api/health` — System health check",
    category: "Architecture",
  },

  // ─── Troubleshooting ───
  {
    keywords: ["error", "fail", "not working", "broken", "issue", "bug"],
    question: "Something isn't working. What should I check?",
    answer: "1. **Check the Automations page** — all 4 integration cards should show 'Connected'\n2. **Check n8n** at n8n.elunari.uk — all workflows should be Active (green)\n3. **Check rate limits** — free models may be temporarily limited; use 'Auto (Smart)'\n4. **Check .env.local** — ensure all API keys are set\n5. **Check the Health endpoint** at /api/health for detailed diagnostics",
    category: "Troubleshooting",
  },
  {
    keywords: ["n8n not connecting", "n8n down", "workflow error", "n8n error"],
    question: "n8n is not connecting?",
    answer: "n8n runs on the server laptop (native Windows, not Docker). Check that the server is on and cloudflared tunnel is active.\n\nVerify N8N_URL in .env.local is set to `https://n8n.elunari.uk`. The n8n API key must also be set in N8N_API_KEY. If the server laptop is off, start it and the Scheduled Tasks will auto-launch n8n + cloudflared.",
    category: "Troubleshooting",
  },
  {
    keywords: ["apply", "candidate", "form", "submit", "application"],
    question: "How does the candidate apply page work?",
    answer: "Share `/apply` with candidates. They fill in name, email, phone, position, resume, and optional cover note. On submit, the data goes to:\n1. **NocoDB** — creates a new Candidates record\n2. **n8n WF1** — triggers the intake workflow\n\nCandidates see a success confirmation with their reference details.",
    category: "Features",
  },
  {
    keywords: ["export", "pdf", "report", "download", "print"],
    question: "Can I export candidate reports?",
    answer: "Yes — after completing the pipeline, click the **Export PDF** button in the summary section. It generates a formatted report with all scores, recommendations, and screening questions. You can also print directly from the browser.",
    category: "Features",
  },
  {
    keywords: ["ethics", "ethical", "eval", "evaluation", "bias", "fairness", "safety"],
    question: "How does AI ethics evaluation work?",
    answer: "TalentFlow includes a built-in **AI Ethics Evaluation Suite** with 14 automated tests across 6 categories: Fairness (gender-neutral scoring, name-blind consistency, age neutrality), Safety (PII protection, anti-discrimination, hallucination detection), Quality (JSON format, scoring completeness), Transparency (decision reasoning, confidence disclosure), Inclusivity (accessible language, cultural sensitivity), and Performance (latency, repeat consistency). Run it from the `/eval` dashboard and export print-ready reports.",
    category: "Features",
  },
  {
    keywords: ["monitor", "monitoring", "performance", "health", "metrics", "track"],
    question: "How is AI performance monitored?",
    answer: "TalentFlow tracks: total requests, error rates, average latency, tokens used, and model-specific metrics. The `/api/health` endpoint provides real-time diagnostics. n8n WF4 runs health checks every 5 minutes. The AI Ethics dashboard (`/eval`) runs 12 tests to grade the AI on fairness, safety, quality, transparency, and inclusivity.",
    category: "Features",
  },
];

/* ─── Matching engine ─── */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function computeScore(query: string, entry: CachedQA): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;

  let score = 0;
  const queryLower = query.toLowerCase();

  // Exact phrase matching (highest weight)
  for (const kw of entry.keywords) {
    if (queryLower.includes(kw.toLowerCase())) {
      score += kw.split(/\s+/).length * 3; // multi-word phrases score higher
    }
  }

  // Token overlap with keywords
  for (const qt of queryTokens) {
    for (const kw of entry.keywords) {
      const kwTokens = kw.toLowerCase().split(/\s+/);
      for (const kwt of kwTokens) {
        if (qt === kwt) score += 2;
        else if (kwt.startsWith(qt) || qt.startsWith(kwt)) score += 1;
      }
    }
  }

  // Token overlap with canonical question
  const qTokens = tokenize(entry.question);
  for (const qt of queryTokens) {
    if (qTokens.includes(qt)) score += 1;
  }

  // Normalize by query length to avoid bias toward long queries
  return score / Math.max(queryTokens.length, 1);
}

export interface CacheResult {
  hit: boolean;
  answer?: string;
  question?: string;
  category?: string;
  confidence: number;
}

const CACHE_THRESHOLD = 2.0; // minimum normalized score to count as a cache hit

export function findCachedAnswer(query: string): CacheResult {
  if (!query.trim()) return { hit: false, confidence: 0 };

  let bestScore = 0;
  let bestEntry: CachedQA | null = null;

  for (const entry of CACHED_RESPONSES) {
    const score = computeScore(query, entry);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= CACHE_THRESHOLD) {
    return {
      hit: true,
      answer: bestEntry.answer,
      question: bestEntry.question,
      category: bestEntry.category,
      confidence: Math.min(bestScore / 5, 1), // normalize to 0-1
    };
  }

  return { hit: false, confidence: bestScore / 5 };
}

/** Get all cached Q&A grouped by category */
export function getCachedByCategory(): Record<string, CachedQA[]> {
  const grouped: Record<string, CachedQA[]> = {};
  for (const entry of CACHED_RESPONSES) {
    if (!grouped[entry.category]) grouped[entry.category] = [];
    grouped[entry.category].push(entry);
  }
  return grouped;
}
