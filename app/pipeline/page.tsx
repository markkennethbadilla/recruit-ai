"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  ClipboardList,
  Sun,
  Moon,
  Mic,
  Database,
  Workflow,
  Volume2,
  ExternalLink,
  Globe,
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
import { openPrintReport } from "@/lib/print-report";
import { JD_TEMPLATES } from "@/lib/jd-templates";
import { useTheme } from "@/lib/theme";
import { PageTips, TipsToggle, usePageTips } from "@/lib/tips";
import { getRecruiterIdentity, setRecruiterIdentity, type RecruiterIdentity } from "@/lib/recruiter-identity";

// Free models shown in UI (matching portfolio setup)
const MODELS = [
  { id: "auto", name: "Auto (Smart)", speed: "Picks best available" },
  { id: "meta-llama/llama-3.3-70b-instruct:free", name: "Llama 3.3 70B", speed: "Best" },
  { id: "google/gemma-3-27b-it:free", name: "Gemma 3 27B", speed: "Fast" },
  { id: "mistralai/mistral-small-3.1-24b-instruct:free", name: "Mistral Small 3.1", speed: "Balanced" },
  { id: "qwen/qwen3-32b:free", name: "Qwen3 32B", speed: "Fast" },
  { id: "microsoft/phi-4-reasoning-plus:free", name: "Phi-4 Reasoning", speed: "Balanced" },
  { id: "nousresearch/deephermes-3-llama-3-8b-preview:free", name: "DeepHermes 8B", speed: "Fast" },
];

// Paid fallback (not user-selectable, used automatically on rate limits)
export const FALLBACK_MODEL = "openai/gpt-4o-mini";

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
  { id: "summary", label: "Summary", icon: ClipboardList, color: "amber" },
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
      className="flex flex-col items-center justify-center py-10 sm:py-14 md:py-16 gap-5 sm:gap-6"
    >
      <div className="relative">
        <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center shadow-lg shadow-purple-500/10">
          <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-purple-400 animate-spin" />
        </div>
        <div className="absolute -inset-4 rounded-3xl bg-purple-500/5 animate-ping" />
      </div>
      <div className="text-center space-y-4">
        <p className="text-base sm:text-lg md:text-xl font-medium text-[var(--text-primary)]">{message}</p>
        <div className="flex justify-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-400 loading-dot" />
          <div className="w-2.5 h-2.5 rounded-full bg-blue-400 loading-dot" />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 loading-dot" />
        </div>
      </div>
    </motion.div>
  );
}

// Integration result types for pipeline summary
interface IntegrationResults {
  airtable: { success: boolean; recordId?: string; error?: string } | null;
  n8n: { connected: boolean; outreach?: boolean } | null;
  kokoro: { success: boolean; audioBase64?: string; contentType?: string; characterCount?: number; charsRemaining?: number } | null;
  email: { success: boolean; messageId?: string; error?: string } | null;
  voiceScript?: string;
  emailPrompt?: string;
  emailBody?: string;
  tone?: string;
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
  const abortRef = useRef<AbortController | null>(null);
  const [copied, setCopied] = useState(false);
  const [integrationResults, setIntegrationResults] = useState<IntegrationResults | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [rateLimitedModels, setRateLimitedModels] = useState<string[]>([]);
  const { theme, toggleTheme } = useTheme();
  const pipelineTips = usePageTips("pipeline");
  const [recruiter, setRecruiter] = useState<RecruiterIdentity | null>(null);
  const [showRecruiterModal, setShowRecruiterModal] = useState(false);
  const [recruiterForm, setRecruiterForm] = useState({ name: "", email: "" });

  useEffect(() => {
    setHistory(getHistory());
    const stored = getRecruiterIdentity();
    if (stored) {
      setRecruiter(stored);
      setRecruiterForm(stored);
    }
  }, []);

  // Poll rate-limited model status every 30s
  useEffect(() => {
    async function checkModels() {
      try {
        const res = await fetch("/api/models/status");
        if (res.ok) {
          const data = await res.json();
          setRateLimitedModels(data.rateLimited || []);
        }
      } catch { /* ignore */ }
    }
    checkModels();
    const interval = setInterval(checkModels, 30000);
    return () => clearInterval(interval);
  }, []);

  function refreshHistory() {
    setHistory(getHistory());
  }

  // Resolve "auto" model to the first non-rate-limited free model
  function resolveModel(): string {
    if (model !== "auto") return model;
    const freeModels = MODELS.filter(m => m.id !== "auto" && !rateLimitedModels.includes(m.id));
    return freeModels.length > 0 ? freeModels[0].id : "meta-llama/llama-3.3-70b-instruct:free";
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
      : state.step === "generating" || state.step === "complete"
      ? 3
      : 4; // summary

  // Track the highest step ever reached for forward navigation
  const highestReached = questions.length > 0 && scoring ? 4
    : questions.length > 0 ? 3
    : scoring ? 2
    : parsedResume ? 1
    : 0;

  function navigateToStep(stepIndex: number) {
    if (stepIndex === currentStepIndex) return;
    if (stepIndex > highestReached) return; // can't go to steps not yet completed
    switch (stepIndex) {
      case 0:
        resetPipeline();
        break;
      case 1:
        if (parsedResume) setState({ step: "parsed", parsedResume, resumeText: state.resumeText });
        break;
      case 2:
        if (scoring) setState((s) => ({ ...s, step: "scored", scoring }));
        break;
      case 3:
        if (questions.length > 0) setState((s) => ({ ...s, step: "complete", screeningQuestions: questions }));
        break;
      case 4:
        if (questions.length > 0 && scoring) setState((s) => ({ ...s, step: "summary" }));
        break;
    }
  }

  async function handleParse() {
    if (!file) return;
    setState({ step: "parsing" });

    try {
      const resolvedModel = resolveModel();
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("model", resolvedModel);

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
        body: JSON.stringify({ parsedResume, jobDescription, model: resolveModel() }),
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
          model: resolveModel(),
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
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setFile(null);
    setParsedResume(null);
    setScoring(null);
    setQuestions([]);
    setJobDescription("");
    setState({ step: "upload" });
    setAutoPilot(false);
    setAutoPilotStatus("");
    setIntegrationResults(null);
    if (audioUrl) { URL.revokeObjectURL(audioUrl); setAudioUrl(null); }
  }

  // Cancel autopilot entirely
  function cancelAutoPilot() {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setAutoPilot(false);
    setAutoPilotStatus("");
    // Keep whatever state we're at so the user can see progress
    if (!parsedResume) {
      setState({ step: "upload" });
    } else if (!scoring) {
      setState({ step: "parsed", parsedResume });
    } else if (questions.length === 0) {
      setState({ step: "scored", scoring, parsedResume });
    } else {
      setState({ step: "complete", screeningQuestions: questions, scoring, parsedResume });
    }
  }

  // Cancel current step (go back one step)
  function cancelStep() {
    const step = state.step;
    if (step === "parsing") {
      setState({ step: "upload" });
    } else if (step === "parsed" || step === "scoring") {
      setState({ step: "upload" });
      setParsedResume(null);
    } else if (step === "scored" || step === "generating") {
      setState({ step: "parsed", parsedResume: parsedResume! });
      setScoring(null);
    } else if (step === "complete") {
      setState({ step: "scored", scoring: scoring!, parsedResume: parsedResume! });
      setQuestions([]);
    } else if (step === "summary") {
      setState({ step: "complete", screeningQuestions: questions, scoring: scoring ?? undefined, parsedResume: parsedResume! });
    }
  }

  // Auto-pilot: run entire pipeline in one click
  async function handleFullPipeline() {
    if (!file || !jobDescription.trim()) return;
    const controller = new AbortController();
    abortRef.current = controller;
    setAutoPilot(true);

    try {
      // Step 1: Parse
      setAutoPilotStatus("Parsing resume...");
      setState({ step: "parsing" });
      const formData = new FormData();
      const resolvedModel = resolveModel();
      formData.append("resume", file);
      formData.append("model", resolvedModel);
      const parseRes = await fetch("/api/parse-resume", { method: "POST", body: formData, signal: controller.signal });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error);
      const parsed = parseData.parsed;
      setParsedResume(parsed);

      // Step 2: Score
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      setAutoPilotStatus("Scoring candidate fit...");
      setState({ step: "scoring", parsedResume: parsed, resumeText: parseData.rawText });
      const scoreRes = await fetch("/api/score-candidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedResume: parsed, jobDescription, model: resolvedModel }),
        signal: controller.signal,
      });
      const scoreData = await scoreRes.json();
      if (!scoreRes.ok) throw new Error(scoreData.error);
      const scoringResult = scoreData.scoring;
      setScoring(scoringResult);

      // Step 3: Generate Questions
      if (controller.signal.aborted) throw new DOMException("Aborted", "AbortError");
      setAutoPilotStatus("Generating interview questions...");
      setState((s) => ({ ...s, step: "generating" }));
      const qRes = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parsedResume: parsed, jobDescription, scoringResult, model: resolvedModel }),
        signal: controller.signal,
      });
      const qData = await qRes.json();
      if (!qRes.ok) throw new Error(qData.error);
      setQuestions(qData.questions);
      // Move past "generating" so the score view stops showing "Drafting interview guide..."
      setState((s) => ({ ...s, step: "complete" }));

      // Save to history
      saveToHistory({
        name: parsed.name || "Unknown",
        email: parsed.email || "",
        model: resolvedModel,
        jobTitle: jobDescription.split("\n")[0].substring(0, 60),
        score: scoringResult.overallScore,
        recommendation: scoringResult.recommendation,
        parsedResume: parsed,
        scoring: scoringResult,
        questions: qData.questions,
        jobDescription,
      });
      refreshHistory();

      // Fire n8n + NocoDB + Kokoro integrations (AWAIT results for demo visibility)
      setAutoPilotStatus("Syncing integrations...");
      const candidatePayload = {
        name: parsed.name,
        email: parsed.email,
        phone: parsed.phone,
        score: scoringResult.overallScore,
        recommendation: scoringResult.recommendation,
        skills: parsed.skills,
        experience: parsed.experience,
        education: parsed.education,
        jobTitle: jobDescription.split("\n")[0].substring(0, 60),
        model: resolvedModel,
        processedAt: new Date().toISOString(),
      };

      // Run all integrations in parallel and AWAIT results
      const [syncRes, outreachRes] = await Promise.allSettled([
        // WF3 + AirTable: Sync candidate data
        fetch("/api/n8n/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidatePayload),
        }).then(r => r.json()).catch(() => ({ success: false, error: "Sync failed" })),
        // WF2 + Kokoro: Generate outreach + voice
        fetch("/api/n8n/outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateName: parsed.name || "Unknown",
            candidateEmail: parsed.email || "",
            overallScore: scoringResult.overallScore,
            strengths: scoringResult.strengths || [],
            gaps: scoringResult.gaps || [],
            jobTitle: jobDescription.split("\n")[0].substring(0, 60),
            companyName: "WeAssist",
            recruiterName: recruiter?.name || "",
            recruiterEmail: recruiter?.email || "",
          }),
        }).then(r => r.json()).catch(() => ({ success: false, error: "Outreach failed" })),
      ]);

      // Build integration results for summary display
      const syncData = syncRes.status === "fulfilled" ? syncRes.value : null;
      const outreachData = outreachRes.status === "fulfilled" ? outreachRes.value : null;

      const results: IntegrationResults = {
        airtable: syncData ? { success: syncData.airtable?.success || false, recordId: syncData.airtable?.recordId, error: syncData.airtable?.error } : null,
        n8n: { connected: (syncData?.n8n?.connected || false) || (outreachData?.n8nConnected || false), outreach: outreachData?.success || false },
        kokoro: outreachData?.voiceAudio ? {
          success: true,
          audioBase64: outreachData.voiceAudio.base64,
          contentType: outreachData.voiceAudio.contentType,
          characterCount: outreachData.voiceAudio.characterCount,
          charsRemaining: outreachData.kokoroUsage?.remaining,
        } : { success: outreachData?.kokoroConnected || false },
        email: outreachData?.emailSent || null,
        voiceScript: outreachData?.voiceScript,
        emailPrompt: outreachData?.emailPrompt,
        emailBody: outreachData?.emailBody,
        tone: outreachData?.tone,
      };
      setIntegrationResults(results);

      // Create audio URL for playback if voice was generated
      if (outreachData?.voiceAudio?.base64) {
        const binaryStr = atob(outreachData.voiceAudio.base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const blob = new Blob([bytes], { type: outreachData.voiceAudio.contentType || "audio/mpeg" });
        setAudioUrl(URL.createObjectURL(blob));
      }

      setAutoPilotStatus("Complete!");
      // Autopilot done — go directly to summary
      setState({ step: "summary", screeningQuestions: qData.questions, scoring: scoringResult, parsedResume: parsed });
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // User cancelled — don't show error, cancelAutoPilot already handled state
        return;
      }
      const message = err instanceof Error ? err.message : "Pipeline failed";
      setState({ step: "upload", error: message });
    }
    abortRef.current = null;
    setAutoPilot(false);
  }

  function handleExportPDF() {
    if (!parsedResume) return;
    openPrintReport({ parsedResume, scoring, questions, jobDescription, model: selectedModel.name });
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
    <div className="min-h-screen pb-6 sm:pb-10 selection:bg-purple-500/30 overflow-x-hidden">
      <div className="gradient-bg opacity-50" />
      
      {/* Floating Controls */}
      <div className="fixed top-3 sm:top-4 left-3 sm:left-5 z-50">
        <Link href="/" className="glass-chip flex items-center gap-2 px-3 py-2 rounded-xl transition-all group hover:scale-105">
          <ArrowLeft className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors" />
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="font-semibold text-sm hidden sm:inline">TalentFlow</span>
        </Link>
      </div>
      <div className="fixed top-3 sm:top-4 right-3 sm:right-5 z-50 flex items-center gap-1 sm:gap-2">
        <TipsToggle />
        {/* Recruiter Identity */}
        <div className="relative">
          <button
            onClick={() => setShowRecruiterModal(!showRecruiterModal)}
            className={cn(
              "glass-chip flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl transition-all hover:scale-105 group text-sm",
              recruiter ? "ring-1 ring-emerald-500/40" : "ring-1 ring-amber-500/40"
            )}
            title={recruiter ? `Signed in as ${recruiter.name}` : "Set your identity"}
          >
            <User className={cn(
              "w-4 h-4 transition-colors",
              recruiter ? "text-emerald-400 group-hover:text-emerald-300" : "text-amber-400 group-hover:text-amber-300"
            )} />
            <span className="hidden sm:inline text-xs truncate max-w-[80px]">
              {recruiter ? recruiter.name.split(" ")[0] : "Who are you?"}
            </span>
          </button>
          <AnimatePresence>
            {showRecruiterModal && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-72 glass-card-solid p-4 shadow-xl z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Your Identity</h3>
                  <button onClick={() => setShowRecruiterModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mb-3">
                  Outreach emails will use your name and reply-to your email.
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Your name"
                      value={recruiterForm.name}
                      onChange={(e) => setRecruiterForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <input
                      type="email"
                      placeholder="Your email"
                      value={recruiterForm.email}
                      onChange={(e) => setRecruiterForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      if (recruiterForm.name.trim() && recruiterForm.email.includes("@")) {
                        const identity = { name: recruiterForm.name.trim(), email: recruiterForm.email.trim() };
                        setRecruiterIdentity(identity);
                        setRecruiter(identity);
                        setShowRecruiterModal(false);
                      }
                    }}
                    disabled={!recruiterForm.name.trim() || !recruiterForm.email.includes("@")}
                    className="flex-1 py-2 text-xs font-medium rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    {recruiter ? "Update" : "Save"}
                  </button>
                  {recruiter && (
                    <button
                      onClick={() => {
                        setRecruiter(null);
                        setRecruiterForm({ name: "", email: "" });
                        localStorage.removeItem("talentflow-recruiter");
                        setShowRecruiterModal(false);
                      }}
                      className="px-3 py-2 text-xs font-medium rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {recruiter && (
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Emails will reply to {recruiter.email}</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Link
          href="/automations"
          className="glass-chip flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-xl transition-all hover:scale-105 group text-sm"
          title="Automations Dashboard"
        >
          <Zap className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          <span className="hidden sm:inline text-xs">Automations</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="glass-chip p-2 sm:p-2.5 rounded-xl transition-all hover:scale-105 group"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[var(--text-muted)] group-hover:text-yellow-300 transition-colors" />
          ) : (
            <Moon className="w-4 h-4 text-[var(--text-muted)] group-hover:text-purple-400 transition-colors" />
          )}
        </button>
        <button
          onClick={() => { setShowHistory(!showHistory); refreshHistory(); }}
          className="glass-chip relative p-2 sm:p-2.5 rounded-xl transition-all hover:scale-105 group"
          title="History"
        >
          <History className="w-4 h-4 text-[var(--text-muted)] group-hover:text-purple-300 transition-colors" />
          {history.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {history.length}
            </span>
          )}
        </button>
        <div className="relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="glass-chip flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 rounded-xl transition-all hover:scale-105 text-sm group"
          >
            <Brain className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
            <span className="hidden sm:inline text-xs">{selectedModel.name}</span>
            <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform duration-300 ${showModelDropdown ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showModelDropdown && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-64 glass-card-solid p-2 shadow-xl z-50 overflow-hidden"
              >
                {MODELS.map((m) => {
                  const isRateLimited = m.id !== "auto" && rateLimitedModels.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        if (!isRateLimited) {
                          setModel(m.id);
                          setShowModelDropdown(false);
                        }
                      }}
                      disabled={isRateLimited}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg text-sm flex justify-between items-center transition-colors",
                        model === m.id
                          ? "bg-purple-500/20 text-purple-300"
                          : isRateLimited
                          ? "opacity-30 cursor-not-allowed text-[var(--text-muted)]"
                          : "hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <span className="font-medium text-xs">{m.name}</span>
                      <span className="text-[10px] text-[var(--text-muted)] opacity-70">
                        {isRateLimited ? "rate limited" : m.speed}
                      </span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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
                            <p className="font-semibold text-sm text-[var(--text-primary)] truncate max-w-[200px]">{entry.name}</p>
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-14 sm:pt-16">
        <div className={cn("items-start", pipelineTips.length > 0 ? "flex gap-6" : "")}>
          {/* Main content */}
          <div className={pipelineTips.length > 0 ? "flex-1 min-w-0" : ""}>
        {/* Progress steps */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <div className="flex items-center bg-[var(--glass)] p-1 sm:p-2.5 rounded-full border border-[var(--glass-border)] backdrop-blur-md overflow-hidden max-w-full">
            {steps.map((s, i) => {
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              const isReachable = i <= highestReached && i !== currentStepIndex;
              const isLight = theme === "light";
              return (
                <div key={s.id} className="flex items-center min-w-0 flex-shrink">
                  <motion.div
                    animate={{
                      backgroundColor: isActive ? "rgba(139, 92, 246, 0.2)" : isDone ? "rgba(16, 185, 129, 0.2)" : (i <= highestReached && i > currentStepIndex) ? "rgba(139, 92, 246, 0.08)" : "transparent",
                      color: isActive ? (isLight ? "#7c3aed" : "#d8b4fe") : isDone ? (isLight ? "#059669" : "#6ee7b7") : (i <= highestReached && i > currentStepIndex) ? (isLight ? "#7c3aed" : "#a78bfa") : (isLight ? "#475569" : "#64748b"),
                    }}
                    className={cn(
                      "flex items-center gap-1 sm:gap-2.5 px-2 sm:px-6 py-1.5 sm:py-3 rounded-full text-[10px] sm:text-sm font-medium transition-all duration-300 min-w-0 flex-shrink",
                      isReachable && "cursor-pointer hover:scale-105 hover:brightness-125"
                    )}
                    onClick={() => isReachable && navigateToStep(i)}
                    title={isReachable ? `Go to ${s.label}` : undefined}
                  >
                    <s.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className={cn("transition-opacity truncate", isActive ? "opacity-100" : "opacity-60 hidden md:inline")}>
                      {s.label}
                    </span>
                  </motion.div>
                  {i < steps.length - 1 && (
                    <div className="w-2 sm:w-8 h-px bg-[var(--glass-border)] mx-0 sm:mx-1 flex-shrink" />
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
              <div className="text-center mb-4 sm:mb-5">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-secondary)] bg-clip-text text-transparent">Upload Candidate Resume</h2>
                <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed px-2 sm:px-0">
                  Supports PDF and TXT formats. AI will parse details automatically.
                </p>
              </div>

              <div
                {...getRootProps()}
                className={cn(
                  "relative glass-card p-6 sm:p-8 md:p-10 cursor-pointer transition-all duration-300 text-center group overflow-hidden",
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
                      <p className="text-lg sm:text-xl font-medium mb-2 sm:mb-3 text-[var(--text-primary)]">
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
                              <p className="text-sm font-semibold text-[var(--text-primary)]">Auto-Pilot Mode</p>
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
              className="flex flex-col items-center"
            >
              <LoadingState message="Extracting candidate intelligence..." />
              <button
                onClick={cancelStep}
                className="mt-2 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
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
              <div className="text-center mb-4 sm:mb-5">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">Auto-Pilot Running</h2>
                <p className="text-[var(--text-secondary)]">Full pipeline executing automatically</p>
              </div>
              <div className="glass-card p-5 sm:p-6 space-y-4 sm:space-y-5 mb-6">
                {["Parsing resume...", "Scoring candidate fit...", "Generating interview questions...", "Syncing integrations...", "Complete!"].map((label, i) => {
                  const isActive = autoPilotStatus === label;
                  const isDone = ["Parsing resume...", "Scoring candidate fit...", "Generating interview questions...", "Syncing integrations...", "Complete!"].indexOf(autoPilotStatus) > i;
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
                        isDone ? "text-green-400" : isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                      )}>{label}</span>
                    </div>
                  );
                })}
                {/* Cancel Autopilot */}
                {autoPilotStatus !== "Complete!" && (
                  <div className="pt-2 border-t border-white/5">
                    <button
                      onClick={cancelAutoPilot}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500/30 transition-all"
                    >
                      <X className="w-4 h-4" />
                      Cancel Pipeline
                    </button>
                  </div>
                )}
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
              <div className="glass-card overflow-hidden flex flex-col">
                <div className="p-4 sm:p-6 border-b border-[var(--border)] bg-white/[0.02] flex justify-between items-center gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300 shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">{parsedResume.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">Candidate Profile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="px-3 py-1 bg-green-500/10 text-green-400 text-xs font-medium rounded-full border border-green-500/20">
                      Parsed Successfully
                    </div>
                    <button
                      onClick={cancelStep}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Back to upload"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
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
                            <h5 className="font-semibold text-[var(--text-primary)]">{exp.title}</h5>
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
                            <p className="text-sm font-medium text-[var(--text-primary)]">{edu.degree}</p>
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
              <div className="flex flex-col gap-4 sm:gap-5">
                <div className="glass-card p-4 sm:p-6 flex flex-col">
                  <div className="pb-4 mb-4 border-b border-[var(--border)]">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">Target Job Description</h3>
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
                  <div className="relative min-h-[250px]">
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste job title, responsibilities, and requirements here..."
                      className="w-full h-full min-h-[250px] bg-white/[0.02] border-0 rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-1 focus:ring-purple-500/50 resize-none leading-relaxed transition-all"
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
                  <div className="glass-card p-8 flex flex-col items-center justify-center">
                    <LoadingState message="Calculating 6-axis fit score..." />
                    <button
                      onClick={cancelStep}
                      className="mt-2 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                      Cancel
                    </button>
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
              className="space-y-4 sm:space-y-6"
            >
              {/* Back button */}
              <div className="flex items-center">
                <button
                  onClick={cancelStep}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back to Resume</span>
                  <span className="sm:hidden">Back</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Score overview - Large Card */}
              <div className="glass-card p-5 sm:p-6 md:p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent transition-opacity group-hover:from-purple-500/10" />
                 
                <h3 className="text-sm font-bold mb-4 sm:mb-5 text-[var(--text-secondary)] uppercase tracking-wider">Overall Fit Score</h3>
                <div className="mb-4 sm:mb-5 scale-100 sm:scale-110">
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
                        <span className="font-medium text-[var(--text-primary)]">{item.category}</span>
                        <span className="font-mono text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
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
                  <div className="glass-card p-4 flex flex-col items-center">
                     <LoadingState message="Drafting interview guide..." />
                     <button
                       onClick={cancelStep}
                       className="mt-2 flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 transition-all"
                     >
                       <X className="w-3.5 h-3.5" />
                       Cancel
                     </button>
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
              </div>
            </motion.div>
          )}

           {/* STEP 5: Questions */}
           {state.step === "complete" && questions.length > 0 && (
              <motion.div
                key="questions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={cancelStep}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Score</span>
                    <span className="sm:hidden">Back</span>
                  </button>
                </div>
                <div className="text-center mb-4 sm:mb-5">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">Tailored Interview Guide</h2>
                  <p className="text-[var(--text-secondary)] text-sm sm:text-base">Based on the candidate's specific profile and gaps.</p>
                  <div className="flex items-center justify-center gap-2 sm:gap-3 mt-3 sm:mt-4 flex-wrap">
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
                      className={cn(
                        "glass-card p-4 sm:p-5 md:p-6 border-l-4",
                        q.difficulty === "hard" ? "border-l-red-500" : q.difficulty === "medium" ? "border-l-amber-500" : "border-l-green-500"
                      )}
                    >
                      <div className="flex justify-between items-start mb-4">
                         <span className={cn(
                           "px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider",
                           q.difficulty === "hard" ? "bg-red-500/10 text-red-400" : q.difficulty === "medium" ? "bg-amber-500/10 text-amber-400" : "bg-green-500/10 text-green-400"
                         )}>
                           {q.difficulty}
                         </span>
                         <span className="text-xs text-[var(--text-muted)] font-mono px-2 py-1">Q{i+1}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-medium text-[var(--text-primary)] mb-3 sm:mb-4 leading-relaxed">{q.question}</h3>
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
                
                <div className="mt-6 sm:mt-8 text-center pb-6 sm:pb-10 flex flex-col items-center gap-4">
                   <motion.button
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     onClick={() => setState((s) => ({ ...s, step: "summary" }))}
                     className="flex items-center gap-2 sm:gap-3 px-7 py-3.5 sm:px-10 sm:py-4 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full font-bold text-white hover:from-amber-500 hover:to-orange-500 transition-all shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-105 text-sm sm:text-base"
                   >
                     <ClipboardList className="w-5 h-5" />
                     View Summary
                     <ArrowRight className="w-5 h-5" />
                   </motion.button>
                </div>
              </motion.div>
           )}

           {/* STEP 6: Summary - Combined Score + Questions Overview */}
           {state.step === "summary" && scoring && questions.length > 0 && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto"
              >
                <div className="text-center mb-5 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">Candidate Summary</h2>
                  <p className="text-[var(--text-secondary)] text-sm sm:text-base">Complete analysis overview — click sections to review details.</p>
                </div>

                {/* Score Summary Card - Clickable */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setState((s) => ({ ...s, step: "scored" }))}
                  className="glass-card p-5 sm:p-6 md:p-8 mb-4 sm:mb-6 cursor-pointer hover:border-purple-500/30 hover:bg-white/[0.03] transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg text-purple-300">
                        <BarChart3 className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">Score Results</h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] group-hover:text-purple-300 transition-colors">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <div className="scale-75 sm:scale-90">
                      <ScoreRing score={scoring.overallScore} size={120} />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border",
                        scoring.recommendation === "strong_match"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : scoring.recommendation === "potential_match"
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      )}>
                        {scoring.recommendation === "strong_match" && <CheckCircle2 className="w-3 h-3" />}
                        {scoring.recommendation === "strong_match"
                          ? "STRONGLY RECOMMENDED"
                          : scoring.recommendation === "potential_match"
                          ? "POTENTIAL MATCH"
                          : "NOT RECOMMENDED"}
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">{scoring.summary}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {scoring.breakdown.slice(0, 4).map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-xs">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              item.score >= 8 ? "bg-green-400" : item.score >= 5 ? "bg-amber-400" : "bg-red-400"
                            )} />
                            <span className="text-[var(--text-muted)]">{item.category}</span>
                            <span className="font-mono font-semibold text-[var(--text-primary)]">{item.score}/{item.maxScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Questions Summary Card - Clickable */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  onClick={() => setState((s) => ({ ...s, step: "complete" }))}
                  className="glass-card p-5 sm:p-6 md:p-8 mb-4 sm:mb-6 cursor-pointer hover:border-green-500/30 hover:bg-white/[0.03] transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-500/20 rounded-lg text-green-300">
                        <MessageSquareText className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">Interview Questions</h3>
                      <span className="text-xs bg-white/5 px-2 py-0.5 rounded-full text-[var(--text-muted)]">{questions.length} questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] group-hover:text-green-300 transition-colors">
                      <span>View all</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {questions.slice(0, 3).map((q, i) => (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5">
                        <span className="text-xs font-mono text-[var(--text-muted)] mt-0.5">Q{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--text-primary)] truncate">{q.question}</p>
                          <span className={cn(
                            "text-[10px] font-bold uppercase mt-1 inline-block",
                            q.difficulty === "hard" ? "text-red-400" : q.difficulty === "medium" ? "text-amber-400" : "text-green-400"
                          )}>{q.difficulty}</span>
                        </div>
                      </div>
                    ))}
                    {questions.length > 3 && (
                      <p className="text-xs text-[var(--text-muted)] text-center pt-1">+ {questions.length - 3} more questions</p>
                    )}
                  </div>
                </motion.div>

                {/* Strengths & Gaps Quick View */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8"
                >
                  <div className="glass-card p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <h4 className="font-bold text-sm">Key Strengths</h4>
                    </div>
                    <ul className="space-y-2">
                      {scoring.strengths.slice(0, 3).map((s, i) => (
                        <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-2 leading-relaxed">
                          <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="glass-card p-5 sm:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-4 h-4 text-amber-400" />
                      <h4 className="font-bold text-sm">Potential Gaps</h4>
                    </div>
                    <ul className="space-y-2">
                      {scoring.gaps.slice(0, 3).map((g, i) => (
                        <li key={i} className="text-xs text-[var(--text-secondary)] flex gap-2 leading-relaxed">
                          <Target className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>

                {/* Live Integration Results - Demo Section */}
                {integrationResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6 sm:mb-8"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-300">
                        <Globe className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">Live Integration Results</h3>
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                      </span>
                    </div>

                    {/* Integration Status Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                      {/* n8n Status */}
                      <div className={cn(
                        "glass-card p-4 border-l-2",
                        integrationResults.n8n?.connected ? "border-l-purple-500" : "border-l-gray-500"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <Workflow className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-semibold text-[var(--text-primary)]">n8n Orchestration</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {integrationResults.n8n?.connected ? (
                            <><CheckCircle2 className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400">Connected</span></>
                          ) : (
                            <><AlertCircle className="w-3 h-3 text-gray-500" /><span className="text-xs text-gray-400">Offline</span></>
                          )}
                        </div>
                        {integrationResults.n8n?.outreach && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-1">Outreach webhook fired</p>
                        )}
                      </div>

                      {/* NocoDB Status */}
                      <div className={cn(
                        "glass-card p-4 border-l-2",
                        integrationResults.airtable?.success ? "border-l-emerald-500" : "border-l-gray-500"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <Database className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-semibold text-[var(--text-primary)]">NocoDB CRM</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {integrationResults.airtable?.success ? (
                            <><CheckCircle2 className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400">Synced</span></>
                          ) : (
                            <><AlertCircle className="w-3 h-3 text-amber-400" /><span className="text-xs text-amber-400">{integrationResults.airtable?.error || "Not synced"}</span></>
                          )}
                        </div>
                        {integrationResults.airtable?.recordId && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono">ID: {integrationResults.airtable.recordId}</p>
                        )}
                      </div>

                      {/* Kokoro TTS Status */}
                      <div className={cn(
                        "glass-card p-4 border-l-2",
                        integrationResults.kokoro?.success ? "border-l-cyan-500" : "border-l-gray-500"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <Mic className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-semibold text-[var(--text-primary)]">Kokoro Voice AI</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {integrationResults.kokoro?.audioBase64 ? (
                            <><CheckCircle2 className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400">Audio Generated</span></>
                          ) : integrationResults.kokoro?.success ? (
                            <><CheckCircle2 className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400">Connected</span></>
                          ) : (
                            <><AlertCircle className="w-3 h-3 text-gray-500" /><span className="text-xs text-gray-400">Unavailable</span></>
                          )}
                        </div>
                        {integrationResults.kokoro?.characterCount && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-1">{integrationResults.kokoro.characterCount} chars | tts.elunari.uk</p>
                        )}
                      </div>

                      {/* Email Delivery Status */}
                      <div className={cn(
                        "glass-card p-4 border-l-2",
                        integrationResults.email?.success ? "border-l-green-500" : integrationResults.emailBody ? "border-l-amber-500" : "border-l-gray-500"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="w-4 h-4 text-green-400" />
                          <span className="text-sm font-semibold text-[var(--text-primary)]">Email Outreach</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {integrationResults.email?.success ? (
                            <><CheckCircle2 className="w-3 h-3 text-green-400" /><span className="text-xs text-green-400">Sent</span></>
                          ) : integrationResults.emailBody ? (
                            <><AlertCircle className="w-3 h-3 text-amber-400" /><span className="text-xs text-amber-400">Generated (not sent)</span></>
                          ) : (
                            <><AlertCircle className="w-3 h-3 text-gray-500" /><span className="text-xs text-gray-400">Not configured</span></>
                          )}
                        </div>
                        {integrationResults.email?.messageId && (
                          <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono truncate">ID: {integrationResults.email.messageId}</p>
                        )}
                        {integrationResults.email?.error && (
                          <p className="text-[10px] text-amber-400 mt-1">{integrationResults.email.error}</p>
                        )}
                      </div>
                    </div>

                    {/* Voice Outreach Card */}
                    {(integrationResults.voiceScript || integrationResults.emailBody || integrationResults.emailPrompt) && (
                      <div className="glass-card p-5 sm:p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Zap className="w-4 h-4 text-orange-400" />
                          <h4 className="font-bold text-sm">Generated Outreach Content</h4>
                          {integrationResults.tone && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">{integrationResults.tone}</span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Generated Email */}
                          {integrationResults.emailBody ? (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Mail className="w-3 h-3 text-purple-400" />
                                <span className="text-xs font-medium text-[var(--text-muted)]">Email {integrationResults.email?.success ? "(Sent)" : "(Generated)"}</span>
                              </div>
                              <div className={cn("text-xs leading-relaxed p-3 rounded-lg max-h-40 overflow-auto whitespace-pre-wrap", theme === 'dark' ? "bg-black/30 text-gray-300" : "bg-gray-50 text-gray-600")}>
                                {integrationResults.emailBody}
                              </div>
                            </div>
                          ) : integrationResults.emailPrompt && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Mail className="w-3 h-3 text-purple-400" />
                                <span className="text-xs font-medium text-[var(--text-muted)]">Email Prompt</span>
                              </div>
                              <div className={cn("text-xs leading-relaxed p-3 rounded-lg max-h-32 overflow-auto", theme === 'dark' ? "bg-black/30 text-gray-300" : "bg-gray-50 text-gray-600")}>
                                {integrationResults.emailPrompt.substring(0, 500)}
                                {integrationResults.emailPrompt.length > 500 && "..."}
                              </div>
                            </div>
                          )}

                          {/* Voice Script + Player */}
                          {integrationResults.voiceScript && (
                            <div>
                              <div className="flex items-center gap-1.5 mb-2">
                                <Volume2 className="w-3 h-3 text-cyan-400" />
                                <span className="text-xs font-medium text-[var(--text-muted)]">Voice Script (Kokoro)</span>
                                {audioUrl && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Audio Ready</span>
                                )}
                              </div>
                              <div className={cn("text-xs leading-relaxed p-3 rounded-lg max-h-24 overflow-auto", theme === 'dark' ? "bg-black/30 text-gray-300" : "bg-gray-50 text-gray-600")}>
                                {integrationResults.voiceScript}
                              </div>
                              {audioUrl && (
                                <div className="mt-3 flex items-center gap-2">
                                  <audio controls src={audioUrl} className="w-full h-8 rounded" style={{ filter: theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'none' }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pb-6 sm:pb-10">
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-bold text-white hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/20 hover:scale-105 text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export Full Report
                  </button>
                  <button
                    onClick={copyQuestionsToClipboard}
                    className="flex items-center gap-2 px-6 py-3 glass-card-solid hover:border-green-500/30 transition-all text-sm font-medium text-[var(--text-secondary)] hover:text-white rounded-full"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy Questions"}
                  </button>
                  <button
                    onClick={resetPipeline}
                    className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/10 hover:bg-white/5 transition-all text-sm font-medium"
                  >
                    Start New Candidate
                  </button>
                </div>
              </motion.div>
           )}
        </AnimatePresence>
          </div>
          {/* Right: Tips sidebar on desktop */}
          {pipelineTips.length > 0 && (
            <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 self-start sticky top-20 pr-1">
              <PageTips page="pipeline" />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
