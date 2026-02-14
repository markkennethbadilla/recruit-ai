"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { X, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ───────── tip definitions ───────── */
export interface TipDef {
  id: string;
  title: string;
  body: string;
  page: string;       // which route this tip appears on
  position?: "top" | "bottom" | "inline";
  color?: string;     // tailwind color prefix, e.g. "purple"
}

export const ALL_TIPS: TipDef[] = [
  // Pipeline tips
  {
    id: "pipeline-upload",
    title: "Start with a Resume",
    body: "Upload a PDF or text resume. The AI will extract structured data, score the candidate against your job description, and generate screening questions — all in under 30 seconds.",
    page: "pipeline",
    color: "purple",
  },
  {
    id: "pipeline-model",
    title: "Model Selection",
    body: "\"Auto (Smart)\" picks the fastest available free model automatically. If one model is rate-limited, it seamlessly falls back to the next in the cascade.",
    page: "pipeline",
    color: "blue",
  },
  {
    id: "pipeline-jd",
    title: "Job Description Matters",
    body: "The more detailed your job description, the more accurate the scoring. Use the built-in templates as a starting point, then customize.",
    page: "pipeline",
    color: "cyan",
  },
  // Automations tips
  {
    id: "auto-n8n",
    title: "n8n Orchestration",
    body: "5 independent workflows handle intake, outreach, data sync, health monitoring, and reporting. Each can be toggled on/off from the n8n dashboard without code changes.",
    page: "automations",
    color: "cyan",
  },
  {
    id: "auto-outreach",
    title: "Smart Outreach",
    body: "Test WF2 to generate a personalized email + AI voice message using Kokoro TTS. The email is written to sound human — no AI-buzzwords, natural cadence.",
    page: "automations",
    color: "blue",
  },
  {
    id: "auto-sync",
    title: "Data Sync to NocoDB",
    body: "WF3 pushes a flat candidate record to NocoDB with recommendation, skills, and fit score. Records appear in your CRM instantly.",
    page: "automations",
    color: "emerald",
  },
  // Apply tips
  {
    id: "apply-form",
    title: "Candidate Self-Service",
    body: "Share the /apply link with candidates. Submissions go directly to NocoDB and trigger n8n's intake workflow automatically.",
    page: "apply",
    color: "purple",
  },
  // Guide tips
  {
    id: "guide-chatbot",
    title: "Ask the AI Assistant",
    body: "The chatbot at the bottom of this page can answer questions about any part of TalentFlow. Common questions are answered instantly via semantic cache — no API calls needed.",
    page: "guide",
    color: "purple",
  },
  // Eval tips
  {
    id: "eval-run",
    title: "Run Your First Evaluation",
    body: "Click the Run AI Evaluation button to test the AI across 14 metrics covering fairness, safety, quality, transparency, inclusivity, and performance. Each test gets a pass or fail grade, and your overall score is graded from A+ through F.",
    page: "eval",
    color: "emerald",
  },
  {
    id: "eval-interpret",
    title: "Reading the Results",
    body: "Every test shows a pass or fail status with a score from 0 to 100. Tap any test to expand its details and see exactly what happened. Category scores combine the individual test results, and the recommendations section tells you what to fix.",
    page: "eval",
    color: "cyan",
  },
  {
    id: "eval-iterate",
    title: "Continuous Improvement",
    body: "After changing your scoring prompts or switching models, run the evaluation again to see if things improved. The system sends real prompts and analyzes real AI responses, not simulations, so results reflect actual behavior.",
    page: "eval",
    color: "purple",
  },
  {
    id: "eval-model-choice",
    title: "Try Different Models",
    body: "Each AI model behaves differently. Use the model picker to test Llama, Gemma, GPT-4o Mini, and others — you'll see how fairness and quality vary by model. This helps you pick the best one for your pipeline.",
    page: "eval",
    color: "blue",
  },
  {
    id: "eval-what-tested",
    title: "What Exactly Is Tested?",
    body: "We evaluate how the AI actually behaves when scoring candidates. Does it give equal scores regardless of a person's name or gender? Does it protect sensitive data? Does it explain why it gave a particular score? Does it make up skills? All 14 tests use real prompts, not simulations.",
    page: "eval",
    color: "amber",
  },
];

/* ───────── context ───────── */
interface TipsContextType {
  enabled: boolean;
  toggleTips: () => void;
  dismissed: Set<string>;
  dismissTip: (id: string) => void;
  resetTips: () => void;
}

const TipsContext = createContext<TipsContextType>({
  enabled: true,
  toggleTips: () => {},
  dismissed: new Set(),
  dismissTip: () => {},
  resetTips: () => {},
});

const STORAGE_KEY = "talentflow-tips";

export function TipsProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.enabled === false) setEnabled(false);
        if (Array.isArray(data.dismissed)) setDismissed(new Set(data.dismissed));
      }
    } catch { /* ignore */ }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      enabled,
      dismissed: Array.from(dismissed),
    }));
  }, [enabled, dismissed, mounted]);

  const toggleTips = useCallback(() => setEnabled((e) => !e), []);

  const dismissTip = useCallback((id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const resetTips = useCallback(() => {
    setDismissed(new Set());
    setEnabled(true);
  }, []);

  return (
    <TipsContext.Provider value={{ enabled, toggleTips, dismissed, dismissTip, resetTips }}>
      {children}
    </TipsContext.Provider>
  );
}

export function useTips() {
  return useContext(TipsContext);
}

/** Returns active (non-dismissed) tips for a page. Useful for conditional aside rendering. */
export function usePageTips(page: string) {
  const { enabled, dismissed } = useTips();
  if (!enabled) return [];
  return ALL_TIPS.filter((t) => t.page === page && !dismissed.has(t.id));
}

/* ───────── Tip card component ───────── */
export function TipCard({ tip }: { tip: TipDef }) {
  const { enabled, dismissed, dismissTip } = useTips();
  const color = tip.color || "purple";

  if (!enabled || dismissed.has(tip.id)) return null;

  const colorMap: Record<string, { bg: string; border: string; icon: string; glow: string }> = {
    purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-400", glow: "shadow-purple-500/10" },
    blue:   { bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: "text-blue-400",   glow: "shadow-blue-500/10" },
    cyan:   { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",   icon: "text-cyan-400",   glow: "shadow-cyan-500/10" },
    emerald:{ bg: "bg-emerald-500/10", border: "border-emerald-500/20",icon: "text-emerald-400", glow: "shadow-emerald-500/10" },
    amber:  { bg: "bg-amber-500/10",   border: "border-amber-500/20",  icon: "text-amber-400",  glow: "shadow-amber-500/10" },
  };
  const c = colorMap[color] || colorMap.purple;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={`relative ${c.bg} ${c.border} border rounded-xl p-4 pr-10 shadow-lg ${c.glow}`}
      >
        <button
          onClick={() => dismissTip(tip.id)}
          className="absolute top-3 right-3 p-1 rounded-lg hover:bg-[var(--glass-hover)] transition-colors"
          title="Dismiss tip"
        >
          <X className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 w-7 h-7 rounded-lg ${c.bg} flex items-center justify-center flex-shrink-0`}>
            <Lightbulb className={`w-4 h-4 ${c.icon}`} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{tip.title}</h4>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{tip.body}</p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ───────── Tips strip for a page ───────── */
/* Desktop: vertical stack in the side column caller provides.
   Mobile tips are surfaced inside the NovaGuardian assistant. */
export function PageTips({ page }: { page: string }) {
  const { enabled, dismissed } = useTips();
  const scrollRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef(false);
  const isConstrainedTipsPage = page === "eval";

  const tips = ALL_TIPS.filter((t) => t.page === page && !dismissed.has(t.id));

  /* Auto-scroll desktop tips slowly so users notice hidden ones */
  useEffect(() => {
    if (!isConstrainedTipsPage || !enabled || tips.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    // Only auto-scroll when content overflows
    if (el.scrollHeight <= el.clientHeight) return;

    let raf: number;
    const speed = 0.3; // px per frame (~18px/s at 60fps)

    const tick = () => {
      if (!pauseRef.current && el) {
        el.scrollTop += speed;
        // When near the bottom, reset to top smoothly
        if (el.scrollTop >= el.scrollHeight - el.clientHeight - 1) {
          el.scrollTop = 0;
        }
      }
      raf = requestAnimationFrame(tick);
    };

    // Delay start so user sees the first tips statically
    const timer = setTimeout(() => { raf = requestAnimationFrame(tick); }, 3000);

    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [enabled, tips.length, isConstrainedTipsPage]);

  if (!enabled || tips.length === 0) return null;
  return (
    <div
      ref={scrollRef}
      className={isConstrainedTipsPage ? "flex flex-col gap-3 max-h-[70vh] overflow-y-auto scrollbar-mini pr-1" : "flex flex-col gap-3"}
      onMouseEnter={() => { pauseRef.current = true; }}
      onMouseLeave={() => { pauseRef.current = false; }}
    >
      {tips.map((tip) => (
        <TipCard key={tip.id} tip={tip} />
      ))}
    </div>
  );
}

/* ───────── Global toggle button ───────── */
export function TipsToggle() {
  const { enabled, toggleTips } = useTips();

  return (
    <button
      onClick={toggleTips}
      className={`flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
        enabled
          ? "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
          : "bg-[var(--glass)] border-[var(--glass-border)] text-[var(--text-muted)] hover:bg-[var(--glass-hover)]"
      }`}
      title={enabled ? "Hide tips" : "Show tips"}
    >
      <Lightbulb className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{enabled ? "Tips On" : "Tips Off"}</span>
    </button>
  );
}
