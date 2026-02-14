// NocoDB integration for TalentFlow AI
// Replaces AirTable — self-hosted, free, AirTable-compatible REST API
// Runs on the server laptop at https://db.elunari.uk

const NOCODB_URL = process.env.NOCODB_URL || "https://db.elunari.uk";
const NOCODB_API_TOKEN = process.env.NOCODB_API_TOKEN || "";
const NOCODB_TABLE_ID = process.env.NOCODB_TABLE_ID || "";

const headers = (): Record<string, string> => ({
  "xc-token": NOCODB_API_TOKEN,
  "Content-Type": "application/json",
});

interface CandidateRecord {
  name: string;
  email?: string;
  phone?: string;
  score: number;
  recommendation: string;
  skills: string[];
  jobTitle: string;
  model: string;
  processedAt: string;
}

// Map internal recommendation codes to human-readable values
function formatRecommendation(rec: string): string {
  const map: Record<string, string> = {
    strong_match: "Strong Match",
    potential_match: "Potential Match",
    no_match: "No Match",
  };
  return map[rec] || rec;
}

/**
 * Push a candidate record to NocoDB.
 * NocoDB v2 API: POST /api/v2/meta/bases/:tableId/records
 */
export async function pushToNocoDB(candidate: CandidateRecord): Promise<{
  success: boolean;
  recordId?: string;
  error?: string;
}> {
  if (!NOCODB_API_TOKEN || !NOCODB_TABLE_ID) {
    return { success: false, error: "NocoDB not configured (missing NOCODB_API_TOKEN or NOCODB_TABLE_ID)" };
  }

  try {
    const response = await fetch(`${NOCODB_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        Name: candidate.name,
        Email: candidate.email || "",
        Phone: candidate.phone || "",
        Score: candidate.score,
        Recommendation: formatRecommendation(candidate.recommendation),
        Skills: (candidate.skills || []).join(", "),
        "Job Title": candidate.jobTitle,
        "Model Used": candidate.model,
        "Processed At": candidate.processedAt,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `NocoDB API error: ${response.status} — ${err}` };
    }

    const data = await response.json();
    const recordId = data?.Id?.toString() || data?.id?.toString();
    return { success: true, recordId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown NocoDB error",
    };
  }
}

/**
 * Retrieve recent candidate records from NocoDB.
 * NocoDB v2 API: GET /api/v2/tables/:tableId/records
 */
export async function getNocoDBRecords(maxRecords = 10): Promise<{
  success: boolean;
  records?: Array<Record<string, unknown>>;
  total?: number;
  error?: string;
}> {
  if (!NOCODB_API_TOKEN || !NOCODB_TABLE_ID) {
    return { success: false, error: "NocoDB not configured (missing NOCODB_API_TOKEN or NOCODB_TABLE_ID)" };
  }

  try {
    const params = new URLSearchParams({
      limit: maxRecords.toString(),
      sort: "-Processed At",
    });

    const response = await fetch(`${NOCODB_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records?${params}`, {
      headers: headers(),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `NocoDB API error: ${response.status} — ${err}` };
    }

    const data = await response.json();
    return {
      success: true,
      records: data.list || [],
      total: data.pageInfo?.totalRows ?? (data.list?.length || 0),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown NocoDB error",
    };
  }
}

/**
 * Check NocoDB connectivity — used by the automations dashboard.
 */
export async function checkNocoDBStatus(): Promise<{
  connected: boolean;
  recordCount?: number;
  tableName?: string;
  error?: string;
}> {
  if (!NOCODB_API_TOKEN || !NOCODB_TABLE_ID) {
    return { connected: false, error: "NocoDB not configured" };
  }

  try {
    const params = new URLSearchParams({ limit: "1" });
    const response = await fetch(`${NOCODB_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records?${params}`, {
      headers: headers(),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return { connected: false, error: `API returned ${response.status}` };
    }

    const data = await response.json();
    return {
      connected: true,
      recordCount: data.pageInfo?.totalRows ?? 0,
      tableName: "Candidates",
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

// ── Backward-compatible exports (drop-in replacement for lib/airtable.ts) ──

export const pushToAirTable = pushToNocoDB;
export const getAirTableRecords = async (maxRecords = 10) => {
  const result = await getNocoDBRecords(maxRecords);
  // Map NocoDB response shape to match the old AirTable shape expected by consumers
  if (result.success && result.records) {
    return {
      success: true,
      records: result.records.map((r) => ({
        id: r.Id || r.id,
        fields: {
          Name: r.Name,
          Email: r.Email,
          Phone: r.Phone,
          Score: r.Score,
          Recommendation: r.Recommendation,
          Skills: r.Skills,
          "Job Title": r["Job Title"],
          "Model Used": r["Model Used"],
          "Processed At": r["Processed At"],
        },
      })),
      total: result.total,
    };
  }
  return result;
};
