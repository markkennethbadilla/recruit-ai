"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Compass, Lightbulb, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { ALL_TIPS, useTips } from "@/lib/tips";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   SIMPLE MARKDOWN → JSX (bold, italic, lists, line breaks)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function renderMarkdown(text: string) {
  // Split into lines and process
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-0.5 my-1">
          {listItems}
        </ul>
      );
      listItems = [];
    }
  };

  const inlineFormat = (line: string, key: string): React.ReactNode => {
    // Process **bold** and *italic*
    const parts: React.ReactNode[] = [];
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      if (match[2]) {
        parts.push(<strong key={`${key}-b-${match.index}`} className="font-semibold">{match[2]}</strong>);
      } else if (match[3]) {
        parts.push(<em key={`${key}-i-${match.index}`}>{match[3]}</em>);
      } else if (match[4]) {
        parts.push(
          <code key={`${key}-c-${match.index}`} className="px-1 py-0.5 rounded bg-purple-500/15 text-[12px] font-mono">
            {match[4]}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }
    return parts.length > 0 ? parts : line;
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const content = trimmed.slice(2);
      listItems.push(<li key={`li-${i}`}>{inlineFormat(content, `li-${i}`)}</li>);
    } else {
      flushList();
      if (trimmed === "") {
        if (i > 0 && i < lines.length - 1) {
          elements.push(<div key={`br-${i}`} className="h-1.5" />);
        }
      } else {
        elements.push(
          <span key={`p-${i}`}>
            {inlineFormat(trimmed, `p-${i}`)}
            {i < lines.length - 1 && <br />}
          </span>
        );
      }
    }
  });
  flushList();

  return <>{elements}</>;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   IDENTITY
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const NAME = "Nova";
const PERSONALITY =
  `You are ${NAME}, TalentFlow's guardian AI spirit. Personality: warm, direct, genuinely helpful — ` +
  `like a brilliant senior recruiter who truly cares. Speak concisely (under 120 words usually). ` +
  `Give opinionated, concrete next-step advice. Celebrate wins. Admit uncertainty honestly. ` +
  `Light personality but never forced. You know every feature, endpoint, and workflow intimately.`;
const STORAGE_KEY = "nova-guardian-v2";
const TIP_SHOWN_KEY = "nova-tip-shown";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TYPES
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
type Mood = "idle" | "thinking" | "speaking" | "happy";
type Role = "user" | "nova";
interface Msg {
  role: Role;
  content: string;
  ts: number;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PROACTIVE TIPS (personality-infused, per-page)
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const PAGE_TIPS: Record<string, string> = {
  "/": "Hey! I'm Nova, your recruiting co-pilot. Tap me anytime — I know this platform inside out.",
  "/pipeline": "Pipeline's ready. Drop a resume in and I'll walk you through the whole scoring flow.",
  "/automations": "Workflow command center. Want me to check if everything's running smooth?",
  "/guide": "Full docs, right here. Or just ask me — I probably recall it faster than the page loads.",
  "/eval": "Ethics dashboard. Let's make sure your AI scoring is fair and transparent.",
  "/apply": "This is what candidates see. Want to test the submission flow?",
  "/features": "Deep-dive into each capability. Ask me about any feature.",
};

function getTip(path: string): string {
  if (PAGE_TIPS[path]) return PAGE_TIPS[path];
  for (const [k, v] of Object.entries(PAGE_TIPS)) {
    if (k !== "/" && path.startsWith(k)) return v;
  }
  return `Exploring ${path}. Need a hand with anything?`;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   NOVA FACE — Custom SVG with mood-reactive expressions
   A luminous wisp/spirit: teardrop body, halo, tiny wings, expressive eyes
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function NovaFace({ mood, size = 48 }: { mood: Mood; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      className="flex-shrink-0"
    >
      <defs>
        <linearGradient id="n-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="n-halo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
        </linearGradient>
        <filter id="n-glow">
          <feGaussianBlur stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Halo ring */}
      <ellipse
        cx="24"
        cy="11"
        rx="9"
        ry="2.5"
        stroke="url(#n-halo)"
        strokeWidth="1"
        opacity={mood === "happy" ? 1 : 0.55}
      />

      {/* Body — luminous spirit shape */}
      <path
        d="M24 12 C28 16, 31 22, 31 27 C31 33, 28 39, 24 40 C20 39, 17 33, 17 27 C17 22, 20 16, 24 12Z"
        fill="url(#n-body)"
        filter="url(#n-glow)"
      />

      {/* Inner shine highlight */}
      <path
        d="M24 15 C27 18, 29 23, 29 27 C29 32, 27 36, 24 37 C22 36, 20 32, 20 27 C20 23, 22 18, 24 15Z"
        fill="white"
        opacity="0.12"
      />

      {/* Subtle wings */}
      <path
        d="M17 25 Q11 21, 13 29 Q15 26, 17 27Z"
        fill="url(#n-body)"
        opacity="0.25"
      />
      <path
        d="M31 25 Q37 21, 35 29 Q33 26, 31 27Z"
        fill="url(#n-body)"
        opacity="0.25"
      />

      {/* Eyes — mood-reactive */}
      {mood === "happy" ? (
        <>
          <path
            d="M21 25 Q22 23.5, 23 25"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <path
            d="M25 25 Q26 23.5, 27 25"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </>
      ) : mood === "thinking" ? (
        <>
          <circle cx="22" cy="23.5" r="1.3" fill="white" opacity="0.85" />
          <circle cx="26" cy="23.5" r="1.3" fill="white" opacity="0.85" />
          {/* Pupils looking up */}
          <circle cx="22.3" cy="23" r="0.45" fill="#7c3aed" />
          <circle cx="26.3" cy="23" r="0.45" fill="#7c3aed" />
        </>
      ) : (
        <>
          <circle cx="22" cy="24" r="1.3" fill="white" opacity="0.95" />
          <circle cx="26" cy="24" r="1.3" fill="white" opacity="0.95" />
        </>
      )}

      {/* Mouth */}
      {mood === "speaking" ? (
        <ellipse cx="24" cy="28.5" rx="1.5" ry="1" fill="white" opacity="0.45" />
      ) : (
        <path
          d="M22.5 27.5 Q24 29, 25.5 27.5"
          stroke="white"
          strokeWidth="0.7"
          strokeLinecap="round"
          opacity="0.45"
        />
      )}
    </svg>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   AMBIENT PARTICLES — orbiting sparkles around Nova
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function NovaParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-purple-400/50"
          style={{ left: "50%", top: "50%" }}
          animate={{
            x: [0, Math.cos((i * Math.PI) / 2) * 24, 0],
            y: [0, Math.sin((i * Math.PI) / 2) * 24, 0],
            opacity: [0, 0.7, 0],
            scale: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 3.5 + i * 0.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   LIVE CONTEXT HOOK — fetches system health per route
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function useLiveContext(pathname: string) {
  const [ctx, setCtx] = useState({ route: pathname, summary: "" });

  useEffect(() => {
    let dead = false;
    async function gather() {
      const parts: string[] = [`Route: ${pathname}.`];
      try {
        const r = await fetch("/api/health", { cache: "no-store" });
        if (r.ok) {
          const h = await r.json();
          parts.push(
            `System ${h.status || "unknown"}, uptime ${h.uptime || "n/a"}.`
          );
        }
      } catch {}
      if (pathname.includes("automations")) {
        try {
          const r = await fetch("/api/n8n/status", { cache: "no-store" });
          if (r.ok) {
            const n = await r.json();
            const wf = Array.isArray(n.workflows) ? n.workflows : [];
            const active = wf.filter((w: any) => w?.active).length;
            parts.push(
              `n8n ${n.connected ? "connected" : "offline"}, ${active}/${wf.length} workflows active.`
            );
          }
        } catch {}
      }
      if (!dead) setCtx({ route: pathname, summary: parts.join(" ") });
    }
    gather();
    return () => {
      dead = true;
    };
  }, [pathname]);

  return ctx;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PERSISTENCE
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function loadMessages(): Msg[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.messages)) return data.messages.slice(-30);
    }
  } catch {}
  return [];
}
function saveMessages(msgs: Msg[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ messages: msgs.slice(-30) })
    );
  } catch {}
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   UI HIGHLIGHT — Nova "touches" the page
   Finds a heading/section by keyword, scrolls to it, and pulses a glow
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function highlightSection(keyword: string) {
  const el = Array.from(
    document.querySelectorAll("h1, h2, h3, section, [data-highlight]")
  ).find((n) =>
    n.textContent?.toLowerCase().includes(keyword.toLowerCase())
  ) as HTMLElement | undefined;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.outline = "2px solid var(--accent-purple)";
  el.style.outlineOffset = "6px";
  el.style.boxShadow = "0 0 30px var(--accent-purple-glow)";
  el.style.borderRadius = "8px";
  el.style.transition = "all 0.4s ease";
  setTimeout(() => {
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.boxShadow = "";
  }, 3000);
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   MAIN COMPONENT
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
export default function NovaGuardian() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const pathname = usePathname() || "/";
  const router = useRouter();

  /* ── state ── */
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mood, setMood] = useState<Mood>("idle");
  const [tipVisible, setTipVisible] = useState(false);
  const [tipText, setTipText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileTips, setShowMobileTips] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const liveCtx = useLiveContext(pathname);

  /* ── page tips for mobile integration ── */
  const { enabled: tipsEnabled, dismissed, dismissTip } = useTips();
  const pageTips = useMemo(() => {
    const page = pathname.includes("pipeline") ? "pipeline"
      : pathname.includes("eval") ? "eval"
      : pathname.includes("automations") ? "automations"
      : pathname.includes("guide") ? "guide"
      : pathname.includes("apply") ? "apply"
      : "";
    if (!page || !tipsEnabled) return [];
    return ALL_TIPS.filter((t) => t.page === page && !dismissed.has(t.id));
  }, [pathname, tipsEnabled, dismissed]);

  /* ── hydrate from localStorage ── */
  useEffect(() => {
    const stored = loadMessages();
    if (stored.length > 0) setMessages(stored);
    setIsMobile(window.innerWidth < 640);
    setMounted(true);

    function onResize() {
      setIsMobile(window.innerWidth < 640);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  /* ── persist messages ── */
  useEffect(() => {
    if (mounted) saveMessages(messages);
  }, [messages, mounted]);

  /* ── proactive tip on route change ── */
  useEffect(() => {
    if (!mounted || open) return;
    
    // Only show tip once per session
    const tipShown = localStorage.getItem(TIP_SHOWN_KEY);
    if (tipShown === "true") return;
    
    const text = getTip(pathname);
    setTipText(text);
    const show = setTimeout(() => {
      setTipVisible(true);
      localStorage.setItem(TIP_SHOWN_KEY, "true");
    }, 1800);
    const hide = setTimeout(() => setTipVisible(false), 10000);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [pathname, mounted, open]);

  /* ── hide tip when chat opens, auto-focus input ── */
  useEffect(() => {
    if (open) {
      setTipVisible(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  /* ── auto-scroll chat to bottom ── */
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  /* ── send message ── */
  const send = useCallback(
    async (text?: string) => {
      const msg = (text ?? input).trim();
      if (!msg || loading) return;

      const userMsg: Msg = { role: "user", content: msg, ts: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      setMood("thinking");

      try {
        const history = [...messages, userMsg]
          .slice(-12)
          .map((m) => ({
            role: m.role === "nova" ? "assistant" : ("user" as const),
            content: m.content,
          }));
        const res = await fetch("/api/guide/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            route: liveCtx.route,
            contextSummary: `${PERSONALITY}\n\n${liveCtx.summary}`,
            history,
          }),
        });
        const data = await res.json();
        const reply =
          typeof data?.reply === "string"
            ? data.reply
            : "Hmm, I couldn't process that. Try again?";
        setMessages((prev) => [
          ...prev,
          { role: "nova", content: reply, ts: Date.now() },
        ]);
        setMood("speaking");
        setTimeout(() => setMood("idle"), 2500);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "nova",
            content: "Connection hiccup. Give me a second and try again.",
            ts: Date.now(),
          },
        ]);
        setMood("idle");
      } finally {
        setLoading(false);
      }
    },
    [input, loading, messages, liveCtx]
  );

  /* ── contextual quick prompts ── */
  const quickPrompts = useMemo(() => {
    if (pathname.includes("automations"))
      return [
        "Diagnose workflows",
        "Explain the architecture",
        "Check AirTable sync",
      ];
    if (pathname.includes("pipeline"))
      return [
        "Walk me through scoring",
        "Which model works best?",
        "How do I upload?",
      ];
    if (pathname.includes("guide"))
      return [
        "Summarize the docs",
        "How does the AI pipeline work?",
        "What integrations exist?",
      ];
    if (pathname.includes("eval"))
      return [
        "Explain bias detection",
        "What are the 6 scoring axes?",
        "Run a fairness check",
      ];
    if (pathname.includes("apply"))
      return [
        "Test the apply flow",
        "What happens after submission?",
        "Where does data go?",
      ];
    return ["Get me started", "What can you do?", "Show me the pipeline"];
  }, [pathname]);

  /* ── page navigation actions ── */
  const navActions = useMemo(
    () =>
      [
        { label: "Pipeline", path: "/pipeline" },
        { label: "Automations", path: "/automations" },
        { label: "Guide", path: "/guide" },
        { label: "Ethics", path: "/eval" },
      ].filter((a) => a.path !== pathname),
    [pathname]
  );

  /* ── context actions: Nova interacts with the UI ── */
  const contextActions = useMemo(() => {
    const actions: { label: string; run: () => void }[] = [];
    if (pathname.includes("automations")) {
      actions.push({
        label: "Show Architecture",
        run: () => highlightSection("architecture"),
      });
      actions.push({
        label: "Show Workflows",
        run: () => highlightSection("workflow"),
      });
    }
    if (pathname.includes("guide")) {
      actions.push({
        label: "Jump to FAQ",
        run: () => highlightSection("faq"),
      });
      actions.push({
        label: "Show Architecture",
        run: () => highlightSection("architecture"),
      });
    }
    if (pathname === "/") {
      actions.push({
        label: "View Features",
        run: () => highlightSection("how it works"),
      });
    }
    if (pathname.includes("eval")) {
      actions.push({
        label: "See Scoring Axes",
        run: () => highlightSection("scoring"),
      });
    }
    return actions;
  }, [pathname]);

  if (!mounted) return null;

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     RENDER
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  return (
    <div
      className={cn(
        "fixed z-[110] flex",
        isMobile
          ? "bottom-4 right-3 flex-col-reverse items-end gap-2"
          : "bottom-5 right-5 items-end gap-3"
      )}
    >
      {/* ━━ SPEECH BUBBLE ZONE ━━ */}
      <AnimatePresence mode="wait">
        {/* ── Nametag (always visible when idle) ── */}
        {!tipVisible && !open && (
          <motion.div
            key="nametag"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide select-none cursor-pointer",
              "bg-gradient-to-r from-purple-600/15 to-cyan-600/15 border",
              isDark
                ? "border-purple-500/20 text-purple-300"
                : "border-purple-200/60 text-purple-600"
            )}
            onClick={() => setOpen(true)}
          >
            {NAME}
          </motion.div>
        )}

        {/* ── Proactive tip bubble ── */}
        {tipVisible && !open && (
          <motion.div
            key="tip"
            initial={{ opacity: 0, scale: 0.8, x: isMobile ? 0 : 20, y: isMobile ? 10 : 0 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: isMobile ? 0 : 10, y: isMobile ? 5 : 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={cn(
              "relative px-4 py-3 rounded-2xl text-[13px] leading-relaxed cursor-pointer",
              isMobile ? "max-w-[280px] rounded-br-lg" : "max-w-[260px] rounded-br-md",
              isDark
                ? "bg-[#13141f]/95 border border-purple-500/20 text-gray-300 shadow-xl shadow-purple-500/10"
                : "bg-white/95 border border-purple-200/60 text-gray-600 shadow-xl shadow-purple-100/40"
            )}
            style={{ backdropFilter: "blur(8px)" }}
            onClick={() => {
              setTipVisible(false);
              setOpen(true);
            }}
          >
            {/* Speech tail pointing toward Nova (desktop only) */}
            {!isMobile && (
              <div
                className="absolute -right-[7px] bottom-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[7px]"
                style={{
                  borderLeftColor: isDark
                    ? "rgba(19,20,31,0.95)"
                    : "rgba(255,255,255,0.95)",
                }}
              />
            )}
            <span className="font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              {NAME}
            </span>
            <span className={isDark ? " text-gray-500" : " text-gray-400"}>
              {" "}
              —{" "}
            </span>
            {tipText}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTipVisible(false);
              }}
              className={cn(
                "absolute -top-2 -left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] transition-colors",
                isDark
                  ? "bg-gray-800 border border-gray-600 text-gray-400 hover:text-white"
                  : "bg-gray-100 border border-gray-300 text-gray-500 hover:text-gray-900"
              )}
            >
              x
            </button>
          </motion.div>
        )}

        {/* ── Full chat bubble ── */}
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={cn(
              "rounded-2xl overflow-hidden border flex flex-col",
              isMobile
                ? "w-[calc(100vw-24px)] rounded-br-lg"
                : "w-[380px] rounded-br-md",
              isDark
                ? "bg-[#0a0d17]/97 border-purple-500/15 shadow-2xl shadow-purple-900/20"
                : "bg-white/97 border-purple-200/40 shadow-2xl shadow-purple-100/30"
            )}
            style={{
              backdropFilter: "blur(8px)",
              maxHeight: isMobile ? "70vh" : "min(76vh, 580px)",
            }}
          >
            {/* Header */}
            <div
              className={cn(
                "px-4 py-3 border-b flex items-center gap-3 flex-shrink-0",
                isDark ? "border-white/8" : "border-purple-100/60"
              )}
            >
              <div className="relative">
                <NovaFace mood={mood} size={32} />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2",
                    isDark ? "border-[#0a0d17]" : "border-white"
                  )}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-bold tracking-tight",
                    isDark ? "text-white" : "text-gray-900"
                  )}
                >
                  {NAME}
                </p>
                <p
                  className={cn(
                    "text-[11px] truncate",
                    isDark ? "text-gray-500" : "text-gray-400"
                  )}
                >
                  {mood === "thinking"
                    ? "thinking..."
                    : mood === "speaking"
                      ? "responding..."
                      : `guardian — ${pathname}`}
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  isDark
                    ? "hover:bg-white/8 text-gray-400"
                    : "hover:bg-gray-100 text-gray-500"
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0"
              style={{
                maxHeight: isMobile ? "calc(70vh - 180px)" : "340px",
              }}
            >
              {/* Empty state */}
              {messages.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <NovaFace mood="happy" size={56} />
                  </motion.div>
                  <div className="text-center">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        isDark ? "text-white" : "text-gray-900"
                      )}
                    >
                      Hey! I&apos;m {NAME}.
                    </p>
                    <p
                      className={cn(
                        "text-xs mt-1 max-w-[250px] leading-relaxed",
                        isDark ? "text-gray-400" : "text-gray-500"
                      )}
                    >
                      Your TalentFlow guardian. I know every feature, workflow,
                      and setting. Just ask.
                    </p>
                  </div>

                  {/* ── Mobile page tips inside Nova ── */}
                  {isMobile && pageTips.length > 0 && (
                    <div className="w-full space-y-2 mt-4 px-1">
                      <p className={cn(
                        "text-[11px] font-medium uppercase tracking-wider text-center",
                        isDark ? "text-gray-500" : "text-gray-400"
                      )}>
                        Page Tips
                      </p>
                      {pageTips.map((tip) => {
                        const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
                          purple:  { bg: "bg-purple-500/10",  border: "border-purple-500/20",  icon: "text-purple-400"  },
                          blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    icon: "text-blue-400"    },
                          cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    icon: "text-cyan-400"    },
                          emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400" },
                          amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: "text-amber-400"   },
                        };
                        const c = colorMap[tip.color || "purple"] || colorMap.purple;
                        return (
                          <motion.div
                            key={tip.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`relative ${c.bg} ${c.border} border rounded-xl p-3 pr-8`}
                          >
                            <button
                              onClick={() => dismissTip(tip.id)}
                              className="absolute top-2 right-2 p-0.5 rounded-md hover:bg-[var(--glass-hover)] transition-colors"
                            >
                              <X className="w-3 h-3 text-[var(--text-muted)]" />
                            </button>
                            <div className="flex items-start gap-2">
                              <Lightbulb className={`w-3.5 h-3.5 mt-0.5 ${c.icon} flex-shrink-0`} />
                              <div>
                                <p className="text-[12px] font-semibold text-[var(--text-primary)]">{tip.title}</p>
                                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed mt-0.5">{tip.body}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Chat messages */}
              {messages.map((m, i) => (
                <motion.div
                  key={`${m.ts}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex gap-2",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {m.role === "nova" && (
                    <div className="flex-shrink-0 mt-1">
                      <NovaFace mood="idle" size={18} />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[82%] text-[13px] px-3.5 py-2.5 rounded-2xl leading-relaxed",
                      m.role === "user"
                        ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-br-sm whitespace-pre-wrap"
                        : isDark
                          ? "bg-white/[0.04] border border-white/8 text-gray-200 rounded-bl-sm"
                          : "bg-purple-50/60 border border-purple-100/60 text-gray-800 rounded-bl-sm"
                    )}
                  >
                    {m.role === "nova" ? renderMarkdown(m.content) : m.content}
                  </div>
                </motion.div>
              ))}

              {/* Thinking indicator */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 px-1"
                >
                  <NovaFace mood="thinking" size={18} />
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-purple-400"
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          scale: [0.8, 1.1, 0.8],
                        }}
                        transition={{
                          duration: 0.9,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Mobile tips panel (toggleable) */}
            <AnimatePresence>
              {isMobile && showMobileTips && pageTips.length > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "overflow-hidden border-t flex-shrink-0",
                    isDark ? "border-white/6" : "border-purple-100/40"
                  )}
                >
                  <div className="p-2 space-y-1.5 max-h-[30vh] overflow-y-auto scrollbar-mini">
                    {pageTips.map((tip) => {
                      const colorMap: Record<string, { bg: string; border: string; icon: string }> = {
                        purple:  { bg: "bg-purple-500/10",  border: "border-purple-500/20",  icon: "text-purple-400"  },
                        blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/20",    icon: "text-blue-400"    },
                        cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/20",    icon: "text-cyan-400"    },
                        emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", icon: "text-emerald-400" },
                        amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/20",   icon: "text-amber-400"   },
                      };
                      const c = colorMap[tip.color || "purple"] || colorMap.purple;
                      return (
                        <div
                          key={tip.id}
                          className={`relative ${c.bg} ${c.border} border rounded-lg p-2.5 pr-7`}
                        >
                          <button
                            onClick={() => dismissTip(tip.id)}
                            className="absolute top-1.5 right-1.5 p-0.5 rounded hover:bg-[var(--glass-hover)] transition-colors"
                          >
                            <X className="w-2.5 h-2.5 text-[var(--text-muted)]" />
                          </button>
                          <div className="flex items-start gap-2">
                            <Lightbulb className={`w-3 h-3 mt-0.5 ${c.icon} flex-shrink-0`} />
                            <div>
                              <p className="text-[11px] font-semibold text-[var(--text-primary)]">{tip.title}</p>
                              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed mt-0.5">{tip.body}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick prompts + context actions + nav */}
            <div
              className={cn(
                "px-3 py-2 border-t flex flex-wrap gap-1.5 flex-shrink-0",
                isDark ? "border-white/6" : "border-purple-100/40"
              )}
            >
              {(messages.length < 4
                ? quickPrompts
                : quickPrompts.slice(0, 1)
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className={cn(
                    "text-[11px] px-2.5 py-1.5 rounded-full border transition-all hover:scale-[1.03] active:scale-[0.97]",
                    isDark
                      ? "bg-purple-500/8 border-purple-500/15 text-purple-300 hover:bg-purple-500/15 hover:border-purple-400/30"
                      : "bg-purple-50 border-purple-100 text-purple-700 hover:bg-purple-100"
                  )}
                >
                  {p}
                </button>
              ))}
              {contextActions.map((a) => (
                <button
                  key={a.label}
                  onClick={a.run}
                  className={cn(
                    "text-[11px] px-2.5 py-1.5 rounded-full border transition-all inline-flex items-center gap-1 hover:scale-[1.03] active:scale-[0.97]",
                    isDark
                      ? "bg-amber-500/8 border-amber-500/15 text-amber-300 hover:bg-amber-500/15"
                      : "bg-amber-50 border-amber-100 text-amber-700 hover:bg-amber-100"
                  )}
                >
                  <span className="text-[9px]">&#9670;</span> {a.label}
                </button>
              ))}
              {navActions.slice(0, 2).map((n) => (
                <button
                  key={n.path}
                  onClick={() => router.push(n.path)}
                  className={cn(
                    "text-[11px] px-2.5 py-1.5 rounded-full border transition-all inline-flex items-center gap-1 hover:scale-[1.03] active:scale-[0.97]",
                    isDark
                      ? "bg-cyan-500/8 border-cyan-500/15 text-cyan-300 hover:bg-cyan-500/15"
                      : "bg-cyan-50 border-cyan-100 text-cyan-700 hover:bg-cyan-100"
                  )}
                >
                  <Compass className="w-3 h-3" /> {n.label}
                </button>
              ))}
              {isMobile && pageTips.length > 0 && (
                <button
                  onClick={() => setShowMobileTips((v) => !v)}
                  className={cn(
                    "text-[11px] px-2.5 py-1.5 rounded-full border transition-all inline-flex items-center gap-1 hover:scale-[1.03] active:scale-[0.97]",
                    showMobileTips
                      ? isDark
                        ? "bg-purple-500/20 border-purple-400/30 text-purple-300"
                        : "bg-purple-100 border-purple-200 text-purple-700"
                      : isDark
                        ? "bg-emerald-500/8 border-emerald-500/15 text-emerald-300 hover:bg-emerald-500/15"
                        : "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100"
                  )}
                >
                  <Lightbulb className="w-3 h-3" /> {showMobileTips ? "Hide Tips" : `Tips (${pageTips.length})`}
                </button>
              )}
            </div>

            {/* Input */}
            <div
              className={cn(
                "p-3 border-t flex gap-2 flex-shrink-0",
                isDark ? "border-white/8" : "border-purple-100/40"
              )}
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={`Ask ${NAME} anything...`}
                className={cn(
                  "flex-1 text-sm rounded-xl px-3 py-2.5 border outline-none transition-all",
                  isDark
                    ? "bg-white/[0.03] border-white/10 text-white placeholder:text-gray-600 focus:border-purple-500/40 focus:bg-white/[0.05]"
                    : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-purple-300 focus:bg-white"
                )}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="px-3 py-2.5 rounded-xl text-white transition-all disabled:opacity-30 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ━━ NOVA AVATAR ━━
          The physical body — always visible, always alive */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? `Close ${NAME}` : `Open ${NAME}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative flex-shrink-0 group"
        initial={{ opacity: 0, scale: 0, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          delay: 0.4,
        }}
      >
        {/* Ambient glow ring */}
        <motion.div
          className="absolute inset-[-10px] rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(6,182,212,0.12) 50%, transparent 70%)",
            filter: "blur(10px)",
          }}
          animate={{
            scale:
              mood === "thinking" ? [1, 1.5, 1] : [1, 1.25, 1],
            opacity:
              mood === "thinking"
                ? [0.7, 0.25, 0.7]
                : [0.5, 0.15, 0.5],
          }}
          transition={{
            duration: mood === "thinking" ? 0.9 : 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Orbiting particles */}
        <NovaParticles />

        {/* Avatar body */}
        <motion.div
          animate={
            mood === "thinking"
              ? { rotate: [0, 4, -4, 0] }
              : mood === "speaking"
                ? { scale: [1, 1.05, 1] }
                : { y: [0, -3, 0] }
          }
          transition={{
            duration:
              mood === "thinking"
                ? 0.7
                : mood === "speaking"
                  ? 0.5
                  : 3.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={cn(
            "relative rounded-full flex items-center justify-center border-2 transition-colors",
            isMobile ? "w-12 h-12" : "w-14 h-14",
            isDark
              ? "bg-[#0d1120] border-purple-500/30 group-hover:border-purple-400/50"
              : "bg-white border-purple-300/50 group-hover:border-purple-400/70"
          )}
          style={{
            boxShadow: isDark
              ? "0 0 24px rgba(139,92,246,0.15), 0 0 48px rgba(6,182,212,0.06)"
              : "0 4px 24px rgba(139,92,246,0.12), 0 0 40px rgba(6,182,212,0.05)",
          }}
        >
          <NovaFace mood={mood} size={isMobile ? 30 : 36} />
        </motion.div>

        {/* Notification dot */}
        {!open &&
          messages.length > 0 &&
          messages[messages.length - 1]?.role === "nova" && (
            <motion.span
              className={cn(
                "absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-purple-500",
                isDark
                  ? "border-2 border-[#0d1120]"
                  : "border-2 border-white"
              )}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
      </motion.button>
    </div>
  );
}
