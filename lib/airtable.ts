// AirTable integration for TalentFlow AI
// Pushes candidate data to AirTable after pipeline processing

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "";
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || "Candidates";

const AIRTABLE_API = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`;

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

// Map internal recommendation codes to human-readable AirTable values
function formatRecommendation(rec: string): string {
  const map: Record<string, string> = {
    strong_match: "Strong Match",
    potential_match: "Potential Match",
    no_match: "No Match",
  };
  return map[rec] || rec;
}

export async function pushToAirTable(candidate: CandidateRecord): Promise<{
  success: boolean;
  recordId?: string;
  error?: string;
}> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return { success: false, error: "AirTable not configured" };
  }

  try {
    const response = await fetch(AIRTABLE_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        typecast: true, // Auto-create select options if they don't exist
        records: [
          {
            fields: {
              Name: candidate.name,
              Email: candidate.email || "",
              Phone: candidate.phone || "",
              Score: candidate.score,
              Recommendation: formatRecommendation(candidate.recommendation),
              Skills: (candidate.skills || []).join(", "),
              "Job Title": candidate.jobTitle,
              "Model Used": candidate.model,
              "Processed At": candidate.processedAt,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        error: err.error?.message || `AirTable API error: ${response.status}`,
      };
    }

    const data = await response.json();
    const recordId = data.records?.[0]?.id;
    return { success: true, recordId };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown AirTable error",
    };
  }
}

export async function getAirTableRecords(maxRecords = 10): Promise<{
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records?: any[];
  error?: string;
}> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return { success: false, error: "AirTable not configured" };
  }

  try {
    const response = await fetch(
      `${AIRTABLE_API}?maxRecords=${maxRecords}&sort%5B0%5D%5Bfield%5D=Processed+At&sort%5B0%5D%5Bdirection%5D=desc`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      return {
        success: false,
        error: err.error?.message || `AirTable API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, records: data.records };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown AirTable error",
    };
  }
}
