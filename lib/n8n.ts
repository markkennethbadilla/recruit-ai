/**
 * n8n Integration Client
 * 
 * Handles communication between TalentFlow AI and n8n workflows.
 * Each function fires a webhook to the corresponding n8n workflow.
 * All calls are fire-and-forget (non-blocking) so the UI stays fast.
 */

const N8N_URL = process.env.N8N_URL || process.env.NEXT_PUBLIC_N8N_URL || "http://localhost:5678";

export interface N8nWebhookResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  workflow?: string;
}

async function fireWebhook(path: string, payload: Record<string, unknown>, workflow: string): Promise<N8nWebhookResult> {
  try {
    const url = `${N8N_URL}/webhook/${path}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return { success: false, error: `${res.status}: ${text}`, workflow };
    }

    const data = await res.json().catch(() => ({}));
    return { success: true, data, workflow };
  } catch (err) {
    // Non-blocking: log but don't throw
    const message = err instanceof Error ? err.message : "n8n webhook failed";
    console.warn(`[n8n] ${workflow} webhook failed:`, message);
    return { success: false, error: message, workflow };
  }
}

/**
 * WF1: Candidate Intake Pipeline
 * Fires after a candidate is fully processed (parsed + scored + questions generated).
 * Routes by score, builds notification, logs the event.
 */
export async function notifyCandidateProcessed(payload: {
  candidateName: string;
  candidateEmail: string;
  parsedResume: Record<string, unknown>;
  scoring: Record<string, unknown>;
  questions: unknown[];
  jobTitle: string;
}): Promise<N8nWebhookResult> {
  return fireWebhook("candidate-intake", payload, "WF1: Candidate Intake");
}

/**
 * WF2: Smart Outreach Generator
 * Generates personalized outreach content (email + voice script) for a candidate.
 */
export async function generateOutreach(payload: {
  candidateName: string;
  candidateEmail: string;
  overallScore: number;
  strengths: string[];
  gaps: string[];
  jobTitle: string;
  companyName?: string;
}): Promise<N8nWebhookResult> {
  return fireWebhook("smart-outreach", payload, "WF2: Smart Outreach");
}

/**
 * WF3: Candidate Data Sync
 * Pushes candidate data to external storage (AirTable/CRM-ready format).
 */
export async function syncCandidate(payload: {
  candidateName: string;
  candidateEmail: string;
  parsedResume: Record<string, unknown>;
  scoring: Record<string, unknown>;
  questions: unknown[];
  jobTitle: string;
  candidateId?: string;
}): Promise<N8nWebhookResult> {
  return fireWebhook("candidate-sync", payload, "WF3: Data Sync");
}

/**
 * WF5: Weekly Pipeline Report
 * Generates analytics from a batch of processed candidates.
 */
export async function generatePipelineReport(payload: {
  candidates: Record<string, unknown>[];
  period?: string;
}): Promise<N8nWebhookResult> {
  return fireWebhook("pipeline-report", payload, "WF5: Pipeline Report");
}

/**
 * Get n8n connection status and workflow info.
 * Used by the Automations dashboard.
 */
export async function getN8nStatus(): Promise<{
  connected: boolean;
  workflows: { id: string; name: string; active: boolean; createdAt: string; updatedAt: string }[];
  error?: string;
}> {
  try {
    const apiKey = process.env.N8N_API_KEY;
    if (!apiKey) return { connected: false, workflows: [], error: "N8N_API_KEY not configured" };

    const res = await fetch(`${N8N_URL}/api/v1/workflows`, {
      headers: { "X-N8N-API-KEY": apiKey },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return { connected: false, workflows: [], error: `API returned ${res.status}` };

    const { data } = await res.json();
    return {
      connected: true,
      workflows: data.map((wf: Record<string, unknown>) => ({
        id: wf.id,
        name: wf.name,
        active: wf.active,
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt,
      })),
    };
  } catch (err) {
    return { connected: false, workflows: [], error: err instanceof Error ? err.message : "Connection failed" };
  }
}
