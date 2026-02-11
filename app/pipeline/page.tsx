"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import Link from "next/link";
import {
  Upload,
  Brain,
  BarChart3,
  MessageSquareText,
  ArrowRight,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Award,
  Target,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Zap,
  Download,
  Clock,
  History,
  Trash2,
  Copy,
  Check,
  Play,
  LayoutTemplate,
} from "lucide-react";
import type {
  ParsedResume,
  ScoringResult,
  ScreeningQuestion,
  PipelineState,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getHistory, saveToHistory, deleteFromHistory, clearHistory, type HistoryEntry } from "@/lib/candidate-history";
import { exportPDFReport } from "@/lib/pdf-export";
import { JD_TEMPLATES } from "@/lib/jd-templates";

const MODELS = [
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", speed: "Fast" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", speed: "Fast" },
  { id: "openai/gpt-4o", name: "GPT-4o", speed: "Balanced" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", speed: "Balanced" },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", speed: "Thinking..." },
];

const SAMPLE_JD = `AI Engineer — WeAssist.io (Internal)

Key Responsibilities:
- Design, implement, and optimize automations using n8n, Make.com, and Zapier
- Build reliable integrations across Microsoft 365, Google Workspace, Slack/Teams, WhatsApp, CRMs
- Develop AI-driven workflows such as transcription pipelines, chatbots, meeting assistants
- Leverage APIs like OpenAI, Claude, ElevenLabs
- Fine-tune, prompt, and optimize LLMs for task-specific use cases
- Create and maintain data dashboards and automated reporting pipelines
- Deploy and manage AI models in production with monitoring and performance tuning
- Document workflows, integrations, and automations

Key Qualifications:
- 2+ years workflow automation (n8n, Make.com, Zapier, Power Automate)
- API integration (REST, OAuth 2.0, webhooks, JSON)
- AI/LLM APIs (OpenAI, Claude, ElevenLabs, transcription/voice tools)
- Strong analytical and troubleshooting skills
- Excellent communication skills
- Programming in Python and/or Node.js

Tech Stack: n8n, Make.com, Zapier, OpenAI, Claude, AirTable, HubSpot, Slack, Python, Node.js, GitHub`;

const steps = [
  { id: "upload", label: "Upload", icon: Upload, color: "purple" },
  { id: "parse", label: "Parse", icon: Brain, color: "blue" },
  { id: "score", label: "Score", icon: BarChart3, color: "cyan" },
  { id: "questions", label: "Questions", icon: MessageSquareText, color: "green" },
];

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "#10b981"
      : score >= 60
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Glow behind */}
      <div 
        className="absolute inset-0 rounded-full blur-xl opacity-20"
        style={{ backgroundColor: color }} 
      />
      
      <svg width={size} height={size} className="-rotate-90 relative z-10">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="10"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center z-20">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="text-4xl font-bold tracking-tight"
          style={{ color }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider">/ 100</span>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 sm:py-24 md:py-32 gap-6 sm:gap-8"
    >
      <div className="relative">
        <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-400 animate-spin" />
        </div>
        <div className="absolute -inset-4 rounded-3xl bg-purple-500/5 animate-ping" />
      </div>
      <div className="text-center space-y-4">
        <p className="text-base sm:text-lg md:text-xl font-medium text-white">{message}</p>
        <div className="flex justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 loading-dot" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 loading-dot" />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 loading-dot" />
        </div>
      </div>
    </motion.div>
  );
}

export default function PipelinePage() {
  const [state, setState] = useState<PipelineState>({ step: "upload" });
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState(MODELS[0].id);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [scoring, setScoring] = useState<ScoringResult | null>(null);
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [autoPilot, setAutoPilot] = useState(false);
  const [autoPilotStatus, setAutoPilotStatus] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  function refreshHistory() {
    setHistory(getHistory());
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const currentStepIndex =
    state.step === "upload"
      ? 0
      : state.step === "parsing" || state.step === "parsed"
      ? 1
      : state.step === "scoring" || state.step === "scored"
      ? 2
      : 3;

  async function handleParse() {
    if (!file) return;
    setState({ step: "parsing" });

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("model", model);

      const res = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setParsedResume(data.parsed);
      setState({ step: "parsed", parsedResume: data.parsed, resumeText: data.rawText });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Parse failed";
      setState({ step: "upload", error: message });
    }
  }

  async function handleScore() {
    if (!parsedResume || !jobDescription) return;
    setState((s) => ({ ...s, step: "scoring" }));

    try {
      const res = await fetch("/api/score-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedResume, jobDescription, model }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setScoring(data.scoring);
      setState((s) => ({ ...s, step: "scored", scoring: data.scoring }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Scoring failed";
      setState((s) => ({ ...s, step: "parsed", error: message }));
    }
  }

  async function handleGenerateQuestions() {
    if (!parsedResume || !jobDescription) return;
    setState((s) => ({ ...s, step: "generating" }));

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parsedResume,
          jobDescription,
          scoringResult: scoring,
          model,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setQuestions(data.questions);
      setState((s) => ({ ...s, step: "complete", screeningQuestions: data.questions }));

      // Save to history
      if (parsedResume) {
        saveToHistory({
          name: parsedResume.name || "Unknown",
          email: parsedResume.email || "",
          model,
          jobTitle: jobDescription.split("\n")[0].substring(0, 60),
          score: scoring?.overallScore ?? null,
          recommendation: scoring?.recommendation ?? null,
          parsedResume,
          scoring,
          questions: data.questions,
          jobDescription,
        });
        refreshHistory();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Question generation failed";
      setState((s) => ({ ...s, step: "scored", error: message }));
    }
  }

  function resetPipeline() {
    setFile(null);
    setParsedResume(null);
    setScoring(null);
    setQuestions([]);
    setJobDescription("");
    setState({ step: "upload" });
    setAutoPilot(false);
    setAutoPilotStatus("");
  }

  // Auto-pilot: run entire pipeline in one click
  async function handleFullPipeline() {
    if (!file || !jobDescription.trim()) return;
    setAutoPilot(true);

    try {
      // Step 1: Parse
      setAutoPilotStatus("Parsing resume...");
      setState({ step: "parsing" });
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("model", model);
      const parseRes = await fetch("/api/parse-resume", { method: "POST", body: formData });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error);
      const parsed = parseData.parsed;
      setParsedResume(parsed);

      // Step 2: Score
      setAutoPilotStatus("Scoring candidate fit...");
      setState({ step: "scoring", parsedResume: parsed, resumeText: parseData.rawText });
      const scoreRes = await fetch("/api/score-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedResume: parsed, jobDescription, model }),
      });
      const scoreData = await scoreRes.json();
      if (!scoreRes.ok) throw new Error(scoreData.error);
      const scoringResult = scoreData.scoring;
      setScoring(scoringResult);

      // Step 3: Generate Questions
      setAutoPilotStatus("Generating interview questions...");
      setState((s) => ({ ...s, step: "generating" }));
      const qRes = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedResume: parsed, jobDescription, scoringResult, model }),
      });
      const qData = await qRes.json();
      if (!qRes.ok) throw new Error(qData.error);
      setQuestions(qData.questions);
      setState({ step: "complete", screeningQuestions: qData.questions, scoring: scoringResult, parsedResume: parsed });

      // Save to history
      saveToHistory({
        name: parsed.name || "Unknown",
        email: parsed.email || "",
        model,
        jobTitle: jobDescription.split("\n")[0].substring(0, 60),
        score: scoringResult.overallScore,
        recommendation: scoringResult.recommendation,
        parsedResume: parsed,
        scoring: scoringResult,
        questions: qData.questions,
        jobDescription,
      });
      refreshHistory();
      setAutoPilotStatus("Complete!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Pipeline failed";
      setState({ step: "upload", error: message });
    }
    setAutoPilot(false);
  }

  function handleExportPDF() {
    if (!parsedResume) return;
    exportPDFReport({ parsedResume, scoring, questions, jobDescription, model: selectedModel.name });
  }

  function loadHistoryEntry(entry: HistoryEntry) {
    setParsedResume(entry.parsedResume);
    setScoring(entry.scoring);
    setQuestions(entry.questions);
    setJobDescription(entry.jobDescription);
    setModel(MODELS.find((m) => m.id === entry.model)?.id || MODELS[0].id);
    if (entry.questions.length > 0) {
      setState({ step: "complete", screeningQuestions: entry.questions, scoring: entry.scoring ?? undefined, parsedResume: entry.parsedResume });
    } else if (entry.scoring) {
      setState({ step: "scored", scoring: entry.scoring, parsedResume: entry.parsedResume });
    } else {
      setState({ step: "parsed", parsedResume: entry.parsedResume });
    }
    setShowHistory(false);
  }

  async function copyQuestionsToClipboard() {
    if (questions.length === 0) return;
    const text = questions.map((q, i) =>
      `Q${i + 1} [${q.difficulty.toUpperCase()}]: ${q.question}\nPurpose: ${q.purpose}\nLook for: ${q.lookFor}`
    ).join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedModel = MODELS.find((m) => m.id === model)!;

  return (
    <div className="min-h-screen pb-10 sm:pb-20 selection:bg-purple-500/30">
      <div className="gradient-bg opacity-50" />
      
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-3 sm:px-6 py-3 sm:py-5 transition-all duration-300">
        <div className="max-w-7xl mx-auto">
          <div className="glass-card px-3 sm:px-5 md:px-8 py-3 sm:py-4 flex items-center justify-between" style={{ background: 'rgba(15, 16, 22, 0.85)', backdropFilter: 'blur(20px)' }}>
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
              <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="w-4 h-4 text-[var(--text-muted)] group-hover:text-white" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg">TalentFlow</span>
              </div>
            </Link>

            {/* Model selector + History */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setShowHistory(!showHistory); refreshHistory(); }}
                className="flex items-center gap-2 px-4 py-2.5 glass-card-solid hover:border-purple-500/30 transition-all text-sm group relative"
              >
                <History className="w-4 h-4 text-[var(--text-muted)] group-hover:text-purple-300" />
                <span className="hidden sm:inline">History</span>
                {history.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {history.length}
                  </span>
                )}
              </button>
              <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-3 px-5 py-2.5 glass-card-solid hover:border-purple-500/30 transition-all text-sm group"
              >
                <Brain className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
                <span className="hidden sm:inline">{selectedModel.name}</span>
                <span className="sm:hidden text-xs">{selectedModel.name.split(' ')[0]}</span>
                <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-300 ${showModelDropdown ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showModelDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-72 glass-card-solid p-3 shadow-xl z-50 overflow-hidden"
                  >
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setModel(m.id);
                          setShowModelDropdown(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl text-sm flex justify-between items-center transition-colors",
                          model === m.id
                            ? "bg-purple-500/20 text-purple-300"
                            : "hover:bg-white/5 text-[var(--text-secondary)] hover:text-white"
                        )}
                      >
                        <span className="font-medium">{m.name}</span>
                        <span className="text-xs text-[var(--text-muted)] opacity-70">{m.speed}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </div>
          </div>
        </div>
      </nav>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[340px] sm:w-[400px] max-w-[90vw] bg-[var(--bg-secondary)] border-l border-white/10 z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Analysis History</h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{history.length} candidate{history.length !== 1 ? "s" : ""} analyzed</p>
                </div>
                <div className="flex items-center gap-2">
                  {history.length > 0 && (
                    <button
                      onClick={() => { clearHistory(); refreshHistory(); }}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-[var(--text-muted)] hover:text-red-400"
                      title="Clear all history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <History className="w-12 h-12 text-[var(--text-muted)] mb-4 opacity-50" />
                    <p className="text-[var(--text-muted)] text-sm">No analyses yet</p>
                    <p className="text-[var(--text-muted)] text-xs mt-1">Completed analyses will appear here</p>
                  </div>
                ) : (
                  history.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-purple-500/20 transition-all group cursor-pointer"
                      onClick={() => loadHistoryEntry(entry)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-white truncate max-w-[200px]">{entry.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">
                              {new Date(entry.analyzedAt).toLocaleDateString()} {new Date(entry.analyzedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        {entry.score !== null && (
                          <span className={cn(
                            "text-sm font-bold px-2 py-0.5 rounded-md",
                            entry.score >= 80 ? "bg-green-500/10 text-green-400" :
                            entry.score >= 60 ? "bg-amber-500/10 text-amber-400" :
                            "bg-red-500/10 text-red-400"
                          )}>
                            {entry.score}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-muted)] truncate">{entry.jobTitle}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          entry.recommendation === "strong_match" ? "bg-green-500/10 text-green-400" :
                          entry.recommendation === "potential_match" ? "bg-amber-500/10 text-amber-400" :
                          entry.recommendation ? "bg-red-500/10 text-red-400" : "bg-white/5 text-[var(--text-muted)]"
                        )}>
                          {entry.recommendation === "strong_match" ? "Strong Match" :
                           entry.recommendation === "potential_match" ? "Potential" :
                           entry.recommendation === "weak_match" ? "Weak" : "—"}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteFromHistory(entry.id); refreshHistory(); }}
                          className="ml-auto p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded transition-all text-[var(--text-muted)] hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-24 sm:pt-32 md:pt-40">
        {/* Progress steps */}
        <div className="flex justify-center mb-8 sm:mb-12 md:mb-16">
          <div className="flex items-center bg-white/5 p-1.5 sm:p-2.5 rounded-full border border-white/5 backdrop-blur-md overflow-x-auto max-w-full">
            {steps.map((s, i) => {
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              return (
                <div key={s.id} className="flex items-center">
                  <motion.div
                    animate={{
                      backgroundColor: isActive ? "rgba(139, 92, 246, 0.2)" : isDone ? "rgba(16, 185, 129, 0.2)" : "transparent",
                      color: isActive ? "#d8b4fe" : isDone ? "#6ee7b7" : "#64748b",
                    }}
                    className={cn(
                      "flex items-center gap-1.5 sm:gap-2.5 px-3 sm:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all duration-300",
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <s.icon className="w-4 h-4" />
                    )}
                    <span className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-60 hidden md:inline")}>
                      {s.label}
                    </span>
                  </motion.div>
                  {i < steps.length - 1 && (
                    <div className="w-4 sm:w-8 h-px bg-white/10 mx-0.5 sm:mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error toast */}
        <AnimatePresence>
          {state.error && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <p className="text-red-200 text-sm flex-1 font-medium">{state.error}</p>
                <button 
                  onClick={() => setState((s) => ({ ...s, error: undefined }))}
                  className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* STEP 1: Upload */}
          {state.step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-6 sm:mb-8 md:mb-12">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-5 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Upload Candidate Resume</h2>
                <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed px-2 sm:px-0">
                  Supports PDF and TXT formats. AI will parse details automatically.
                </p>
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  "relative glass-card p-8 sm:p-12 md:p-16 cursor-pointer transition-all duration-300 text-center group overflow-hidden",
                  isDragActive
                    ? "border-purple-500/50 shadow-[0_0_50px_rgba(168,85,247,0.2)] bg-purple-500/5"
                    : "hover:border-purple-500/30 hover:bg-white/[0.02]"
                )}
              >
                <input {...getInputProps()} />
                
                {/* Background pulse effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-5 sm:mb-8 transition-all duration-500 shadow-xl",
                    isDragActive ? "bg-purple-500 text-white scale-110" : "bg-purple-500/10 text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/20"
                  )}>
                    <Upload className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                  </div>
                  
                  {file ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                      <div className="flex items-center justify-center gap-3 mb-3 px-5 py-3 bg-green-500/10 rounded-xl inline-flex border border-green-500/20">
                        <FileText className="w-5 h-5 text-green-400" />
                        <span className="font-semibold text-green-300">{file.name}</span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">
                        {(file.size / 1024).toFixed(1)} KB — Click or drop to replace
                      </p>
                    </motion.div>
                  ) : (
                    <div className="text-center">
                      <p className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-white">
                        {isDragActive ? "Drop the resume here..." : "Drag & drop resume here"}
                      </p>
                      <p className="text-[var(--text-muted)]">
                        or click to browse files (Max 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-4">
                <AnimatePresence>
                  {file && (
                    <>
                      <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={handleParse}
                        className="flex items-center gap-2 sm:gap-3 px-7 py-3.5 sm:px-10 sm:py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-bold text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105 text-sm sm:text-base"
                      >
                        <Brain className="w-5 h-5" />
                        Analyze with AI
                        <ArrowRight className="w-5 h-5" />
                      </motion.button>

                      {/* Auto-pilot toggle */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <div className="h-px w-8 bg-white/10" />
                          <span>or</span>
                          <div className="h-px w-8 bg-white/10" />
                        </div>
                        <div className="glass-card p-4 max-w-md w-full space-y-3">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-1.5 bg-gradient-to-br from-purple-600/30 to-cyan-600/30 rounded-lg">
                              <Play className="w-3.5 h-3.5 text-cyan-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">Auto-Pilot Mode</p>
                              <p className="text-[10px] text-[var(--text-muted)]">Pick a JD template, then run the full pipeline</p>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {JD_TEMPLATES.slice(0, 3).map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setJobDescription(t.content)}
                                className={cn(
                                  "text-xs px-3 py-1.5 rounded-lg border transition-all",
                                  jobDescription === t.content
                                    ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                                    : "bg-white/5 border-white/10 text-[var(--text-secondary)] hover:bg-white/10"
                                )}
                              >
                                {t.icon} {t.title}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={handleFullPipeline}
                            disabled={!jobDescription.trim()}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all",
                              jobDescription.trim()
                                ? "bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:from-cyan-500 hover:to-purple-500 shadow-lg shadow-cyan-500/20"
                                : "bg-white/5 text-[var(--text-muted)] cursor-not-allowed"
                            )}
                          >
                            <Zap className="w-4 h-4" />
                            Run Full Pipeline
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Parsing / Auto-pilot */}
          {(state.step === "parsing" && !autoPilot) && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState message="Extracting candidate intelligence..." />
            </motion.div>
          )}

          {/* Auto-pilot progress */}
          {autoPilot && (
            <motion.div
              key="autopilot"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Auto-Pilot Running</h2>
                <p className="text-[var(--text-secondary)]">Full pipeline executing automatically</p>
              </div>
              <div className="glass-card p-6 sm:p-8 md:p-10 space-y-5 sm:space-y-8">
                {["Parsing resume...", "Scoring candidate fit...", "Generating interview questions...", "Complete!"].map((label, i) => {
                  const isActive = autoPilotStatus === label;
                  const isDone = ["Parsing resume...", "Scoring candidate fit...", "Generating interview questions...", "Complete!"].indexOf(autoPilotStatus) > i;
                  return (
                    <div key={label} className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
                        isDone ? "bg-green-500/20 text-green-400" :
                        isActive ? "bg-purple-500/20 text-purple-400" :
                        "bg-white/5 text-[var(--text-muted)]"
                      )}>
                        {isDone ? <CheckCircle2 className="w-5 h-5" /> :
                         isActive ? <Loader2 className="w-5 h-5 animate-spin" /> :
                         <div className="w-2 h-2 rounded-full bg-white/20" />}
                      </div>
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        isDone ? "text-green-400" : isActive ? "text-white" : "text-[var(--text-muted)]"
                      )}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Parsed Results + JD Input + Score */}
          {(state.step === "parsed" || state.step === "scoring") && parsedResume && (
            <motion.div
              key="parsed"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8"
            >
              {/* Left: Parsed Resume */}
              <div className="glass-card overflow-hidden flex flex-col h-auto max-h-[60vh] lg:h-[700px]">
                <div className="p-4 sm:p-6 border-b border-[var(--border)] bg-white/[0.02] flex justify-between items-center gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{parsedResume.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">Candidate Profile</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                    Parsed Successfully
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8 custom-scrollbar">
                  {/* Contact Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {parsedResume.email && (
                      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/5">
                        <Mail className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <span className="text-sm truncate">{parsedResume.email}</span>
                      </div>
                    )}
                    {parsedResume.phone && (
                      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/5">
                        <Phone className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <span className="text-sm truncate">{parsedResume.phone}</span>
                      </div>
                    )}
                    {parsedResume.location && (
                      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/5 border border-white/5 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                        <span className="text-sm truncate">{parsedResume.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  {parsedResume.summary && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Professional Summary
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed p-4 rounded-xl bg-white/[0.02] border border-white/5">
                        {parsedResume.summary}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {parsedResume.skills.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3 flex items-center gap-2">
                         <Zap className="w-3 h-3" /> Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {parsedResume.skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Experience */}
                  {parsedResume.experience.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3 flex items-center gap-2">
                        <Briefcase className="w-3 h-3" /> Experience
                      </h4>
                      <div className="space-y-4">
                        {parsedResume.experience.map((exp, i) => (
                          <div key={i} className="pl-5 border-l-2 border-white/10 relative">
                             <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500/50" />
                            <h5 className="font-semibold text-white">{exp.title}</h5>
                            <p className="text-xs text-blue-300 mb-2">
                              {exp.company} • {exp.duration}
                            </p>
                            {exp.highlights.length > 0 && (
                              <ul className="space-y-1.5">
                                {exp.highlights.map((h, j) => (
                                  <li key={j} className="text-xs text-[var(--text-secondary)] pl-4 relative flex">
                                    <span className="absolute left-0 top-1.5 w-1 h-1 bg-[var(--text-muted)] rounded-full" />
                                    <span className="opacity-90 leading-relaxed">{h}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Education */}
                  {parsedResume.education.length > 0 && (
                    <div>
                      <h4 className="text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-3 flex items-center gap-2">
                        <GraduationCap className="w-3 h-3" /> Education
                      </h4>
                      <div className="space-y-3">
                        {parsedResume.education.map((edu, i) => (
                          <div key={i} className="pl-5 border-l-2 border-white/10 relative">
                            <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-500/50" />
                            <p className="text-sm font-medium text-white">{edu.degree}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {edu.institution} • {edu.year}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Job Description + Score Button */}
              <div className="flex flex-col gap-4 sm:gap-6 h-auto lg:h-[700px]">
                <div className="glass-card p-4 sm:p-6 flex-1 flex flex-col">
                  <div className="pb-5 mb-5 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-white">Target Job Description</h3>
                      {/* JD Templates */}
                      <div className="relative">
                        <button
                          onClick={() => setShowTemplates(!showTemplates)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10 text-[var(--text-secondary)]"
                        >
                          <LayoutTemplate className="w-3 h-3" />
                          Templates
                          <ChevronDown className={cn("w-3 h-3 transition-transform", showTemplates && "rotate-180")} />
                        </button>
                        <AnimatePresence>
                          {showTemplates && (
                            <motion.div
                              initial={{ opacity: 0, y: 5, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              className="absolute right-0 top-full mt-2 w-56 glass-card-solid p-2 shadow-xl z-50"
                            >
                              {JD_TEMPLATES.map((t) => (
                                <button
                                  key={t.id}
                                  onClick={() => { setJobDescription(t.content); setShowTemplates(false); }}
                                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-white/5 transition-colors flex items-center gap-2"
                                >
                                  <span>{t.icon}</span>
                                  <span className="text-[var(--text-secondary)]">{t.title}</span>
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Paste a JD or pick a template to evaluate candidate fit.
                    </p>
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste job title, responsibilities, and requirements here..."
                      className="w-full h-full bg-white/[0.02] border-0 rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-1 focus:ring-purple-500/50 resize-none leading-relaxed transition-all"
                    />
                    {!jobDescription && (
                       <button
                       onClick={() => setJobDescription(SAMPLE_JD)}
                       className="absolute bottom-4 right-4 text-xs bg-purple-500/20 text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-500/30 transition-colors border border-purple-500/30 font-medium"
                     >
                       Load Sample JD
                     </button>
                    )}
                  </div>
                </div>

                {state.step === "scoring" ? (
                  <div className="glass-card p-8 flex items-center justify-center">
                    <LoadingState message="Calculating 6-axis fit score..." />
                  </div>
                ) : (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleScore}
                    disabled={!jobDescription.trim()}
                    className={cn(
                      "w-full flex items-center justify-center gap-2 sm:gap-3 px-6 py-4 sm:px-8 sm:py-6 rounded-2xl font-bold transition-all text-base sm:text-lg md:text-xl shadow-lg",
                      jobDescription.trim()
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-[1.02] active:scale-[0.98] text-white shadow-purple-500/20"
                        : "bg-white/5 text-[var(--text-muted)] cursor-not-allowed"
                    )}
                  >
                    <BarChart3 className="w-6 h-6" />
                    Score Candidate Match
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: Scoring Results + Generate Questions */}
          {(state.step === "scored" || state.step === "generating") && scoring && (
            <motion.div
              key="scored"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
            >
              {/* Score overview - Large Card */}
              <div className="glass-card p-6 sm:p-8 md:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent transition-opacity group-hover:from-purple-500/10" />
                 
                <h3 className="text-sm font-bold mb-5 sm:mb-8 text-[var(--text-secondary)] uppercase tracking-wider">Overall Fit Score</h3>
                <div className="mb-5 sm:mb-8 scale-100 sm:scale-110">
                   <ScoreRing score={scoring.overallScore} size={180} />
                </div>
                
                <div className="relative z-10 w-full">
                  <div
                    className={cn(
                      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border",
                      scoring.recommendation === "strong_match"
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : scoring.recommendation === "potential_match"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    )}
                  >   
                     {scoring.recommendation === "strong_match" && <CheckCircle2 className="w-4 h-4" />}
                    {scoring.recommendation === "strong_match"
                      ? "STRONGLY RECOMMENDED"
                      : scoring.recommendation === "potential_match"
                      ? "POTENTIAL MATCH"
                      : "NOT RECOMMENDED"}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed border-t border-white/10 pt-5 mt-4 px-2">
                    {scoring.summary}
                  </p>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="glass-card p-5 sm:p-6 md:p-8 flex flex-col">
                 <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-blue-400" /> Scoring Breakdown
                 </h3>
                <div className="space-y-4 sm:space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {scoring.breakdown.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group"
                    >
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-white">{item.category}</span>
                        <span className="font-mono text-[var(--text-muted)] group-hover:text-white transition-colors">
                          {item.score}/10
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(item.score / item.maxScore) * 100}%`,
                          }}
                          transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                            item.score >= 8
                              ? "bg-gradient-to-r from-green-500 to-emerald-400"
                              : item.score >= 5
                              ? "bg-gradient-to-r from-amber-500 to-orange-400"
                              : "bg-gradient-to-r from-red-500 to-pink-500"
                          )}
                        />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                        {item.reasoning}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Strengths & Gaps */}
              <div className="space-y-6 flex flex-col">
                <div className="glass-card p-5 sm:p-6 md:p-7 flex-1">
                  <div className="flex items-center gap-3 mb-5">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <h3 className="font-bold">Key Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {scoring.strengths.slice(0, 3).map((s, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="text-sm text-[var(--text-secondary)] flex gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        {s}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                <div className="glass-card p-5 sm:p-6 md:p-7 flex-1">
                  <div className="flex items-center gap-3 mb-5">
                    <TrendingDown className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold">Potential Gaps</h3>
                  </div>
                  <ul className="space-y-2">
                    {scoring.gaps.slice(0, 3).map((g, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="text-sm text-[var(--text-secondary)] flex gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors leading-relaxed"
                      >
                        <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        {g}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {state.step === "generating" ? (
                  <div className="glass-card p-4">
                     <LoadingState message="Drafting interview guide..." />
                  </div>
                ) : (
                  <div className="space-y-3 mt-auto">
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleGenerateQuestions}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 sm:px-8 sm:py-5 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl font-bold hover:from-emerald-500 hover:to-green-500 transition-all shadow-lg shadow-emerald-500/20 text-white hover:translate-y-[-2px]"
                    >
                      <MessageSquareText className="w-5 h-5" />
                      Generate Questions
                    </motion.button>
                    <button
                      onClick={handleExportPDF}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 glass-card-solid hover:border-purple-500/30 transition-all text-sm font-medium text-[var(--text-secondary)] hover:text-white rounded-xl"
                    >
                      <Download className="w-4 h-4" />
                      Export Score Report
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

           {/* STEP 5: Final Questions */}
           {state.step === "complete" && questions.length > 0 && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="text-center mb-6 sm:mb-8 md:mb-12">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3">Tailored Interview Guide</h2>
                  <p className="text-[var(--text-secondary)] text-base sm:text-lg">Based on the candidate's specific profile and gaps.</p>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 flex-wrap">
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 px-5 py-2.5 glass-card-solid hover:border-purple-500/30 transition-all text-sm font-medium text-[var(--text-secondary)] hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                    <button
                      onClick={copyQuestionsToClipboard}
                      className="flex items-center gap-2 px-5 py-2.5 glass-card-solid hover:border-green-500/30 transition-all text-sm font-medium text-[var(--text-secondary)] hover:text-white"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy Questions"}
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 sm:gap-6">
                  {questions.map((q, i) => (
                     <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card p-5 sm:p-6 md:p-8 border-l-4 border-l-purple-500"
                    >
                      <div className="flex justify-between items-start mb-4">
                         <span className="px-3 py-1.5 bg-purple-500/10 text-purple-300 text-xs font-bold rounded-lg uppercase tracking-wider">
                           {q.difficulty}
                         </span>
                         <span className="text-xs text-[var(--text-muted)] font-mono px-2 py-1">Q{i+1}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-white mb-3 sm:mb-4 leading-relaxed">{q.question}</h3>
                      <div className="space-y-3 mt-5 pt-5 border-t border-white/5">
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          <span className="text-purple-400 font-semibold">Purpose:</span> {q.purpose}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          <span className="text-green-400 font-semibold">Look for:</span> {q.lookFor}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-8 sm:mt-12 md:mt-16 text-center pb-10 sm:pb-20 flex flex-col items-center gap-4">
                   <button 
                     onClick={resetPipeline}
                     className="px-10 py-4 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-medium"
                   >
                     Start New Candidate
                   </button>
                </div>
              </motion.div>
           )}
        </AnimatePresence>
      </div>
    </div>
  );
}
