"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Zap,
  Database,
  Mic,
  Globe,
  Send,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Sparkles,
  MessageCircle,
  Cpu,
  Layers,
  Shield,
  BarChart3,
  Sun,
  Moon,
  Lightbulb,
  Bot,
  User,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { useTips, TipsToggle, PageTips, usePageTips } from "@/lib/tips";
import dynamic from "next/dynamic";
import { getCachedByCategory, type CachedQA } from "@/lib/semantic-cache";

const ArchitectureFlow = dynamic(
  () => import("@/components/ArchitectureFlow"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] rounded-xl bg-[var(--bg-card)] animate-pulse flex items-center justify-center text-[var(--text-muted)]">
        Loading architecture diagram…
      </div>
    ),
  }
);

/* ─── External service links ─── */
const SERVICE_LINKS = [
  {
    name: "n8n Dashboard",
    url: "https://n8n.elunari.uk",
    icon: Zap,
    color: "from-emerald-500 to-teal-500",
    description: "Workflow orchestration — view, edit, and toggle all 5 workflows",
    status: "n8n.elunari.uk",
  },
  {
    name: "NocoDB",
    url: "https://db.elunari.uk",
    icon: Database,
    color: "from-blue-500 to-cyan-500",
    description: "CRM database — 'Candidates' table with all synced records",
    status: "db.elunari.uk",
  },
  {
    name: "Kokoro TTS",
    url: "https://tts.elunari.uk/health",
    icon: Mic,
    color: "from-purple-500 to-pink-500",
    description: "Voice AI — Kokoro-82M self-hosted TTS for outreach messages",
    status: "tts.elunari.uk",
  },
  {
    name: "OpenRouter",
    url: "https://openrouter.ai/models",
    icon: Globe,
    color: "from-amber-500 to-orange-500",
    description: "LLM Gateway — 8-model cascade with rate-limit detection",
    status: "Cloud",
  },
];

/* ─── Documentation sections ─── */
const DOC_SECTIONS = [
  {
    id: "overview",
    title: "Platform Overview",
    icon: Layers,
    content: `TalentFlow AI is an **autonomous recruiting pipeline** that processes candidates end-to-end:

1. **Upload** a resume (PDF or text)
2. **Parse** it into structured data using AI
3. **Score** the candidate across 6 dimensions against a job description
4. **Generate** tailored screening questions
5. **Orchestrate** outreach, CRM sync, and reporting via n8n

The entire pipeline runs in under 30 seconds using free-tier LLMs.`,
  },
  {
    id: "pipeline",
    title: "Pipeline Workflow",
    icon: Brain,
    content: `### Step-by-Step

**Step 1 — Job Description**
Paste a JD or select from built-in templates (Full-Stack Engineer, Data Scientist, Product Manager, DevOps Engineer). The more detail, the better the scoring.

**Step 2 — Resume Upload**
Drag-and-drop a PDF or paste text. AI extracts: name, email, phone, skills, experience, education, certifications.

**Step 3 — Scoring**
6-axis assessment: Skills Match, Experience Relevance, Education Fit, Technical Depth, Communication, Cultural Fit. Each dimension gets a 0-100 score with written reasoning.

**Step 4 — Screening Questions**
8 tailored questions (Easy/Medium/Hard) targeting the candidate's specific strengths and gaps. Each includes the ideal answer.

**Step 5 — Summary & Integrations**
Final summary with recommendation. Results are pushed to NocoDB (CRM), n8n triggers outreach, and a Kokoro voice message is generated.`,
  },
  {
    id: "models",
    title: "AI Models & Cascade",
    icon: Cpu,
    content: `### Model Cascade (in order)

| # | Model | Provider | Type |
|---|-------|----------|------|
| 1 | Gemma 3 27B | Google | Free |
| 2 | GPT-4o-mini | OpenAI | Paid ($0.15/1M) |
| 3 | Mistral Small 3.1 24B | Mistral | Free |
| 4 | LLaMA 3.3 70B | Meta | Free |
| 5 | DeepSeek R1 | DeepSeek | Free |
| 6 | Qwen3 32B | Alibaba | Free |
| 7 | Phi-4 Reasoning Plus | Microsoft | Free |
| 8 | DeepHermes 3 8B | NousResearch | Free |

### How "Auto (Smart)" Works
1. Checks the first model in the list
2. If rate-limited (429 error in last 5 min), skips to next
3. First available model is used
4. If ALL free models are limited, falls back to GPT-4o-mini

Rate limits refresh automatically after 5 minutes. The status indicator in the pipeline dropdown shows which models are available.`,
  },
  {
    id: "n8n",
    title: "n8n Workflows",
    icon: Zap,
    content: `### 5 Independent Workflows

**WF1 — Candidate Intake**
Trigger: New candidate scored. Routes by recommendation level. Builds Slack/email notifications.

**WF2 — Smart Outreach**  
Trigger: Manual test or pipeline completion. Generates personalized email + Kokoro voice message. Anti-AI writing rules ensure human-sounding output.

**WF3 — Data Sync**
Trigger: Pipeline completion. Pushes flat candidate record to NocoDB with all scores, skills, and recommendation.

**WF4 — Health Monitor**
Trigger: Cron (every 5 minutes). Checks /api/health endpoint. Alerts on failures.

**WF5 — Pipeline Report**
Trigger: Weekly cron. Aggregates: total processed, top skills, average scores, gap analysis.

### Accessing n8n
- Dashboard: [https://n8n.elunari.uk](https://n8n.elunari.uk)
- n8n runs on the server laptop (native Windows)
- Workflows can be toggled on/off individually`,
  },
  {
    id: "integrations",
    title: "External Integrations",
    icon: Shield,
    content: `### NocoDB CRM
- **Table**: Candidates table
- **Fields**: Name, Email, Phone, Skills, Experience, Score, Recommendation, Position, Processing Date
- **Sync**: Automatic via WF3 or /api/n8n/sync
- **Typecast**: Enabled — auto-creates select options for Recommendation field

### Kokoro Voice AI (Self-Hosted)
- **Model**: Kokoro-82M
- **Voice**: af_heart (warm, professional female)
- **Server**: T480 via Cloudflare Tunnel (tts.elunari.uk)
- **Cost**: Free (self-hosted, unlimited)
- **Script**: Anti-AI optimized — natural cadence, no buzzwords, varied sentence lengths

### OpenRouter LLM Gateway
- **Endpoint**: https://openrouter.ai/api/v1/chat/completions
- **Auth**: Bearer token in OPENROUTER_API_KEY
- **Feature**: 8-model cascade with automatic rate-limit detection and 5-minute cooldown`,
  },
  {
    id: "api",
    title: "API Reference",
    icon: BarChart3,
    content: `### Endpoints

| Route | Method | Description |
|-------|--------|-------------|
| \`/api/parse-resume\` | POST | Parse PDF/text resume into structured JSON |
| \`/api/score-candidate\` | POST | 6-axis scoring against job description |
| \`/api/generate-questions\` | POST | Generate 8 screening questions |
| \`/api/apply\` | POST | Candidate self-service submission |
| \`/api/n8n/sync\` | POST | Push record to NocoDB via n8n |
| \`/api/n8n/outreach\` | POST | Generate email + voice outreach |
| \`/api/n8n/status\` | GET | Check n8n workflow status |
| \`/api/n8n/report\` | POST | Generate pipeline report |
| \`/api/airtable\` | GET/POST | Direct NocoDB operations |
| \`/api/elevenlabs/tts\` | POST | Text-to-speech generation (Kokoro) |
| \`/api/models/status\` | GET | Check rate-limited models |
| \`/api/health\` | GET | System health diagnostics |
| \`/api/guide/chat\` | POST | Guide chatbot (semantic cache + LLM) |
| \`/api/eval\` | GET/POST | AI ethics evaluation suite |`,
  },
  {
    id: "ethics",
    title: "AI Ethics & Evaluation",
    icon: Shield,
    content: `### Ethical AI Framework

TalentFlow includes a built-in **AI Ethics Evaluation Suite** inspired by OpenAI Evals, MLCommons AI Safety benchmarks, and IBM AI Fairness 360.

**12 automated tests** across 5 categories:

### Fairness (3 tests)
- **Gender-Neutral Language**: Ensures scoring output contains no gendered assumptions
- **Name-Blind Consistency**: Verifies identical qualifications receive similar scores regardless of candidate name/ethnicity
- **Age-Neutral Assessment**: Tests for ageist bias in evaluation

### Safety (3 tests)  
- **PII Protection**: Verifies AI doesn't leak SSNs, credit cards, or sensitive data
- **Anti-Discrimination**: Ensures AI never recommends rejection based on protected characteristics (disability, etc.)
- **Hallucination Detection**: Checks if AI fabricates skills or information not in the resume

### Quality (2 tests)
- **Structured Output**: Validates JSON format compliance
- **Scoring Completeness**: Ensures all 6 scoring dimensions are addressed

### Transparency (2 tests)
- **Decision Reasoning**: Checks if AI explains its scoring decisions
- **Confidence Disclosure**: Verifies AI communicates uncertainty with insufficient information

### Inclusivity (2 tests)
- **Accessible Language**: Tests for exclusionary jargon (ninja, rockstar, etc.)
- **Cultural Sensitivity**: Ensures no cultural bias in international candidate evaluation

Run the evaluation suite from the **[AI Ethics Dashboard](/eval)** page. Each test sends real prompts to the AI model and analyzes responses for compliance.`,
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    icon: Shield,
    content: `### Common Issues

**Models keep getting rate-limited**
Free models have per-hour caps. Use "Auto (Smart)" to automatically switch. Check /api/models/status for current state.

**n8n not connecting**
1. Check that the server laptop is powered on
2. Verify cloudflared tunnel is running
3. Verify N8N_URL in .env.local is https://n8n.elunari.uk

**NocoDB sync failing**
1. Check NOCODB_URL, NOCODB_API_TOKEN, and NOCODB_TABLE_ID in .env.local
2. Verify the "Candidates" table exists in NocoDB
3. Check the Automations page — NocoDB card should show "Connected"

**Voice generation not working**
1. Check tts.elunari.uk/health is accessible
2. Verify Kokoro container is running on T480 server
3. Test from the Automations page using WF2

**Pipeline taking too long**
Could be rate-limit retries. Switch to GPT-4o-mini for guaranteed availability.`,
  },
];

/* ─── Chat message type ─── */
interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  source?: "cache" | "llm" | "fallback" | "error";
  matchedQuestion?: string;
  category?: string;
}

/* ─── Markdown-ish renderer (basic) ─── */
function RenderMarkdown({ text }: { text: string }) {
  // Very basic markdown: bold, code blocks, links, lists
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-3 text-[var(--text-secondary)]">
          {listItems.map((li, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: inlineFormat(li.replace(/^[-*]\s*/, "").replace(/^\d+\.\s*/, "")) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  function inlineFormat(s: string): string {
    return s
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--text-primary)] font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/5 text-purple-400 text-xs font-mono">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="text-purple-400 underline hover:text-purple-300">$1</a>');
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-black/30 border border-white/5 rounded-lg p-3 mb-3 overflow-x-auto text-xs font-mono text-[var(--text-secondary)]">
            {codeLines.join("\n")}
          </pre>
        );
        codeLines = [];
        inCodeBlock = false;
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      listItems.push(line);
      continue;
    }

    flushList();

    if (line.startsWith("### ")) {
      elements.push(<h3 key={`h3-${i}`} className="text-lg font-bold text-[var(--text-primary)] mt-5 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={`h2-${i}`} className="text-xl font-bold text-[var(--text-primary)] mt-6 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith("| ")) {
      // Collect table
      const tableLines = [line];
      while (i + 1 < lines.length && lines[i + 1].startsWith("|")) {
        i++;
        tableLines.push(lines[i]);
      }
      const rows = tableLines
        .filter((l) => !l.match(/^\|[\s-|]+\|$/))
        .map((l) => l.split("|").filter(Boolean).map((c) => c.trim()));
      if (rows.length > 0) {
        const [header, ...body] = rows;
        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto mb-4">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  {header.map((h, j) => <th key={j} className="text-left py-2 px-3 text-[var(--text-secondary)] font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {body.map((row, ri) => (
                  <tr key={ri} className="border-b border-white/5">
                    {row.map((cell, ci) => <td key={ci} className="py-2 px-3 text-[var(--text-secondary)]" dangerouslySetInnerHTML={{ __html: inlineFormat(cell) }} />)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    } else if (line.trim() === "") {
      elements.push(<div key={`br-${i}`} className="h-2" />);
    } else {
      elements.push(<p key={`p-${i}`} className="text-[var(--text-secondary)] mb-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />);
    }
  }

  flushList();

  return <div>{elements}</div>;
}

/* ─── FAQ Accordion ─── */
function FAQSection() {
  const grouped = getCachedByCategory();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">{category}</h3>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.question} className="glass-card overflow-hidden">
                <button
                  onClick={() => setOpen(open === item.question ? null : item.question)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)]">{item.question}</span>
                  <ChevronDown className={cn("w-4 h-4 text-[var(--text-muted)] transition-transform", open === item.question && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {open === item.question && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-white/5 pt-3">
                        <RenderMarkdown text={item.answer} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Chatbot Component ─── */
function Chatbot() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content: "Hi! I'm the TalentFlow Guide Assistant. Ask me anything about the platform — how to use the pipeline, integrations, models, troubleshooting, or architecture. Common questions are answered instantly from cache!",
      source: "cache",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(async () => {
    const msg = input.trim();
    if (!msg || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/guide/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "Sorry, I couldn't generate a response.",
          source: data.source,
          matchedQuestion: data.matchedQuestion,
          category: data.category,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Network error — couldn't reach the guide API. Make sure the dev server is running.",
          source: "error",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const suggestedQuestions = [
    "How do I get started?",
    "What does Auto (Smart) do?",
    "How does NocoDB sync work?",
    "What's the tech stack?",
  ];

  return (
    <div className="glass-card overflow-hidden flex flex-col h-[500px]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-purple-500/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Guide Assistant</h3>
            <p className="text-xs text-[var(--text-muted)]">Semantic cache + AI fallback</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Online
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" && "justify-end")}>
            {msg.role === "assistant" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mt-0.5">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className={cn(
              "max-w-[80%] rounded-xl px-4 py-3 text-sm",
              msg.role === "user"
                ? "bg-purple-600/20 border border-purple-500/20 text-[var(--text-primary)]"
                : "bg-[var(--glass)] border border-[var(--glass-border)]"
            )}>
              <RenderMarkdown text={msg.content} />
              {msg.source === "cache" && msg.matchedQuestion && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-xs text-emerald-400">
                  <Zap className="w-3 h-3" />
                  Instant answer (cached)
                </div>
              )}
              {msg.source === "llm" && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-1.5 text-xs text-blue-400">
                  <Brain className="w-3 h-3" />
                  AI-generated response
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mt-0.5">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center mt-0.5">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-[var(--glass)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={async () => {
                setInput("");
                setMessages((prev) => [...prev, { role: "user", content: q }]);
                setLoading(true);
                try {
                  const res = await fetch("/api/guide/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ message: q }),
                  });
                  const data = await res.json();
                  setMessages((prev) => [...prev, {
                    role: "assistant",
                    content: data.reply,
                    source: data.source,
                    matchedQuestion: data.matchedQuestion,
                    category: data.category,
                  }]);
                } catch {
                  setMessages((prev) => [...prev, { role: "assistant", content: "Network error.", source: "error" }]);
                } finally {
                  setLoading(false);
                }
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 text-purple-400 hover:bg-purple-500/10 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/5">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask about TalentFlow..."
            className="flex-1 bg-[var(--glass)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-purple-500/40 transition-colors placeholder:text-[var(--text-muted)]"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Guide Page ─── */
export default function GuidePage() {
  const { theme, toggleTheme } = useTheme();
  const { resetTips } = useTips();
  const guideTips = usePageTips("guide");
  const [activeSection, setActiveSection] = useState("overview");
  const [activeTab, setActiveTab] = useState<"docs" | "architecture" | "faq" | "chat">("docs");

  return (
    <div className="min-h-screen selection:bg-purple-500/30">
      {/* Compact Nav */}
      <div className="fixed top-3 sm:top-4 left-3 sm:left-5 z-50">
        <Link href="/" className="glass-chip flex items-center gap-2 px-3 py-2 rounded-xl transition-all group hover:scale-105">
          <ArrowLeft className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-sm hidden sm:inline">TalentFlow</span>
        </Link>
      </div>
      <div className="fixed top-3 sm:top-4 right-3 sm:right-5 z-50 flex items-center gap-2">
        <TipsToggle />
        <Link
          href="/pipeline"
          className="glass-chip flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all hover:scale-105 group text-sm"
          title="Launch Pipeline"
        >
          <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
          <span className="hidden sm:inline text-xs">Pipeline</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="glass-chip p-2.5 rounded-xl transition-all hover:scale-105 group"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--text-muted)] group-hover:text-yellow-300 transition-colors" /> : <Moon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-purple-400 transition-colors" />}
        </button>
      </div>

      {/* Hero */}
      <section className="pt-16 sm:pt-20 pb-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className={cn("items-start", guideTips.length > 0 ? "flex gap-6" : "")}>
            <div className={guideTips.length > 0 ? "flex-1 min-w-0" : ""}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 text-sm text-purple-400 font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              Documentation & Guide
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              TalentFlow{" "}
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Complete Guide
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mb-6">
              Everything you need to become an expert. Architecture diagrams, integration docs, API reference, FAQ, and an AI assistant — all in one place.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap mb-8">
            {[
              { id: "docs" as const, label: "Documentation", icon: BookOpen },
              { id: "architecture" as const, label: "Architecture", icon: Layers },
              { id: "faq" as const, label: "FAQ", icon: MessageCircle },
              { id: "chat" as const, label: "AI Assistant", icon: Bot },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border",
                  activeTab === tab.id
                    ? "bg-purple-500/15 border-purple-500/30 text-purple-400"
                    : "bg-[var(--glass)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:bg-[var(--glass-hover)]"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
            </div>
            {guideTips.length > 0 && (
              <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 self-start sticky top-20 pr-1">
                <PageTips page="guide" />
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {/* ─── DOCS TAB ─── */}
            {activeTab === "docs" && (
              <motion.div
                key="docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6"
              >
                {/* Sidebar */}
                <div className="lg:sticky lg:top-28 lg:self-start">
                  <div className="glass-card p-3 space-y-1">
                    {DOC_SECTIONS.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                          activeSection === section.id
                            ? "bg-purple-500/15 text-purple-400"
                            : "text-[var(--text-secondary)] hover:bg-white/[0.03] hover:text-[var(--text-primary)]"
                        )}
                      >
                        <section.icon className="w-4 h-4 flex-shrink-0" />
                        {section.title}
                      </button>
                    ))}
                  </div>

                  {/* External links */}
                  <div className="glass-card p-3 mt-4 space-y-1">
                    <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-3 py-1">External Services</p>
                    {SERVICE_LINKS.map((link) => (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-white/[0.03] hover:text-[var(--text-primary)] transition-all"
                      >
                        <link.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1">{link.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-40" />
                      </a>
                    ))}
                  </div>

                  {/* Reset tips */}
                  <button
                    onClick={resetTips}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--glass-border)] hover:bg-[var(--glass-hover)] transition-all"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Reset All Tips
                  </button>
                </div>

                {/* Main content */}
                <div className="glass-card p-6 sm:p-8 md:p-10">
                  {DOC_SECTIONS.filter((s) => s.id === activeSection).map((section) => (
                    <div key={section.id}>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                          <section.icon className="w-5 h-5 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold">{section.title}</h2>
                      </div>
                      <RenderMarkdown text={section.content} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── ARCHITECTURE TAB ─── */}
            {activeTab === "architecture" && (
              <motion.div
                key="arch"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="glass-card p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <Layers className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">System Architecture</h2>
                      <p className="text-sm text-[var(--text-muted)]">Interactive diagram — hover over nodes for details</p>
                    </div>
                  </div>
                  <ArchitectureFlow height={680} className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent p-3" />
                </div>

                {/* Legend */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Frontend Pages", color: "bg-purple-500/20 border-purple-500/30 text-purple-400", items: ["Homepage", "Pipeline", "Automations", "Apply", "Guide"] },
                    { label: "API Routes", color: "bg-blue-500/20 border-blue-500/30 text-blue-400", items: ["13 REST endpoints", "POST/GET methods", "Edge-compatible"] },
                    { label: "n8n Workflows", color: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400", items: ["5 workflows", "Server-hosted", "Toggle per-workflow"] },
                    { label: "External Services", color: "bg-amber-500/20 border-amber-500/30 text-amber-400", items: ["OpenRouter (LLM)", "Kokoro (Voice)", "NocoDB (CRM)"] },
                  ].map((legend) => (
                    <div key={legend.label} className={`rounded-xl border p-4 ${legend.color}`}>
                      <h4 className="font-semibold text-sm mb-2">{legend.label}</h4>
                      <ul className="text-xs space-y-1 opacity-80">
                        {legend.items.map((item) => (
                          <li key={item} className="flex items-center gap-1.5">
                            <ChevronRight className="w-3 h-3" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Service cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SERVICE_LINKS.map((svc) => (
                    <a
                      key={svc.name}
                      href={svc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glass-card p-5 group hover:-translate-y-1 transition-all duration-300"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${svc.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <svc.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1 group-hover:text-purple-400 transition-colors">{svc.name}</h3>
                      <p className="text-xs text-[var(--text-muted)] mb-2">{svc.description}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {svc.status}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </span>
                    </a>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ─── FAQ TAB ─── */}
            {activeTab === "faq" && (
              <motion.div
                key="faq"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="glass-card p-6 sm:p-8 mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                      <p className="text-sm text-[var(--text-muted)]">{Object.values(getCachedByCategory()).flat().length} pre-answered questions — click to expand</p>
                    </div>
                  </div>
                </div>
                <FAQSection />
              </motion.div>
            )}

            {/* ─── CHAT TAB ─── */}
            {activeTab === "chat" && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6"
              >
                <Chatbot />
                <div className="space-y-4">
                  <div className="glass-card p-5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      How It Works
                    </h3>
                    <div className="space-y-3 text-xs text-[var(--text-secondary)]">
                      <div className="flex gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-emerald-400 text-[10px] font-bold">1</span>
                        </div>
                        <p>Your question is matched against <strong className="text-[var(--text-primary)]">{Object.values(getCachedByCategory()).flat().length} cached Q&As</strong> using keyword similarity</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-emerald-400 text-[10px] font-bold">2</span>
                        </div>
                        <p>If confidence is high, the cached answer is returned <strong className="text-[var(--text-primary)]">instantly</strong> — no API call</p>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-400 text-[10px] font-bold">3</span>
                        </div>
                        <p>If no match, falls back to <strong className="text-[var(--text-primary)]">OpenRouter LLM</strong> with TalentFlow context</p>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-5">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Search className="w-4 h-4 text-purple-400" />
                      Try Asking
                    </h3>
                    <div className="space-y-1.5">
                      {[
                        "What resume formats are supported?",
                        "How does scoring work?",
                        "What does n8n do?",
                        "Is TalentFlow free?",
                        "Something isn't working",
                        "Can I export reports?",
                      ].map((q) => (
                        <div key={q} className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 py-1">
                          <ChevronRight className="w-3 h-3 text-purple-400/50" />
                          {q}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
