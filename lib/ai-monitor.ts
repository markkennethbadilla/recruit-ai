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

export function getHealthStatus() {
  const uptimeMs = Date.now() - startTime;
  const uptimeHours = (uptimeMs / 3600000).toFixed(2);

  return {
    status: "healthy" as const,
    uptime: `${uptimeHours}h`,
    uptimeMs,
    timestamp: new Date().toISOString(),
    version: "2.0.0",
    ai: getAIMetrics(),
    n8n: {
      url: process.env.N8N_URL || process.env.NEXT_PUBLIC_N8N_URL || "http://localhost:5678",
      configured: true,
    },
  };
}
