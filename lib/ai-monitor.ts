/**
 * AI Monitor — wraps LLM calls with metrics tracking.
 * Provides data for the /api/health endpoint and WF4 health checks.
 */

interface AIMetrics {
  totalRequests: number;
  totalErrors: number;
  totalTokensEstimated: number;
  avgLatencyMs: number;
  lastRequestAt: string | null;
  lastError: string | null;
  lastErrorAt: string | null;
  requestLog: { timestamp: string; latencyMs: number; model: string; success: boolean }[];
}

interface HealthStatus {
  status: "healthy" | "degraded";
  uptime: string;
  uptimeMs: number;
  timestamp: string;
  version: string;
  ai: Omit<AIMetrics, "requestLog"> & { errorRate: string; requestLog?: undefined };
  n8n: {
    url: string;
    configured: boolean;
    connected: boolean;
    error?: string;
  };
  nocodb: {
    connected: boolean;
    recordCount?: number;
    error?: string;
  };
}

const MAX_LOG_ENTRIES = 100;

// In-memory metrics (resets on cold start — fine for demo, use Redis in production)
const metrics: AIMetrics = {
  totalRequests: 0,
  totalErrors: 0,
  totalTokensEstimated: 0,
  avgLatencyMs: 0,
  lastRequestAt: null,
  lastError: null,
  lastErrorAt: null,
  requestLog: [],
};

const startTime = Date.now();

export function recordAIRequest(model: string, latencyMs: number, success: boolean, error?: string, tokensEstimate?: number) {
  metrics.totalRequests++;
  metrics.lastRequestAt = new Date().toISOString();

  if (!success) {
    metrics.totalErrors++;
    metrics.lastError = error || "Unknown error";
    metrics.lastErrorAt = new Date().toISOString();
  }

  if (tokensEstimate) {
    metrics.totalTokensEstimated += tokensEstimate;
  }

  // Running average
  metrics.avgLatencyMs = Math.round(
    ((metrics.avgLatencyMs * (metrics.totalRequests - 1)) + latencyMs) / metrics.totalRequests
  );

  metrics.requestLog.push({
    timestamp: new Date().toISOString(),
    latencyMs,
    model,
    success,
  });

  if (metrics.requestLog.length > MAX_LOG_ENTRIES) {
    metrics.requestLog = metrics.requestLog.slice(-MAX_LOG_ENTRIES);
  }
}

export function getAIMetrics() {
  return {
    ...metrics,
    errorRate: metrics.totalRequests > 0
      ? `${((metrics.totalErrors / metrics.totalRequests) * 100).toFixed(1)}%`
      : "0%",
    requestLog: undefined, // Don't expose full log in health endpoint
  };
}

function formatUptime(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = uptimeMs / 60000;
  if (minutes < 60) return `${minutes.toFixed(1)}m`;

  const hours = uptimeMs / 3600000;
  if (hours < 24) return `${hours.toFixed(2)}h`;

  const days = uptimeMs / 86400000;
  return `${days.toFixed(1)}d`;
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const [{ checkNocoDBStatus }, { getN8nStatus }] = await Promise.all([
    import("@/lib/nocodb"),
    import("@/lib/n8n"),
  ]);

  const [nocodbStatus, n8nStatus] = await Promise.all([
    checkNocoDBStatus(),
    getN8nStatus(),
  ]);

  const uptimeMs = Date.now() - startTime;
  const aiMetrics = getAIMetrics();
  const persistentRequestCount = nocodbStatus.recordCount ?? 0;
  const totalRequests = Math.max(aiMetrics.totalRequests, persistentRequestCount);
  const totalErrors = aiMetrics.totalErrors;
  const errorRate = totalRequests > 0
    ? `${((totalErrors / totalRequests) * 100).toFixed(1)}%`
    : "0%";

  const configuredN8nUrl = process.env.N8N_URL || process.env.NEXT_PUBLIC_N8N_URL || "https://n8n.elunari.uk";
  const n8nConfigured = Boolean(process.env.N8N_API_KEY);
  const overallStatus: HealthStatus["status"] = n8nStatus.connected ? "healthy" : "degraded";

  return {
    status: overallStatus,
    uptime: formatUptime(uptimeMs),
    uptimeMs,
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    ai: {
      ...aiMetrics,
      totalRequests,
      totalErrors,
      errorRate,
    },
    n8n: {
      url: configuredN8nUrl,
      configured: n8nConfigured,
      connected: n8nStatus.connected,
      error: n8nStatus.error,
    },
    nocodb: {
      connected: nocodbStatus.connected,
      recordCount: nocodbStatus.recordCount,
      error: nocodbStatus.error,
    },
  };
}
