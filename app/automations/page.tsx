"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Zap,
  Activity,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Workflow,
  Send,
  Database,
  Shield,
  BarChart3,
  ExternalLink,
  Loader2,
  Sun,
  Moon,
  Mic,
  Mail,
  Bot,
  Play,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { PageTips, TipsToggle, usePageTips } from "@/lib/tips";
import dynamic from "next/dynamic";

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

interface WorkflowInfo {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface N8nStatus {
  connected: boolean;
  workflows: WorkflowInfo[];
  error?: string;
}

interface HealthData {
  status: string;
  uptime: string;
  timestamp: string;
  version: string;
  ai: {
    totalRequests: number;
    totalErrors: number;
    errorRate: string;
    avgLatencyMs: number;
    lastRequestAt: string | null;
    lastError: string | null;
  };
  n8n: {
    url: string;
    configured: boolean;
  };
}

interface OutreachResult {
  success: boolean;
  emailPrompt?: string;
  voiceScript?: string;
  tone?: string;
  voiceAudio?: {
    base64: string;
    contentType: string;
    characterCount: number;
  } | null;
  n8nConnected?: boolean;
  kokoroConnected?: boolean;
  kokoroUsage?: {
    used: number;
    limit: number;
    remaining: number;
  };
  error?: string;
}

interface SyncResult {
  success: boolean;
  n8n?: { connected: boolean };
  airtable?: { success: boolean; recordId?: string };
  record?: Record<string, unknown>;
  candidateId?: string;
  message?: string;
  error?: string;
}

interface KokoroStatus {
  success: boolean;
  connected: boolean;
  usage?: {
    characters_used: number;
    characters_limit: number;
    characters_remaining: number;
    can_generate: boolean;
  };
  voices?: { id: string; name: string; category: string }[];
}

interface AirTableStatus {
  success: boolean;
  records?: unknown[];
  total?: number;
}

interface ReportResult {
  success: boolean;
  report?: Record<string, unknown>;
  error?: string;
}

// Workflow descriptions for the dashboard
const WORKFLOW_META: Record<string, { description: string; icon: typeof Zap; color: string; bg: string }> = {
  "WF1: Candidate Intake Pipeline": {
    description: "Routes candidates by score, builds notifications for Slack/email, logs intake events",
    icon: Workflow,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  "WF2: Smart Outreach Generator": {
    description: "Generates personalized recruiting emails + Kokoro voice scripts based on candidate profile",
    icon: Send,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  "WF3: Candidate Data Sync": {
    description: "Transforms and pushes candidate data to NocoDB/CRM in flat record format",
    icon: Database,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  "WF4: Health Monitor & Alerts": {
    description: "Checks /api/health every 5 min, evaluates AI metrics, fires alerts on failures",
    icon: Shield,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  "WF5: Weekly Pipeline Report": {
    description: "Aggregates candidate batch data into analytics: top skills, gaps, qualification rates",
    icon: BarChart3,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
};


export default function AutomationsPage() {
  const { theme, toggleTheme } = useTheme();
  const autoTips = usePageTips("automations");
  const [n8nStatus, setN8nStatus] = useState<N8nStatus | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [kokoroStatus, setKokoroStatus] = useState<KokoroStatus | null>(null);
  const [airTableStatus, setAirTableStatus] = useState<AirTableStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testingWorkflow, setTestingWorkflow] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; data?: unknown; error?: string }>>({});
  const [outreachResult, setOutreachResult] = useState<OutreachResult | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const [n8nRes, healthRes, elevenRes, airtableRes] = await Promise.all([
        fetch("/api/n8n/status"),
        fetch("/api/health"),
        fetch("/api/elevenlabs/tts").catch(() => null),
        fetch("/api/airtable").catch(() => null),
      ]);
      const n8nData = await n8nRes.json();
      const healthData = await healthRes.json();
      setN8nStatus(n8nData);
      setHealth(healthData);
      if (elevenRes) setKokoroStatus(await elevenRes.json());
      if (airtableRes) setAirTableStatus(await airtableRes.json());
    } catch {
      setN8nStatus({ connected: false, workflows: [], error: "Failed to fetch status" });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();

    // Auto-reconnect: poll every 30s when any service is down, 60s when all connected
    const intervalId = setInterval(() => {
      fetchStatus();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchStatus]);

  async function testWorkflow(workflowName: string) {
    setTestingWorkflow(workflowName);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any;
      if (workflowName.includes("Intake")) {
        const res = await fetch("/api/n8n/outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateName: "Test Candidate",
            candidateEmail: "test@example.com",
            overallScore: 85,
            strengths: ["AI/ML expertise", "Strong communication"],
            gaps: ["Limited cloud experience"],
            jobTitle: "AI Engineer",
          }),
        });
        result = await res.json();
        // Use the intake test as outreach test since intake -> outreach is the flow
      } else if (workflowName.includes("Outreach")) {
        const res = await fetch("/api/n8n/outreach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateName: "Jane Smith",
            candidateEmail: "jane@example.com",
            overallScore: 92,
            strengths: ["Python expert", "n8n automation", "LLM fine-tuning"],
            gaps: ["No production Kubernetes"],
            jobTitle: "AI Engineer",
            companyName: "WeAssist",
          }),
        });
        result = await res.json();
        setOutreachResult(result);
      } else if (workflowName.includes("Sync")) {
        const res = await fetch("/api/n8n/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateName: "Test Candidate",
            candidateEmail: "test@example.com",
            parsedResume: {
              name: "Test Candidate",
              email: "test@example.com",
              skills: ["Python", "TypeScript", "n8n"],
              experience: [{ title: "Software Engineer", company: "Tech Co", duration: "2023-2025" }],
              education: [{ degree: "BS Computer Science", institution: "State University", year: "2023" }],
            },
            scoring: {
              overallScore: 78,
              recommendation: "potential_match",
              strengths: ["Strong technical skills"],
              gaps: ["Limited automation experience"],
              breakdown: [
                { category: "Technical Skills Match", score: 8, maxScore: 10 },
                { category: "Experience Level", score: 7, maxScore: 10 },
              ],
            },
            questions: [{ question: "Tell me about your automation experience", purpose: "Evaluate fit" }],
            jobTitle: "AI Engineer",
          }),
        });
        result = await res.json();
        setSyncResult(result);
      } else if (workflowName.includes("Report")) {
        const res = await fetch("/api/n8n/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            period: "This Week (Test)",
            candidates: [
              {
                parsedResume: { name: "Alice", skills: ["Python", "n8n", "React"] },
                scoring: { overallScore: 88, recommendation: "strong_match", strengths: ["AI expert"], gaps: ["No cloud"] },
              },
              {
                parsedResume: { name: "Bob", skills: ["JavaScript", "Python", "Docker"] },
                scoring: { overallScore: 72, recommendation: "potential_match", strengths: ["Full stack"], gaps: ["No AI experience"] },
              },
              {
                parsedResume: { name: "Carol", skills: ["Python", "Machine Learning"] },
                scoring: { overallScore: 55, recommendation: "weak_match", strengths: ["ML background"], gaps: ["No automation", "No web dev"] },
              },
            ],
          }),
        });
        result = await res.json();
        setReportResult(result);
      } else if (workflowName.includes("Health")) {
        const res = await fetch("/api/health");
        result = await res.json();
      }

      setTestResults((prev) => ({
        ...prev,
        [workflowName]: { success: true, data: result },
      }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [workflowName]: { success: false, error: err instanceof Error ? err.message : "Test failed" },
      }));
    }
    setTestingWorkflow(null);
  }

  const isDark = theme === "dark";

  return (
    <div className={cn("min-h-screen transition-colors duration-300", isDark ? "bg-[#0a0a0f]" : "bg-gray-50")}>
      {/* Header */}
      <header className={cn("border-b sticky top-0 z-50 backdrop-blur-xl", isDark ? "border-white/5 bg-[#0a0a0f]/80" : "border-gray-200 bg-white/80")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/pipeline" className={cn("p-2 rounded-lg transition-colors", isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600")}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className={cn("text-xl font-bold", isDark ? "text-white" : "text-gray-900")}>Automations</h1>
                <p className={cn("text-sm", isDark ? "text-gray-400" : "text-gray-500")}>n8n Workflow Orchestration</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <TipsToggle />
            <button onClick={fetchStatus} disabled={loading} className={cn("p-2 rounded-lg transition-all", isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600")}>
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
            <button onClick={toggleTheme} className={cn("p-2 rounded-lg transition-all", isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600")}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <a
              href="https://n8n.elunari.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all text-sm font-medium"
            >
              Open n8n Editor <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className={cn("items-start", autoTips.length > 0 ? "flex gap-6" : "")}>
          <div className={cn("space-y-8", autoTips.length > 0 ? "flex-1 min-w-0" : "")}>
        {/* Connection Status + Health + Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* n8n Connection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-xl border p-4", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200")}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className={cn("text-base font-semibold", isDark ? "text-white" : "text-gray-900")}>n8n Connection</h2>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              ) : n8nStatus?.connected ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Disconnected</span>
                </div>
              )}
            </div>
            {n8nStatus?.connected && (
              <div className="space-y-1">
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Active Workflows</span>
                  <span className="font-mono font-bold text-purple-400">{n8nStatus.workflows.filter((w) => w.active).length}</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Total Workflows</span>
                  <span className="font-mono">{n8nStatus.workflows.length}</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Endpoint</span>
                  <span className="font-mono">n8n.elunari.uk</span>
                </div>
              </div>
            )}
            {n8nStatus?.error && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-red-400">{n8nStatus.error}</p>
                <p className={cn("text-xs flex items-center gap-1", isDark ? "text-gray-500" : "text-gray-400")}>
                  <RefreshCw className="w-3 h-3 animate-spin" /> Auto-reconnecting every 30s
                </p>
              </div>
            )}
          </motion.div>

          {/* App Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn("rounded-xl border p-4", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200")}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className={cn("text-base font-semibold", isDark ? "text-white" : "text-gray-900")}>App Health</h2>
              {health?.status === "healthy" ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Healthy</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Unknown</span>
                </div>
              )}
            </div>
            {health && (
              <div className="space-y-1">
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Uptime</span>
                  <span className="font-mono">{health.uptime}</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>AI Requests</span>
                  <span className="font-mono">{health.ai.totalRequests}</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Error Rate</span>
                  <span className={cn("font-mono", health.ai.totalErrors > 0 ? "text-red-400" : "text-emerald-400")}>{health.ai.errorRate}</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Avg Latency</span>
                  <span className="font-mono">{health.ai.avgLatencyMs}ms</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Version</span>
                  <span className="font-mono">{health.version}</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* Kokoro Voice AI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("rounded-xl border p-4", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200")}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className={cn("text-base font-semibold", isDark ? "text-white" : "text-gray-900")}>Kokoro TTS</h2>
              {kokoroStatus?.connected ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>
            {kokoroStatus?.connected && kokoroStatus.usage ? (
              <div className="space-y-1">
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Voices Available</span>
                  <span className="font-mono text-purple-400">{kokoroStatus.voices?.length || 0}</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Model</span>
                  <span className="font-mono text-cyan-400">Kokoro-82M</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Host</span>
                  <span className="font-mono text-emerald-400">tts.elunari.uk</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className={cn("text-xs leading-relaxed", isDark ? "text-gray-500" : "text-gray-400")}>
                  Kokoro TTS is not reachable. Voice generation in WF2 will be skipped.
                </p>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Service</span>
                  <span className="font-mono">Kokoro-82M (T480 Server)</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Status</span>
                  <span className="font-mono text-amber-400">Check tts.elunari.uk</span>
                </div>
              </div>
            )}
          </motion.div>

          {/* NocoDB CRM */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn("rounded-xl border p-4", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200")}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className={cn("text-base font-semibold", isDark ? "text-white" : "text-gray-900")}>NocoDB</h2>
              {airTableStatus?.success ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Offline</span>
                </div>
              )}
            </div>
            {airTableStatus?.success ? (
              <div className="space-y-1">
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Records</span>
                  <span className="font-mono text-cyan-400">{airTableStatus.total || 0}</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Table</span>
                  <span className="font-mono">Candidates</span>
                </div>
                <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                  <span>Host</span>
                  <span className="font-mono">db.elunari.uk</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className={cn("text-xs leading-relaxed", isDark ? "text-gray-500" : "text-gray-400")}>
                  NocoDB is not reachable. Candidate sync (WF3) will queue locally until reconnected.
                </p>
                <div className="space-y-1">
                  <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                    <span>Table</span>
                    <span className="font-mono">Candidates</span>
                  </div>
                  <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                    <span>Host</span>
                    <span className="font-mono">db.elunari.uk</span>
                  </div>
                  <div className={cn("flex justify-between text-xs", isDark ? "text-gray-400" : "text-gray-500")}>
                    <span>Status</span>
                    <span className="font-mono text-amber-400">Check server / tunnel</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Workflow Cards */}
        <div>
          <h2 className={cn("text-xl font-bold mb-4", isDark ? "text-white" : "text-gray-900")}>Workflows</h2>
          {(!n8nStatus?.workflows || n8nStatus.workflows.length === 0) && !loading ? (
            <div className={cn("rounded-2xl border p-8 text-center", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200")}>
              <Workflow className={cn("w-10 h-10 mx-auto mb-3", isDark ? "text-gray-600" : "text-gray-300")} />
              <h3 className={cn("font-semibold mb-1", isDark ? "text-gray-300" : "text-gray-700")}>
                {n8nStatus?.connected ? "No workflows found" : "n8n is offline"}
              </h3>
              <p className={cn("text-sm max-w-md mx-auto", isDark ? "text-gray-500" : "text-gray-400")}>
                {n8nStatus?.connected
                  ? "Create workflows in the n8n editor to see them here."
                  : "Start n8n on the server (n8n.elunari.uk) to view and test workflows. All 5 automation modules will appear once connected."}
              </p>
              {/* Show expected workflows as disabled previews */}
              {!n8nStatus?.connected && (
                <div className="grid grid-cols-1 gap-3 mt-6 max-w-lg mx-auto text-left">
                  {Object.entries(WORKFLOW_META).map(([name, meta]) => {
                    const Icon = meta.icon;
                    return (
                      <div key={name} className={cn("flex items-center gap-3 rounded-xl border p-3 opacity-50", isDark ? "border-white/5 bg-white/[0.01]" : "border-gray-100 bg-gray-50")}>
                        <div className={cn("p-2 rounded-lg", meta.bg)}>
                          <Icon className={cn("w-4 h-4", meta.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("text-sm font-medium truncate", isDark ? "text-gray-300" : "text-gray-700")}>{name}</div>
                          <div className={cn("text-xs truncate", isDark ? "text-gray-500" : "text-gray-400")}>{meta.description}</div>
                        </div>
                        <span className={cn("px-2 py-0.5 rounded-full text-xs", isDark ? "bg-gray-800 text-gray-500" : "bg-gray-200 text-gray-400")}>Offline</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-4">
            {n8nStatus?.workflows.map((wf, i) => {
              const meta = WORKFLOW_META[wf.name] || {
                description: "n8n workflow",
                icon: Workflow,
                color: "text-gray-400",
                bg: "bg-gray-500/10",
              };
              const Icon = meta.icon;
              const testResult = testResults[wf.name];
              const isTesting = testingWorkflow === wf.name;

              return (
                <motion.div
                  key={wf.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (i + 1) }}
                  className={cn("rounded-2xl border p-6 group", isDark ? "bg-white/[0.02] border-white/5 hover:border-white/10" : "bg-white border-gray-200 hover:border-gray-300")}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={cn("p-3 rounded-xl", meta.bg)}>
                        <Icon className={cn("w-6 h-6", meta.color)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={cn("font-semibold", isDark ? "text-white" : "text-gray-900")}>{wf.name}</h3>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", wf.active ? "bg-emerald-500/10 text-emerald-400" : "bg-gray-500/10 text-gray-400")}>
                            {wf.active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className={cn("text-sm mb-3", isDark ? "text-gray-400" : "text-gray-500")}>{meta.description}</p>
                        <div className={cn("flex items-center gap-4 text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Updated {new Date(wf.updatedAt).toLocaleDateString()}
                          </span>
                          {wf.name.includes("Health") && (
                            <span className="flex items-center gap-1 text-emerald-400">
                              <Activity className="w-3 h-3" />
                              Cron: Every 5 min
                            </span>
                          )}
                          {!wf.name.includes("Health") && (
                            <span className="flex items-center gap-1 text-blue-400">
                              <Zap className="w-3 h-3" />
                              Webhook Trigger
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://n8n.elunari.uk/workflow/${wf.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn("p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100", isDark ? "hover:bg-white/5 text-gray-400" : "hover:bg-gray-100 text-gray-600")}
                        title="Open in n8n"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => testWorkflow(wf.name)}
                        disabled={isTesting || !wf.active}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                          isTesting
                            ? "bg-purple-500/20 text-purple-400 cursor-wait"
                            : testResult?.success
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : testResult && !testResult.success
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "bg-purple-500/10 text-purple-400 hover:bg-purple-500/20"
                        )}
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Testing...
                          </>
                        ) : testResult?.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Passed
                          </>
                        ) : testResult && !testResult.success ? (
                          <>
                            <XCircle className="w-4 h-4" /> Failed
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4" /> Test
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Test Result Expandable */}
                  <AnimatePresence>
                    {testResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 overflow-hidden"
                      >
                        <div className={cn("rounded-xl p-4 font-mono text-xs overflow-auto max-h-60", isDark ? "bg-black/40" : "bg-gray-50")}>
                          <pre className={cn("whitespace-pre-wrap", isDark ? "text-gray-300" : "text-gray-700")}>
                            {JSON.stringify(testResult.data || testResult.error, null, 2)}
                          </pre>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
          )}
        </div>

        {/* Outreach Result */}
        <AnimatePresence>
          {outreachResult && outreachResult.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn("rounded-2xl border p-6", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200")}
            >
              <h3 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                <Send className="w-5 h-5 text-blue-400" /> Generated Outreach Content
                {outreachResult.kokoroConnected && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400">Voice AI Active</span>
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <span className={cn("font-medium text-sm", isDark ? "text-gray-300" : "text-gray-700")}>Email Prompt</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs", isDark ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-600")}>
                      {outreachResult.tone}
                    </span>
                  </div>
                  <div className={cn("rounded-xl p-4 text-sm whitespace-pre-wrap", isDark ? "bg-black/40 text-gray-300" : "bg-gray-50 text-gray-700")}>
                    {outreachResult.emailPrompt}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-cyan-400" />
                    <span className={cn("font-medium text-sm", isDark ? "text-gray-300" : "text-gray-700")}>Voice Script (Kokoro)</span>
                    {outreachResult.voiceAudio && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-cyan-500/10 text-cyan-400">Audio Ready</span>
                    )}
                  </div>
                  <div className={cn("rounded-xl p-4 text-sm whitespace-pre-wrap", isDark ? "bg-black/40 text-gray-300" : "bg-gray-50 text-gray-700")}>
                    {outreachResult.voiceScript}
                  </div>
                  {/* Audio Player */}
                  {outreachResult.voiceAudio && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => {
                          if (audioUrl) {
                            URL.revokeObjectURL(audioUrl);
                            setAudioUrl(null);
                          }
                          const binary = atob(outreachResult.voiceAudio!.base64);
                          const bytes = new Uint8Array(binary.length);
                          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                          const blob = new Blob([bytes], { type: "audio/mpeg" });
                          const url = URL.createObjectURL(blob);
                          setAudioUrl(url);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition-all text-sm font-medium"
                      >
                        <Play className="w-4 h-4" /> Play Voice Message
                      </button>
                      {audioUrl && (
                        <audio controls autoPlay className="w-full mt-2" src={audioUrl}>
                          Your browser does not support audio playback.
                        </audio>
                      )}
                      <p className={cn("text-xs", isDark ? "text-gray-500" : "text-gray-400")}>
                        {outreachResult.voiceAudio.characterCount} characters | {outreachResult.voiceAudio.contentType}
                        {outreachResult.kokoroUsage && (
                          <> | {outreachResult.kokoroUsage.remaining.toLocaleString()} chars remaining</>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync Result */}
        <AnimatePresence>
          {syncResult && syncResult.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn("rounded-2xl border p-6", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200")}
            >
              <h3 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                <Database className="w-5 h-5 text-cyan-400" /> Synced Record
                {syncResult.airtable?.success && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/10 text-emerald-400">NocoDB Synced</span>
                )}
                {syncResult.n8n?.connected && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/10 text-purple-400">n8n Notified</span>
                )}
              </h3>
              {syncResult.airtable?.recordId && (
                <div className={cn("flex items-center gap-2 mb-3 text-sm", isDark ? "text-gray-400" : "text-gray-500")}>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  NocoDB Record ID: <span className="font-mono text-cyan-400">{syncResult.airtable.recordId}</span>
                </div>
              )}
              <div className={cn("rounded-xl p-4 font-mono text-xs overflow-auto max-h-60", isDark ? "bg-black/40 text-gray-300" : "bg-gray-50 text-gray-700")}>
                <pre className="whitespace-pre-wrap">{JSON.stringify(syncResult, null, 2)}</pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Result */}
        <AnimatePresence>
          {reportResult && reportResult.success && reportResult.report && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn("rounded-2xl border p-6", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200")}
            >
              <h3 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
                <BarChart3 className="w-5 h-5 text-amber-400" /> Pipeline Report
              </h3>
              {(() => {
                const report = reportResult.report as Record<string, unknown>;
                const summary = report?.summary as Record<string, unknown> | undefined;
                const insights = report?.insights as Record<string, unknown> | undefined;
                const topCandidates = report?.topCandidates as Record<string, unknown>[] | undefined;

                return (
                  <div className="space-y-4">
                    {/* Summary Stats */}
                    {summary && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: "Total Candidates", value: summary.totalCandidates, color: "text-purple-400" },
                          { label: "Qualified", value: summary.qualifiedCount, color: "text-emerald-400" },
                          { label: "Avg Score", value: summary.averageScore, color: "text-blue-400" },
                          { label: "Qualification Rate", value: summary.qualificationRate, color: "text-amber-400" },
                        ].map((stat) => (
                          <div key={stat.label} className={cn("rounded-xl p-4 text-center", isDark ? "bg-black/40" : "bg-gray-50")}>
                            <div className={cn("text-2xl font-bold", stat.color)}>{String(stat.value)}</div>
                            <div className={cn("text-xs mt-1", isDark ? "text-gray-500" : "text-gray-400")}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Top Skills + Gaps */}
                    {insights && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className={cn("text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>Top Skills in Pool</h4>
                          <div className="flex flex-wrap gap-2">
                            {((insights.topSkillsInPool as string[]) || []).map((skill: string) => (
                              <span key={skill} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded-lg text-xs">{skill}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className={cn("text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>Common Gaps</h4>
                          <div className="flex flex-wrap gap-2">
                            {((insights.commonGaps as string[]) || []).map((gap: string) => (
                              <span key={gap} className="px-2 py-1 bg-red-500/10 text-red-400 rounded-lg text-xs">{gap}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Top Candidates */}
                    {topCandidates && topCandidates.length > 0 && (
                      <div>
                        <h4 className={cn("text-sm font-medium mb-2", isDark ? "text-gray-300" : "text-gray-700")}>Top Candidates</h4>
                        <div className="space-y-2">
                          {topCandidates.map((c, i) => (
                            <div key={i} className={cn("flex items-center justify-between rounded-xl p-3", isDark ? "bg-black/40" : "bg-gray-50")}>
                              <div className="flex items-center gap-3">
                                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", i === 0 ? "bg-amber-500/20 text-amber-400" : "bg-gray-500/10 text-gray-400")}>
                                  {i + 1}
                                </span>
                                <span className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>{String(c.name)}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">{String(c.topStrength)}</span>
                                <span className={cn("font-mono font-bold", (c.score as number) >= 80 ? "text-emerald-400" : "text-amber-400")}>{String(c.score)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Architecture Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={cn("rounded-2xl border p-6", isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-gray-200")}
        >
          <h2 className={cn("text-lg font-semibold mb-4 flex items-center gap-2", isDark ? "text-white" : "text-gray-900")}>
            <Bot className="w-5 h-5 text-purple-400" /> Architecture
          </h2>
          <ArchitectureFlow
            height={680}
            className={cn(
              "rounded-2xl border p-3",
              isDark
                ? "border-purple-500/20 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-transparent"
                : "border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-transparent"
            )}
          />
        </motion.div>
          </div>
          {autoTips.length > 0 && (
            <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0 self-start sticky top-20 pr-1">
              <PageTips page="automations" />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
