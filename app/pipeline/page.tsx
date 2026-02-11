"use client";

import { useState, useCallback } from "react";
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
} from "lucide-react";
import type {
  ParsedResume,
  ScoringResult,
  ScreeningQuestion,
  PipelineState,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "google/gemini-2.0-flash-001", name: "Gemini 2.0 Flash", speed: "Fast" },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", speed: "Fast" },
  { id: "openai/gpt-4o", name: "GPT-4o", speed: "Balanced" },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", speed: "Balanced" },
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

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
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
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="8"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-3xl font-bold"
          style={{ color }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-[var(--text-muted)]">/ 100</span>
      </div>
    </div>
  );
}

function LoadingState({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 gap-6"
    >
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
        </div>
        <div className="absolute -inset-2 rounded-2xl bg-purple-500/10 animate-ping" />
      </div>
      <div>
        <p className="text-lg font-medium text-center">{message}</p>
        <div className="flex justify-center gap-1.5 mt-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 loading-dot" />
          <div className="w-2 h-2 rounded-full bg-blue-400 loading-dot" />
          <div className="w-2 h-2 rounded-full bg-cyan-400 loading-dot" />
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
  }

  const selectedModel = MODELS.find((m) => m.id === model)!;

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-x-0 border-t-0 rounded-none px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-4 h-4 text-[var(--text-muted)]" />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">TalentFlow</span>
            <span className="text-purple-400 text-sm font-mono">AI</span>
          </Link>

          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 px-4 py-2 glass-card hover:border-purple-500/30 transition-all text-sm"
            >
              <Brain className="w-4 h-4 text-purple-400" />
              <span>{selectedModel.name}</span>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
            </button>
            {showModelDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 glass-card-solid p-2 shadow-xl z-50">
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setModel(m.id);
                      setShowModelDropdown(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center",
                      model === m.id
                        ? "bg-purple-500/20 text-purple-300"
                        : "hover:bg-white/5 text-[var(--text-secondary)]"
                    )}
                  >
                    <span>{m.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{m.speed}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-28 pb-20">
        {/* Progress steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const isActive = i === currentStepIndex;
              const isDone = i < currentStepIndex;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      opacity: isDone || isActive ? 1 : 0.4,
                    }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      isActive && "bg-purple-500/20 text-purple-300 border border-purple-500/40",
                      isDone && "bg-green-500/20 text-green-300 border border-green-500/40",
                      !isActive && !isDone && "text-[var(--text-muted)]"
                    )}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <s.icon className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">{s.label}</span>
                  </motion.div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-8 h-0.5 rounded",
                        isDone ? "bg-green-500/50" : "bg-[var(--border)]"
                      )}
                    />
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
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-red-300 text-sm flex-1">{state.error}</p>
              <button onClick={() => setState((s) => ({ ...s, error: undefined }))}>
                <X className="w-4 h-4 text-red-400" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* STEP 1: Upload */}
          {state.step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-2 text-center">Upload Resume</h2>
                <p className="text-[var(--text-secondary)] text-center mb-8">
                  Drop a PDF or TXT resume to start the AI pipeline
                </p>

                <div
                  {...getRootProps()}
                  className={cn(
                    "glass-card-solid p-12 cursor-pointer transition-all duration-300 text-center group",
                    isDragActive
                      ? "border-purple-500/50 glow-purple"
                      : "hover:border-purple-500/30"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-purple-400" />
                  </div>
                  {file ? (
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-green-400" />
                        <span className="font-medium text-green-300">{file.name}</span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">
                        {(file.size / 1024).toFixed(1)} KB — Click or drop to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">
                        {isDragActive
                          ? "Drop the file here..."
                          : "Drag & drop a resume here"}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        PDF or TXT • Max 10MB
                      </p>
                    </div>
                  )}
                </div>

                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex justify-center"
                  >
                    <button
                      onClick={handleParse}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40"
                    >
                      <Brain className="w-5 h-5" />
                      Parse with AI
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 2: Parsing */}
          {state.step === "parsing" && (
            <motion.div
              key="parsing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState message="AI is parsing the resume..." />
            </motion.div>
          )}

          {/* STEP 3: Parsed Results + JD Input + Score */}
          {(state.step === "parsed" || state.step === "scoring") && parsedResume && (
            <motion.div
              key="parsed"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Parsed Resume */}
                <div className="glass-card-solid p-6 overflow-hidden">
                  <div className="flex items-center gap-2 mb-6">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold">Parsed Resume</h3>
                  </div>

                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {/* Contact */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-purple-400" />
                        <span className="font-medium">{parsedResume.name}</span>
                      </div>
                      {parsedResume.email && (
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{parsedResume.email}</span>
                        </div>
                      )}
                      {parsedResume.phone && (
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{parsedResume.phone}</span>
                        </div>
                      )}
                      {parsedResume.location && (
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{parsedResume.location}</span>
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    {parsedResume.summary && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
                          Summary
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                          {parsedResume.summary}
                        </p>
                      </div>
                    )}

                    {/* Skills */}
                    {parsedResume.skills.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2">
                          Skills
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedResume.skills.map((skill, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20"
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
                        <div className="flex items-center gap-1.5 mb-2">
                          <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                            Experience
                          </p>
                        </div>
                        <div className="space-y-3">
                          {parsedResume.experience.map((exp, i) => (
                            <div key={i} className="pl-3 border-l-2 border-blue-500/30">
                              <p className="font-medium text-sm">{exp.title}</p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {exp.company} • {exp.duration}
                              </p>
                              {exp.highlights.length > 0 && (
                                <ul className="mt-1 space-y-0.5">
                                  {exp.highlights.map((h, j) => (
                                    <li
                                      key={j}
                                      className="text-xs text-[var(--text-secondary)] flex gap-1"
                                    >
                                      <span className="text-blue-400 mt-0.5">•</span>
                                      {h}
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
                        <div className="flex items-center gap-1.5 mb-2">
                          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                            Education
                          </p>
                        </div>
                        {parsedResume.education.map((edu, i) => (
                          <div key={i} className="pl-3 border-l-2 border-cyan-500/30">
                            <p className="text-sm font-medium">{edu.degree}</p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {edu.institution} • {edu.year}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Certs */}
                    {parsedResume.certifications.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Award className="w-3.5 h-3.5 text-amber-400" />
                          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                            Certifications
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {parsedResume.certifications.map((cert, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 text-xs rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Job Description + Score Button */}
                <div className="space-y-6">
                  <div className="glass-card-solid p-6">
                    <h3 className="text-lg font-semibold mb-4">Job Description</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-3">
                      Paste the job description to score this candidate against.
                    </p>
                    <textarea
                      value={jobDescription}
                      onChange={(e) => setJobDescription(e.target.value)}
                      placeholder="Paste the job description here..."
                      className="w-full h-48 bg-black/30 border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500/50 resize-none"
                    />
                    <button
                      onClick={() => setJobDescription(SAMPLE_JD)}
                      className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Load sample JD (WeAssist AI Engineer)
                    </button>
                  </div>

                  {state.step === "scoring" ? (
                    <LoadingState message="Scoring candidate..." />
                  ) : (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleScore}
                      disabled={!jobDescription.trim()}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all text-lg",
                        jobDescription.trim()
                          ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-500/20"
                          : "bg-[var(--bg-card)] text-[var(--text-muted)] cursor-not-allowed"
                      )}
                    >
                      <BarChart3 className="w-5 h-5" />
                      Score Candidate
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Scoring Results + Generate Questions */}
          {(state.step === "scored" || state.step === "generating") && scoring && (
            <motion.div
              key="scored"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score overview */}
                <div className="glass-card-solid p-6 flex flex-col items-center justify-center">
                  <h3 className="text-lg font-semibold mb-4">Match Score</h3>
                  <ScoreRing score={scoring.overallScore} />
                  <div className="mt-4">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        scoring.recommendation === "strong_match"
                          ? "bg-green-500/20 text-green-300"
                          : scoring.recommendation === "potential_match"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-red-500/20 text-red-300"
                      )}
                    >
                      {scoring.recommendation === "strong_match"
                        ? "Strong Match"
                        : scoring.recommendation === "potential_match"
                        ? "Potential Match"
                        : "Weak Match"}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-4 text-center leading-relaxed">
                    {scoring.summary}
                  </p>
                </div>

                {/* Score breakdown */}
                <div className="glass-card-solid p-6">
                  <h3 className="text-lg font-semibold mb-4">Breakdown</h3>
                  <div className="space-y-3">
                    {scoring.breakdown.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span>{item.category}</span>
                          <span className="font-mono text-[var(--text-muted)]">
                            {item.score}/{item.maxScore}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(item.score / item.maxScore) * 100}%`,
                            }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className={cn(
                              "h-full rounded-full",
                              item.score / item.maxScore >= 0.8
                                ? "bg-green-500"
                                : item.score / item.maxScore >= 0.6
                                ? "bg-amber-500"
                                : "bg-red-500"
                            )}
                          />
                        </div>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {item.reasoning}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Gaps */}
                <div className="space-y-6">
                  <div className="glass-card-solid p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <h3 className="font-semibold">Strengths</h3>
                    </div>
                    <ul className="space-y-2">
                      {scoring.strengths.map((s, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-sm text-[var(--text-secondary)] flex gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                          {s}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <div className="glass-card-solid p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingDown className="w-4 h-4 text-amber-400" />
                      <h3 className="font-semibold">Gaps</h3>
                    </div>
                    <ul className="space-y-2">
                      {scoring.gaps.map((g, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="text-sm text-[var(--text-secondary)] flex gap-2"
                        >
                          <Target className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          {g}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {state.step === "generating" ? (
                    <LoadingState message="Generating questions..." />
                  ) : (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleGenerateQuestions}
                      className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-semibold hover:from-green-500 hover:to-emerald-500 transition-all shadow-lg shadow-green-500/20 text-lg"
                    >
                      <MessageSquareText className="w-5 h-5" />
                      Generate Screening Questions
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Complete — Questions */}
          {state.step === "complete" && questions.length > 0 && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-300 border border-green-500/30 mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    Pipeline Complete
                  </div>
                  <h2 className="text-2xl font-bold">
                    Screening Questions for {parsedResume?.name}
                  </h2>
                  {scoring && (
                    <p className="text-[var(--text-secondary)] mt-2">
                      Match Score:{" "}
                      <span
                        className={cn(
                          "font-bold",
                          scoring.overallScore >= 80
                            ? "text-green-400"
                            : scoring.overallScore >= 60
                            ? "text-amber-400"
                            : "text-red-400"
                        )}
                      >
                        {scoring.overallScore}/100
                      </span>
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {questions.map((q, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="glass-card-solid p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold",
                            q.difficulty === "easy"
                              ? "bg-green-500/20 text-green-400"
                              : q.difficulty === "medium"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          )}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-xs font-medium uppercase",
                                q.difficulty === "easy"
                                  ? "bg-green-500/10 text-green-400"
                                  : q.difficulty === "medium"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-red-500/10 text-red-400"
                              )}
                            >
                              {q.difficulty}
                            </span>
                          </div>
                          <p className="font-medium mb-3">{q.question}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                              <div className="flex items-center gap-1.5 mb-1">
                                <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs font-medium text-blue-400">
                                  Purpose
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {q.purpose}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/10">
                              <div className="flex items-center gap-1.5 mb-1">
                                <Target className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-xs font-medium text-green-400">
                                  Look For
                                </span>
                              </div>
                              <p className="text-xs text-[var(--text-secondary)]">
                                {q.lookFor}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex justify-center">
                  <button
                    onClick={resetPipeline}
                    className="flex items-center gap-2 px-6 py-3 glass-card hover:border-purple-500/30 transition-all font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Process Another Resume
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
